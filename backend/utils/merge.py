"""Merge multiple PDF files into a single PDF."""

from pypdf import PdfReader, PdfWriter


def merge_pdfs(input_paths, output_path):
    """Concatenate the given PDFs (in order) into one file at output_path.

    Args:
        input_paths: list of paths to source PDFs, merged in this order.
        output_path: where to write the combined PDF.

    Returns:
        output_path
    """
    if not input_paths:
        raise ValueError("At least one PDF is required to merge.")

    writer = PdfWriter()
    for path in input_paths:
        reader = PdfReader(path)
        for page in reader.pages:
            writer.add_page(page)

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path
