"""Edit PDFs: page operations (rotate/delete/reorder/extract) and content
annotations (text, highlights, rectangles)."""

import fitz  # PyMuPDF


# --------------------------------------------------------------------------- #
# Page operations
# --------------------------------------------------------------------------- #
def _parse_page_list(spec, page_count):
    """Parse "1,3,5-7" into a sorted, de-duplicated list of 0-based indices."""
    if not spec or not spec.strip():
        return []
    pages = set()
    for chunk in spec.split(","):
        chunk = chunk.strip()
        if not chunk:
            continue
        if "-" in chunk:
            a, b = chunk.split("-", 1)
            a, b = int(a), int(b)
        else:
            a = b = int(chunk)
        if a < 1 or b > page_count or a > b:
            raise ValueError(f"Invalid page '{chunk}' for a {page_count}-page document.")
        for p in range(a, b + 1):
            pages.add(p - 1)
    return sorted(pages)


def edit_pages(input_path, output_path, operation, pages="", angle=90, order=None):
    """Apply a page-level operation to a PDF.

    operation:
        'rotate'  — rotate `pages` (or all if blank) by `angle` degrees.
        'delete'  — remove `pages`.
        'extract' — keep only `pages`.
        'reorder' — rebuild using `order` (1-based list of page numbers).
    """
    doc = fitz.open(input_path)
    try:
        count = doc.page_count

        if operation == "rotate":
            targets = _parse_page_list(pages, count) or list(range(count))
            for idx in targets:
                page = doc[idx]
                page.set_rotation((page.rotation + int(angle)) % 360)
            doc.save(output_path)

        elif operation == "delete":
            targets = _parse_page_list(pages, count)
            if not targets:
                raise ValueError("Specify which pages to delete.")
            if len(targets) >= count:
                raise ValueError("Cannot delete every page.")
            doc.delete_pages(targets)
            doc.save(output_path)

        elif operation == "extract":
            targets = _parse_page_list(pages, count)
            if not targets:
                raise ValueError("Specify which pages to extract.")
            doc.select(targets)
            doc.save(output_path)

        elif operation == "reorder":
            if not order:
                raise ValueError("Provide the new page order.")
            zero = [n - 1 for n in order]
            if sorted(zero) != list(range(count)):
                raise ValueError("Reorder must list every page exactly once.")
            doc.select(zero)
            doc.save(output_path)

        else:
            raise ValueError(f"Unknown operation: {operation}")
    finally:
        doc.close()

    return output_path


def add_watermark(input_path, output_path, text, opacity=0.15, fontsize=42):
    """Stamp diagonal (45°) watermark text across the center of every page."""
    doc = fitz.open(input_path)
    try:
        for page in doc:
            rect = page.rect
            pivot = fitz.Point(rect.width / 2, rect.height / 2)
            # insert_textbox only allows 0/90/180/270, so rotate via a matrix.
            matrix = fitz.Matrix(1, 0, 0, 1, 0, 0).prerotate(45)
            text_w = fitz.get_text_length(text, fontsize=fontsize)
            start = fitz.Point(pivot.x - text_w / 2, pivot.y)
            page.insert_text(
                start,
                text,
                fontsize=fontsize,
                color=(0.5, 0.5, 0.5),
                fill_opacity=opacity,
                morph=(pivot, matrix),
            )
        doc.save(output_path)
    finally:
        doc.close()
    return output_path


# --------------------------------------------------------------------------- #
# Content annotations
# --------------------------------------------------------------------------- #
def apply_annotations(input_path, output_path, annotations):
    """Draw a list of annotations onto the PDF.

    Each annotation is a dict with coordinates in PDF points, top-left origin:
        { "page": 0, "type": "text",      "x": .., "y": .., "text": "..",
          "size": 14, "color": [r,g,b] }
        { "page": 0, "type": "highlight", "x": .., "y": .., "w": .., "h": ..,
          "color": [r,g,b] }
        { "page": 0, "type": "rect",      "x": .., "y": .., "w": .., "h": ..,
          "color": [r,g,b] }
    Colors are 0..1 floats; default black/yellow as appropriate.
    """
    doc = fitz.open(input_path)
    try:
        for ann in annotations or []:
            idx = int(ann.get("page", 0))
            if idx < 0 or idx >= doc.page_count:
                continue
            page = doc[idx]
            kind = ann.get("type")
            color = ann.get("color")

            if kind == "text":
                rgb = tuple(color) if color else (0, 0, 0)
                page.insert_text(
                    fitz.Point(float(ann["x"]), float(ann["y"])),
                    str(ann.get("text", "")),
                    fontsize=float(ann.get("size", 14)),
                    color=rgb,
                )
            elif kind in ("highlight", "rect"):
                x, y = float(ann["x"]), float(ann["y"])
                w, h = float(ann["w"]), float(ann["h"])
                rect = fitz.Rect(x, y, x + w, y + h)
                if kind == "highlight":
                    rgb = tuple(color) if color else (1, 1, 0)
                    shape = page.new_shape()
                    shape.draw_rect(rect)
                    shape.finish(fill=rgb, fill_opacity=0.35, color=None)
                    shape.commit()
                else:  # rect outline
                    rgb = tuple(color) if color else (1, 0, 0)
                    shape = page.new_shape()
                    shape.draw_rect(rect)
                    shape.finish(color=rgb, width=1.5)
                    shape.commit()
        doc.save(output_path)
    finally:
        doc.close()
    return output_path
