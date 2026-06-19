"""Digitally sign a PDF with a PKCS#12 (.pfx/.p12) certificate using pyHanko.

This produces a cryptographic (PAdES) signature that proves who signed the
document and makes any later tampering detectable.
"""


def sign_pdf(input_path, output_path, pfx_path, pfx_password, field_name="Signature1",
             reason=None, location=None):
    """Sign input_path with the given PKCS#12 certificate.

    Args:
        input_path:   PDF to sign.
        output_path:  where to write the signed PDF.
        pfx_path:     path to the .pfx/.p12 certificate bundle.
        pfx_password: password protecting the certificate (may be empty).
        field_name:   name of the signature field to create.
        reason/location: optional metadata embedded in the signature.

    Returns:
        output_path
    """
    # Imported lazily so the rest of the app runs even if pyhanko is absent.
    from pyhanko.sign import signers
    from pyhanko.sign.fields import SigFieldSpec, append_signature_field
    from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter

    pw = (pfx_password or "").encode("utf-8")
    try:
        signer = signers.SimpleSigner.load_pkcs12(pfx_file=pfx_path, passphrase=pw)
    except Exception as e:  # bad password, corrupt cert, etc.
        raise ValueError(f"Could not load certificate: {e}")

    if signer is None:
        raise ValueError("Invalid certificate or password.")

    meta = signers.PdfSignatureMetadata(
        field_name=field_name,
        reason=reason or None,
        location=location or None,
    )

    with open(input_path, "rb") as inf:
        writer = IncrementalPdfFileWriter(inf)
        # Ensure the signature field exists (invisible signature).
        append_signature_field(writer, SigFieldSpec(sig_field_name=field_name))
        with open(output_path, "wb") as outf:
            signers.sign_pdf(writer, meta, signer=signer, output=outf)

    return output_path
