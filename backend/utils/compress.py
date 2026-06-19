"""Compress / optimize a PDF to reduce file size."""

import fitz  # PyMuPDF


def compress_pdf(input_path, output_path):
    """Re-save the PDF with deflate, garbage collection and stream cleanup.

    This drops unused objects, deduplicates streams and recompresses content,
    which shrinks most PDFs without touching page content.

    Args:
        input_path: source PDF.
        output_path: where to write the optimized PDF.

    Returns:
        output_path
    """
    doc = fitz.open(input_path)
    try:
        doc.save(
            output_path,
            garbage=4,      # maximum garbage collection / dedupe
            deflate=True,   # compress streams
            clean=True,     # sanitize content streams
            deflate_images=True,
            deflate_fonts=True,
        )
    finally:
        doc.close()

    return output_path
