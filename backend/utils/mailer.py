"""Transactional email via Resend (https://resend.com).

Uses only the standard library (urllib) so there is no extra dependency. The
API key and sender are read from the environment:

    RESEND_API_KEY  -> your Resend API key (required to actually send)
    MAIL_FROM       -> sender, e.g. "PDFVish <noreply@yourdomain.com>".
                       Defaults to Resend's shared test sender.

send_email() returns True on success and False if email isn't configured or the
send fails — callers can then fall back to dev behaviour (showing the code).
"""

import json
import os
import urllib.error
import urllib.request

RESEND_ENDPOINT = "https://api.resend.com/emails"
DEFAULT_SENDER = "PDFVish <onboarding@resend.dev>"


def email_configured():
    """True if a Resend API key is present."""
    return bool(os.environ.get("RESEND_API_KEY"))


def send_email(to_address, subject, html):
    """Send one HTML email. Returns True if Resend accepted it."""
    api_key = os.environ.get("RESEND_API_KEY")
    if not api_key:
        return False

    sender = os.environ.get("MAIL_FROM", DEFAULT_SENDER)
    payload = json.dumps(
        {"from": sender, "to": [to_address], "subject": subject, "html": html}
    ).encode("utf-8")

    req = urllib.request.Request(
        RESEND_ENDPOINT,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return 200 <= resp.status < 300
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")
        print(f"[auth] Resend rejected email ({exc.code}): {detail}")
        return False
    except urllib.error.URLError as exc:
        print(f"[auth] Could not reach Resend: {exc}")
        return False


def verification_email_html(name, code):
    """Build the verification email body for a 6-digit code."""
    safe_name = (name or "there").strip()
    return f"""\
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#111">Verify your email</h2>
      <p>Hi {safe_name}, welcome to PDFVish! Use this code to finish creating
         your account:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:8px;
                background:#f3f4f6;padding:16px;text-align:center;border-radius:8px">
        {code}
      </p>
      <p style="color:#6b7280">This code expires in 15 minutes. If you didn't
         sign up for PDFVish, you can safely ignore this email.</p>
    </div>"""
