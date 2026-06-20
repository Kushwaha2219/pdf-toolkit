"""PDFVish — Flask API + static host for the React frontend.

All processing happens locally on this machine: files are written to ./uploads,
results to ./outputs, and nothing leaves the box.
"""

import json
import os
import shutil
import ssl as ssl_lib
import tempfile
import uuid
from urllib.parse import quote_plus

from dotenv import load_dotenv
from flask import (
    Flask,
    jsonify,
    make_response,
    request,
    send_file,
    send_from_directory,
)
from flask_cors import CORS
from werkzeug.utils import secure_filename

from models import db
from auth import auth_bp

load_dotenv()

from utils.merge import merge_pdfs
from utils.split import split_pdf
from utils.compress import compress_pdf
from utils.convert import (
    pdf_to_docx,
    images_to_pdf,
    pdf_to_jpg_zip,
    pdf_to_pptx,
    pdf_to_xlsx,
    office_to_pdf,
)
from utils.protect import protect_pdf, unlock_pdf
from utils.edit import edit_pages, add_watermark, apply_annotations
from utils.sign import sign_pdf

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")
STATIC_DIR = os.path.join(BASE_DIR, "static")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100 MB per request

# --------------------------------------------------------------------------- #
# Database / auth configuration (read from environment / .env)
#
# DB_ENGINE selects the backend:
#   "sqlite" (default) -> a local file (users.db); no server, no admin needed.
#   "mysql"            -> MySQL/MariaDB using the MYSQL_* settings below.
# The User model and all auth code are identical either way (SQLAlchemy), so
# switching to MySQL on a deployed server is just an env change.
# --------------------------------------------------------------------------- #
DB_ENGINE = os.environ.get("DB_ENGINE", "sqlite").lower()

DB_HOST = os.environ.get("MYSQL_HOST", "localhost")
DB_PORT = os.environ.get("MYSQL_PORT", "3306")
DB_USER = os.environ.get("MYSQL_USER", "root")
DB_PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
DB_NAME = os.environ.get("MYSQL_DB", "pdfvish")

