"""Authentication blueprint for PDFVish.

Endpoints (all under /api/auth):
    POST /signup  -> create an account, returns { token, user }
    POST /login   -> authenticate, returns { token, user }
    GET  /me      -> current user (requires Bearer token)

Passwords are stored only as salted hashes (werkzeug pbkdf2/scrypt). Sessions
are stateless JWTs signed with the app SECRET_KEY — a good fit for the planned
mobile app, since the token can be stored on-device and sent as a header.
"""

import re
import secrets
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from models import User, db
from utils.mailer import email_configured, send_email, verification_email_html

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TOKEN_TTL = timedelta(days=7)
RESET_TTL = timedelta(minutes=30)
VERIFY_TTL = timedelta(minutes=15)


def _set_verification_code(user):
    """Generate a fresh 6-digit code on the user and return it."""
    code = f"{secrets.randbelow(1_000_000):06d}"
    user.verification_code = code
    user.verification_expires = datetime.utcnow() + VERIFY_TTL
    return code


def _send_verification(user, code):
    """Email the code via Resend. Returns True if the email was sent."""
    return send_email(
        user.email,
        "Your PDFVish verification code",
        verification_email_html(user.name, code),
    )


def _make_token(user):
    payload = {
        "sub": str(user.id),
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + TOKEN_TTL,
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def _make_reset_token(user):
    """Short-lived, single-purpose token for password resets."""
    payload = {
        "sub": str(user.id),
        "purpose": "reset",
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + RESET_TTL,
    }
    return jwt.encode(payload, current_app.config["SECRET_KEY"], algorithm="HS256")


def token_required(fn):
    """Decorator: require a valid Bearer token; sets g.current_user."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return jsonify(error="Authentication required."), 401

        token = header.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(
                token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
            )
        except jwt.ExpiredSignatureError:
            return jsonify(error="Session expired. Please log in again."), 401
        except jwt.InvalidTokenError:
            return jsonify(error="Invalid authentication token."), 401

        user = db.session.get(User, int(payload["sub"]))
        if not user:
            return jsonify(error="Account no longer exists."), 401

        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name:
        return jsonify(error="Name is required."), 400
    if not EMAIL_RE.match(email):
        return jsonify(error="Please enter a valid email address."), 400
    if len(password) < 8:
        return jsonify(error="Password must be at least 8 characters."), 400

    existing = User.query.filter_by(email=email).first()
    if existing and existing.is_verified:
        return jsonify(error="An account with this email already exists."), 409

    # Reuse an unverified record if they're signing up again with the same email.
    user = existing or User(email=email)
    user.name = name
    user.password_hash = generate_password_hash(password)
    user.is_verified = False
    code = _set_verification_code(user)

    if not existing:
        db.session.add(user)
    db.session.commit()

    sent = _send_verification(user, code)
    if not sent and not current_app.config.get("AUTH_DEV_MODE"):
        return jsonify(
            error="Could not send the verification email. Please try again later."
        ), 502

    # No token yet — the account isn't usable until the email is verified.
    resp = {
        "message": "We've sent a 6-digit verification code to your email.",
        "email": email,
        "needs_verification": True,
    }
    # DEV ONLY: surface the code when email delivery isn't configured, so the
    # flow can be tested without a Resend key.
    if not sent and current_app.config.get("AUTH_DEV_MODE"):
        resp["dev_code"] = code
    return jsonify(resp), 201


@auth_bp.route("/verify", methods=["POST"])
def verify_email():
    """Confirm a 6-digit code and, on success, log the user in (returns token)."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify(error="No account found for that email."), 404
    if user.is_verified:
        return jsonify(token=_make_token(user), user=user.to_dict())
    if not user.verification_code or not user.verification_expires:
        return jsonify(error="No pending verification. Please sign up again."), 400
    if datetime.utcnow() > user.verification_expires:
        return jsonify(error="This code has expired. Request a new one."), 400
    if not secrets.compare_digest(code, user.verification_code):
        return jsonify(error="Incorrect code. Please check and try again."), 400

    user.is_verified = True
    user.verification_code = None
    user.verification_expires = None
    db.session.commit()

    return jsonify(token=_make_token(user), user=user.to_dict())


@auth_bp.route("/resend", methods=["POST"])
def resend_code():
    """Resend a verification code. Generic response to avoid email enumeration."""
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    resp = {"message": "If that account needs verification, a new code has been sent."}

    user = User.query.filter_by(email=email).first()
    if user and not user.is_verified:
        code = _set_verification_code(user)
        db.session.commit()
        sent = _send_verification(user, code)
        if not sent and current_app.config.get("AUTH_DEV_MODE"):
            resp["dev_code"] = code

    return jsonify(resp)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        # Same message for both cases — don't reveal which emails exist.
        return jsonify(error="Invalid email or password."), 401

    if not user.is_verified:
        return jsonify(
            error="Please verify your email before logging in.",
            needs_verification=True,
            email=user.email,
        ), 403

    return jsonify(token=_make_token(user), user=user.to_dict())


@auth_bp.route("/forgot", methods=["POST"])
def forgot_password():
    """Begin a password reset.

    Always returns the same generic message so the endpoint can't be used to
    discover which emails are registered. The reset link is emailed in
    production; until email is configured (AUTH_DEV_MODE), it is logged to the
    server console and returned in the response so it can be tested locally.
    """
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    resp = {
        "message": "If an account exists for that email, a reset link has been sent."
    }

    user = User.query.filter_by(email=email).first()
    if user:
        token = _make_reset_token(user)
        reset_link = f"/reset-password?token={token}"
        print(f"[auth] Password reset link for {email}: {reset_link}")
        if current_app.config.get("AUTH_DEV_MODE"):
            # DEV ONLY — remove once real email delivery is wired up.
            resp["dev_reset_link"] = reset_link

    return jsonify(resp)


@auth_bp.route("/reset", methods=["POST"])
def reset_password():
    """Complete a password reset with a valid reset token + new password."""
    data = request.get_json(silent=True) or {}
    token = data.get("token") or ""
    password = data.get("password") or ""

    if len(password) < 8:
        return jsonify(error="Password must be at least 8 characters."), 400

    try:
        payload = jwt.decode(
            token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
        )
    except jwt.ExpiredSignatureError:
        return jsonify(error="This reset link has expired. Please request a new one."), 400
    except jwt.InvalidTokenError:
        return jsonify(error="Invalid or malformed reset link."), 400

    if payload.get("purpose") != "reset":
        return jsonify(error="Invalid reset link."), 400

    user = db.session.get(User, int(payload["sub"]))
    if not user:
        return jsonify(error="Account no longer exists."), 400

    user.password_hash = generate_password_hash(password)
    db.session.commit()
    return jsonify(message="Your password has been reset. You can now log in.")


@auth_bp.route("/me", methods=["GET"])
@token_required
def me():
    return jsonify(user=g.current_user.to_dict())


# Plans a user is allowed to select right now. Pro/Enterprise are "coming soon"
# until online payments exist, so only "free" is selectable.
SELECTABLE_PLANS = {"free"}


@auth_bp.route("/plan", methods=["POST"])
@token_required
def choose_plan():
    """Set the current user's plan (only 'free' is selectable for now)."""
    data = request.get_json(silent=True) or {}
    plan = (data.get("plan") or "").strip().lower()

    if plan not in SELECTABLE_PLANS:
        return jsonify(error="That plan isn't available yet."), 400

    g.current_user.plan = plan
    db.session.commit()
    return jsonify(user=g.current_user.to_dict())
