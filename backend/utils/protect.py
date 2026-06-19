"""Password-protect (encrypt) or unlock PDFs."""

import pikepdf


def protect_pdf(input_path, output_path, password):
    """Encrypt a PDF with AES-256 using the given password.

    The same password is used as both the user (open) password and the owner
    (permissions) password.

    Args:
        input_path: source PDF.
        output_path: where to write the encrypted PDF.
        password: password required to open the resulting file.

    Returns:
        output_path
    """
    if not password:
        raise ValueError("A password is required to protect a PDF.")

    with pikepdf.open(input_path) as pdf:
        pdf.save(
            output_path,
            encryption=pikepdf.Encryption(
                user=password,
                owner=password,
                R=6,  # AES-256
            ),
        )
    return output_path


def unlock_pdf(input_path, output_path, password):
    """Remove encryption from a password-protected PDF.

    Args:
        input_path: source (encrypted) PDF.
        output_path: where to write the decrypted PDF.
        password: the password that opens input_path.

    Returns:
        output_path
    """
    try:
        with pikepdf.open(input_path, password=password or "") as pdf:
            pdf.save(output_path)
    except pikepdf.PasswordError:
        raise ValueError("Incorrect password.")
    return output_path
