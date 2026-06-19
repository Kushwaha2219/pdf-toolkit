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
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from models import User, db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
TOKEN_TTL = timedelta(days=7)
RESET_TTL = timedelta(minutes=30)


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

    if User.query.filter_by(email=email).first():
        return jsonify(error="An account with this email already exists."), 409

    user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
    )
    db.session.add(user)
    db.session.commit()

    return jsonify(token=_make_token(user), user=user.to_dict()), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        # Same message for both cases — don't reveal which emails exist.
        return jsonify(error="Invalid email or password."), 401

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
