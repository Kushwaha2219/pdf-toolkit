"""Split a PDF into pieces by page ranges."""

import os
import zipfile

from pypdf import PdfReader, PdfWriter


def _parse_ranges(spec, page_count):
    """Parse a range spec like "1-3,5,8-10" into a list of (start, end) tuples.

    Pages are 1-based and inclusive in the spec; returned tuples are 0-based,
    end-exclusive (ready to slice). An empty/None spec means "every page on its
    own".
    """
    if not spec or not spec.strip():
        return [(i, i + 1) for i in range(page_count)]

    ranges = []
    for chunk in spec.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "-" in chunk:
            start_s, end_s = chunk.split("-", 1)
            start = int(start_s)
            end = int(end_s)
        else:
            start = end = int(chunk)

        if start < 1 or end > page_count or start > end:
            raise ValueError(
                f"Invalid range '{chunk}' for a {page_count}-page document."
            )
        ranges.append((start - 1, end))

    return ranges


def split_pdf(input_path, output_dir, output_zip, ranges=None):
    """Split input_path into one PDF per range, then zip them.

    Args:
        input_path: source PDF.
        output_dir: scratch directory for the per-range PDFs.
        output_zip: path of the .zip to produce.
        ranges: optional spec string like "1-3,5,8-10". If omitted, every page
            becomes its own PDF.

    Returns:
        output_zip
    """
    reader = PdfReader(input_path)
    page_count = len(reader.pages)
    parsed = _parse_ranges(ranges, page_count)

    os.makedirs(output_dir, exist_ok=True)
    base = os.path.splitext(os.path.basename(input_path))[0]

    part_paths = []
    for idx, (start, end) in enumerate(parsed, start=1):
        writer = PdfWriter()
        for page_no in range(start, end):
            writer.add_page(reader.pages[page_no])

        label = f"{start + 1}-{end}" if end - start > 1 else f"{start + 1}"
        part_path = os.path.join(output_dir, f"{base}_part{idx}_pages{label}.pdf")
        with open(part_path, "wb") as f:
            writer.write(f)
        part_paths.append(part_path)

    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in part_paths:
            zf.write(path, arcname=os.path.basename(path))

    return output_zip
