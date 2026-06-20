"""Database models for PDFVish.

Uses Flask-SQLAlchemy. The `db` object is initialised against the Flask app in
app.py via `db.init_app(app)`.
"""

from datetime import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    # Stores a salted hash only — never the raw password.
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Email verification: accounts start unverified and cannot log in until a
    # 6-digit code emailed at signup is confirmed.
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    verification_code = db.Column(db.String(6), nullable=True)
    verification_expires = db.Column(db.DateTime, nullable=True)
    # Wrong-code guesses for the current code; the code locks after a few.
    verification_attempts = db.Column(db.Integer, default=0, nullable=False)

    # Chosen subscription plan: NULL until the user picks one after first login,
    # then "free" (Pro/Enterprise are not selectable until payments exist).
    plan = db.Column(db.String(20), nullable=True)

    # Profile details (set in Account Settings).
    country = db.Column(db.String(80), nullable=True)
    timezone = db.Column(db.String(64), nullable=True)

    # Whether a Google account is linked for social sign-in.
    google_linked = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        """Public representation — never includes the password hash."""
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "is_verified": self.is_verified,
            "plan": self.plan,
            "country": self.country,
            "timezone": self.timezone,
            "google_linked": self.google_linked,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