if DB_ENGINE == "mysql":
    DB_URI = (
        f"mysql+pymysql://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )
else:
    DB_URI = "sqlite:///" + os.path.join(BASE_DIR, "users.db")


def _mysql_connect_args():
    """TLS settings for connecting to a (usually hosted) MySQL server.

    Most managed MySQL providers require an encrypted connection, so SSL is on
    by default for MySQL. Two modes:

      * MYSQL_SSL_CA set (path to the provider's CA cert, e.g. a Render secret
        file at /etc/secrets/ca.pem) -> full TLS with certificate verification.
      * No CA provided but MYSQL_SSL=true (default) -> encrypt the connection
        without verifying the cert. Connects to any provider out of the box;
        set a CA later to harden it.

    Set MYSQL_SSL=false to disable TLS entirely (e.g. a local MySQL).
    """
    ca = os.environ.get("MYSQL_SSL_CA")
    use_ssl = os.environ.get("MYSQL_SSL", "true").lower() == "true"
    if ca:
        return {"ssl": {"ca": ca}}
    if use_ssl:
        ctx = ssl_lib.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl_lib.CERT_NONE
        return {"ssl": ctx}
    return {}

app = Flask(__name__, static_folder=None)
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-change-me")
app.config["SQLALCHEMY_DATABASE_URI"] = DB_URI
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
# pool_pre_ping recycles connections that a hosted DB silently dropped while
# idle (avoids "MySQL server has gone away"). For MySQL, also pass TLS args.
_engine_options = {"pool_pre_ping": True}
if DB_ENGINE == "mysql":
    _engine_options["connect_args"] = _mysql_connect_args()
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = _engine_options
# When true, password-reset links are returned in the API response (for local
# testing). Set AUTH_DEV_MODE=false in production once email delivery is wired.
app.config["AUTH_DEV_MODE"] = (
    os.environ.get("AUTH_DEV_MODE", "true").lower() == "true"
)
CORS(app)

db.init_app(app)
app.register_blueprint(auth_bp)


def _ensure_user_columns():
    """Add email-verification columns to an existing `users` table if missing.

    create_all() only creates new tables; it never alters existing ones. Since
    the table may predate the verification feature, we add the columns here.
    Works on both SQLite and MySQL (plain ADD COLUMN, no IF NOT EXISTS).
    """
    from sqlalchemy import inspect as sa_inspect, text

    inspector = sa_inspect(db.engine)
    if "users" not in inspector.get_table_names():
        return  # create_all() will have made it with all columns already

    existing = {col["name"] for col in inspector.get_columns("users")}
    additions = {
        "is_verified": "ALTER TABLE users ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 0",
        "verification_code": "ALTER TABLE users ADD COLUMN verification_code VARCHAR(6)",
        "verification_expires": "ALTER TABLE users ADD COLUMN verification_expires DATETIME",
        "plan": "ALTER TABLE users ADD COLUMN plan VARCHAR(20)",
    }
    added = []
    for column, sql in additions.items():
        if column not in existing:
            db.session.execute(text(sql))
            added.append(column)

    if added:
        # Grandfather in any pre-existing accounts so new rules don't lock them
        # out (they were created before these features existed).
        if "is_verified" in added:
            db.session.execute(text("UPDATE users SET is_verified = 1"))
        if "plan" in added:
            db.session.execute(text("UPDATE users SET plan = 'free'"))
        db.session.commit()
        print(f"[auth] Added columns: {', '.join(added)}")


def _init_database():
    """Create the database (if needed) and all tables on startup."""
    try:
        # For MySQL, try to create the schema first. This is best-effort: a
        # dedicated app user may not hold the global CREATE privilege, in which
        # case the database is expected to already exist (see db-setup.sql).
        # SQLite needs no such step — create_all() makes the file.
        if DB_ENGINE == "mysql":
            try:
                import pymysql

                conn = pymysql.connect(
                    host=DB_HOST,
                    port=int(DB_PORT),
                    user=DB_USER,
                    password=DB_PASSWORD,
                    **_mysql_connect_args(),
                )
                try:
                    with conn.cursor() as cur:
                        cur.execute(
                            f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` "
                            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
                        )
                    conn.commit()
                finally:
                    conn.close()
            except Exception as exc:  # noqa: BLE001
                print(
                    f"[auth] Note: skipped auto-create of database ({exc}); "
                    "assuming it already exists."
                )

        with app.app_context():
            db.create_all()
            _ensure_user_columns()
        print(f"[auth] Database ready ({DB_ENGINE}).")
    except Exception as exc:  # noqa: BLE001 — surface config issues, keep app up
        print(
            f"[auth] WARNING: could not initialise the database ({exc}). "
            "Auth endpoints will fail until it is reachable."
        )


_init_database()


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def _job_dir():
    """Create and return a unique scratch directory for one request."""
    path = os.path.join(UPLOAD_DIR, uuid.uuid4().hex)
    os.makedirs(path, exist_ok=True)
    return path


def _save_uploads(files, job_dir):
    """Persist the given werkzeug files into job_dir, returning their paths."""
    paths = []
    for f in files:
        name = secure_filename(f.filename) or f"file_{len(paths)}"
        dest = os.path.join(job_dir, name)
        f.save(dest)
        paths.append(dest)
    return paths


def _send_and_cleanup(result_path, download_name, mimetype, *cleanup_dirs):
    """Stream a result file to the client, then delete scratch directories."""
    response = make_response(
        send_file(
            result_path,
            as_attachment=True,
            download_name=download_name,
            mimetype=mimetype,
        )
    )

    # call_on_close lives on the response, and fires after the body is sent —
    # so the scratch dirs are removed only once the download has streamed out.
    @response.call_on_close
    def _cleanup():
        for d in cleanup_dirs:
            shutil.rmtree(d, ignore_errors=True)

    return response


def _require_files(field="files", min_count=1):
    files = request.files.getlist(field)
    files = [f for f in files if f and f.filename]
    if len(files) < min_count:
        raise ValueError(
            f"Expected at least {min_count} file(s) in field '{field}'."
        )
    return files


# --------------------------------------------------------------------------- #
# API routes
# --------------------------------------------------------------------------- #
@app.route("/api/health")
def health():
    return jsonify(status="ok")


@app.route("/api/merge", methods=["POST"])
def api_merge():
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        files = _require_files("files", min_count=2)
        paths = _save_uploads(files, job)
        result = os.path.join(out, "merged.pdf")
        merge_pdfs(paths, result)
    except ValueError as e:
        shutil.rmtree(job, ignore_errors=True)
        shutil.rmtree(out, ignore_errors=True)
        return jsonify(error=str(e)), 400

    return _send_and_cleanup(
        result, "merged.pdf", "application/pdf", job, out
    )


@app.route("/api/split", methods=["POST"])
def api_split():
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        files = _require_files("files", min_count=1)
        path = _save_uploads(files, job)[0]
        ranges = request.form.get("ranges", "")
        result = os.path.join(out, "split.zip")
        split_pdf(path, out, result, ranges=ranges)
    except ValueError as e:
        shutil.rmtree(job, ignore_errors=True)
        shutil.rmtree(out, ignore_errors=True)
        return jsonify(error=str(e)), 400

    return _send_and_cleanup(
        result, "split.zip", "application/zip", job, out
    )


@app.route("/api/compress", methods=["POST"])
def api_compress():
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        files = _require_files("files", min_count=1)
        path = _save_uploads(files, job)[0]
        result = os.path.join(out, "compressed.pdf")
        compress_pdf(path, result)
    except ValueError as e:
        shutil.rmtree(job, ignore_errors=True)
        shutil.rmtree(out, ignore_errors=True)
        return jsonify(error=str(e)), 400

    return _send_and_cleanup(
        result, "compressed.pdf", "application/pdf", job, out
    )


@app.route("/api/convert", methods=["POST"])
def api_convert():
    """Convert PDF→Word, or images→PDF, depending on the `target` field."""
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        target = request.form.get("target", "docx").lower()
        files = _require_files("files", min_count=1)
        paths = _save_uploads(files, job)

        if target == "docx":
            result = os.path.join(out, "converted.docx")
            pdf_to_docx(paths[0], result)
            return _send_and_cleanup(
                result,
                "converted.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                job,
                out,
            )
        elif target == "pdf":
            result = os.path.join(out, "converted.pdf")
            images_to_pdf(paths, result)
            return _send_and_cleanup(
                result, "converted.pdf", "application/pdf", job, out
            )
        else:
            raise ValueError(f"Unsupported conversion target: {target}")
    except ValueError as e:
        shutil.rmtree(job, ignore_errors=True)
        shutil.rmtree(out, ignore_errors=True)
        return jsonify(error=str(e)), 400


@app.route("/api/protect", methods=["POST"])
def api_protect():
    """Encrypt (mode=protect) or decrypt (mode=unlock) a PDF with a password."""
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        mode = request.form.get("mode", "protect").lower()
        password = request.form.get("password", "")
        files = _require_files("files", min_count=1)
        path = _save_uploads(files, job)[0]

        if mode == "unlock":
            result = os.path.join(out, "unlocked.pdf")
            unlock_pdf(path, result, password)
            name = "unlocked.pdf"
        else:
            result = os.path.join(out, "protected.pdf")
            protect_pdf(path, result, password)
            name = "protected.pdf"
    except ValueError as e:
        shutil.rmtree(job, ignore_errors=True)
        shutil.rmtree(out, ignore_errors=True)
        return jsonify(error=str(e)), 400

    return _send_and_cleanup(result, name, "application/pdf", job, out)


PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"


def _fail(job, out, message, code=400):
    """Clean up scratch dirs and return a JSON error."""
    shutil.rmtree(job, ignore_errors=True)
    shutil.rmtree(out, ignore_errors=True)
    return jsonify(error=message), code


@app.route("/api/pdf-to-jpg", methods=["POST"])
def api_pdf_to_jpg():
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        path = _save_uploads(_require_files("files", 1), job)[0]
        # Quality is user-selectable; clamp to a safe allow-list of DPIs.
        try:
            dpi = int(request.form.get("dpi", 150))
        except (TypeError, ValueError):
            dpi = 150
        if dpi not in (150, 300, 600):
            dpi = 150
        result = os.path.join(out, "images.zip")
        pdf_to_jpg_zip(path, out, result, dpi=dpi)
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(result, "images.zip", "application/zip", job, out)


@app.route("/api/jpg-to-pdf", methods=["POST"])
def api_jpg_to_pdf():
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        paths = _save_uploads(_require_files("files", 1), job)
        result = os.path.join(out, "images.pdf")
        images_to_pdf(paths, result)
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(result, "images.pdf", "application/pdf", job, out)


@app.route("/api/pdf-to-pptx", methods=["POST"])
def api_pdf_to_pptx():
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        path = _save_uploads(_require_files("files", 1), job)[0]
        result = os.path.join(out, "converted.pptx")
        pdf_to_pptx(path, result)
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(result, "converted.pptx", PPTX_MIME, job, out)


@app.route("/api/pdf-to-excel", methods=["POST"])
def api_pdf_to_excel():
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        path = _save_uploads(_require_files("files", 1), job)[0]
        result = os.path.join(out, "converted.xlsx")
        pdf_to_xlsx(path, result)
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(result, "converted.xlsx", XLSX_MIME, job, out)


@app.route("/api/office-to-pdf", methods=["POST"])
def api_office_to_pdf():
    """Convert Word/PowerPoint/Excel to PDF via LibreOffice headless."""
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        path = _save_uploads(_require_files("files", 1), job)[0]
        produced = office_to_pdf(path, out)
        base = os.path.splitext(os.path.basename(path))[0]
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(produced, f"{base}.pdf", "application/pdf", job, out)


@app.route("/api/edit/pages", methods=["POST"])
def api_edit_pages():
    """Rotate / delete / extract / reorder pages."""
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        path = _save_uploads(_require_files("files", 1), job)[0]
        operation = request.form.get("operation", "rotate")
        pages = request.form.get("pages", "")
        angle = int(request.form.get("angle", 90))
        order_raw = request.form.get("order", "")
        order = [int(x) for x in order_raw.split(",") if x.strip()] if order_raw else None
        result = os.path.join(out, "edited.pdf")
        edit_pages(path, result, operation, pages=pages, angle=angle, order=order)
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(result, "edited.pdf", "application/pdf", job, out)


@app.route("/api/edit/watermark", methods=["POST"])
def api_edit_watermark():
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        path = _save_uploads(_require_files("files", 1), job)[0]
        text = request.form.get("text", "").strip()
        if not text:
            raise ValueError("Watermark text is required.")
        result = os.path.join(out, "watermarked.pdf")
        add_watermark(path, result, text)
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(result, "watermarked.pdf", "application/pdf", job, out)


@app.route("/api/edit/annotate", methods=["POST"])
def api_edit_annotate():
    """Apply text/highlight/rect annotations (sent as JSON in `annotations`)."""
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        path = _save_uploads(_require_files("files", 1), job)[0]
        try:
            annotations = json.loads(request.form.get("annotations", "[]"))
        except json.JSONDecodeError:
            raise ValueError("Invalid annotations payload.")
        result = os.path.join(out, "annotated.pdf")
        apply_annotations(path, result, annotations)
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(result, "annotated.pdf", "application/pdf", job, out)


@app.route("/api/sign", methods=["POST"])
def api_sign():
    """Digitally sign a PDF with an uploaded .pfx/.p12 certificate."""
    job = _job_dir()
    out = tempfile.mkdtemp(dir=OUTPUT_DIR)
    try:
        pdf_files = request.files.getlist("files")
        cert_file = request.files.get("certificate")
        pdf_files = [f for f in pdf_files if f and f.filename]
        if not pdf_files:
            raise ValueError("A PDF file is required.")
        if not cert_file or not cert_file.filename:
            raise ValueError("A .pfx/.p12 certificate is required.")

        pdf_path = _save_uploads(pdf_files, job)[0]
        cert_path = os.path.join(job, secure_filename(cert_file.filename) or "cert.pfx")
        cert_file.save(cert_path)
        password = request.form.get("password", "")
        reason = request.form.get("reason", "")
        location = request.form.get("location", "")

        result = os.path.join(out, "signed.pdf")
        sign_pdf(pdf_path, result, cert_path, password, reason=reason, location=location)
    except ValueError as e:
        return _fail(job, out, str(e))
    return _send_and_cleanup(result, "signed.pdf", "application/pdf", job, out)


@app.errorhandler(413)
def too_large(_e):
    return jsonify(error="File too large (100 MB limit)."), 413


# --------------------------------------------------------------------------- #
# Serve the built React app (production). In dev, Vite serves the frontend.
# --------------------------------------------------------------------------- #
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    candidate = os.path.join(STATIC_DIR, path)
    if path and os.path.exists(candidate) and os.path.isfile(candidate):
        return send_from_directory(STATIC_DIR, path)
    index = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index):
        return send_from_directory(STATIC_DIR, "index.html")
    return jsonify(
        message="PDFVish API is running. Build the frontend to serve the UI."
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
