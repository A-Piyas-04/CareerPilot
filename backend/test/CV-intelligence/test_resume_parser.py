"""Tests for resume_parser — file validation and text extraction."""
import io

import pytest
from fastapi import HTTPException

from app.cv_intelligence.services.resume_parser import (
    MAX_FILE_BYTES,
    _normalise,
    extract_text,
    validate_file,
)


# ---------------------------------------------------------------------------
# validate_file
# ---------------------------------------------------------------------------

class TestValidateFile:
    def test_pdf_accepted(self):
        validate_file("resume.pdf", 1024)  # should not raise

    def test_docx_accepted(self):
        validate_file("resume.docx", 1024)

    def test_case_insensitive_extension(self):
        validate_file("Resume.PDF", 1024)

    def test_txt_rejected(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_file("resume.txt", 1024)
        assert exc_info.value.status_code == 422
        assert ".txt" in exc_info.value.detail

    def test_no_extension_rejected(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_file("resume", 1024)
        assert exc_info.value.status_code == 422

    def test_file_too_large(self):
        with pytest.raises(HTTPException) as exc_info:
            validate_file("resume.pdf", MAX_FILE_BYTES + 1)
        assert exc_info.value.status_code == 422
        assert "too large" in exc_info.value.detail.lower()

    def test_exactly_max_size_accepted(self):
        validate_file("resume.pdf", MAX_FILE_BYTES)  # boundary: exactly at limit is OK


# ---------------------------------------------------------------------------
# _normalise
# ---------------------------------------------------------------------------

class TestNormalise:
    def test_strips_outer_whitespace(self):
        assert _normalise("  hello  ") == "hello"

    def test_collapses_spaces_and_tabs(self):
        assert _normalise("hello   \t  world") == "hello world"

    def test_windows_line_endings_converted(self):
        result = _normalise("line1\r\nline2\r\nline3")
        assert "\r" not in result
        assert "line1" in result and "line2" in result

    def test_triple_newlines_collapsed(self):
        result = _normalise("para1\n\n\n\n\npara2")
        assert "\n\n\n" not in result
        assert "para1" in result and "para2" in result

    def test_empty_string_returns_empty(self):
        assert _normalise("") == ""

    def test_only_whitespace_returns_empty(self):
        assert _normalise("   \t\n  ") == ""


# ---------------------------------------------------------------------------
# extract_text — PDF (requires pypdf)
# ---------------------------------------------------------------------------

def _make_minimal_pdf(content: str) -> bytes:
    """Build a minimal single-page PDF with selectable text using pypdf."""
    import pypdf
    from pypdf import PdfWriter

    writer = PdfWriter()
    page = writer.add_blank_page(width=612, height=792)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def _make_real_pdf(content: str) -> bytes:
    """Build a PDF with actual text using reportlab if available, else skip."""
    try:
        from reportlab.pdfgen import canvas as rl_canvas
        buf = io.BytesIO()
        c = rl_canvas.Canvas(buf)
        for i, line in enumerate(content.splitlines()):
            c.drawString(50, 750 - i * 20, line)
        c.save()
        return buf.getvalue()
    except ImportError:
        pytest.skip("reportlab not installed — skipping PDF text extraction test")


class TestExtractTextPDF:
    def test_empty_pdf_raises_422(self):
        """A blank page PDF has no text — should raise 422."""
        pdf_bytes = _make_minimal_pdf("")
        with pytest.raises(HTTPException) as exc_info:
            extract_text("resume.pdf", pdf_bytes)
        assert exc_info.value.status_code == 422

    def test_pdf_with_text_extracted(self):
        """PDF with selectable text must return non-empty string."""
        pdf_bytes = _make_real_pdf("Python Developer\nExperience: 5 years")
        text = extract_text("resume.pdf", pdf_bytes)
        assert isinstance(text, str)
        assert len(text) > 0


# ---------------------------------------------------------------------------
# extract_text — DOCX (requires python-docx)
# ---------------------------------------------------------------------------

def _make_docx(content: str) -> bytes:
    """Build an in-memory DOCX with the given content."""
    import docx
    document = docx.Document()
    for line in content.splitlines():
        document.add_paragraph(line)
    buf = io.BytesIO()
    document.save(buf)
    return buf.getvalue()


class TestExtractTextDOCX:
    def test_docx_text_extracted(self):
        content = "Jane Doe\nSoftware Engineer\nPython, FastAPI, PostgreSQL"
        docx_bytes = _make_docx(content)
        text = extract_text("resume.docx", docx_bytes)
        assert "Jane Doe" in text
        assert "Python" in text

    def test_empty_docx_raises_422(self):
        docx_bytes = _make_docx("")
        with pytest.raises(HTTPException) as exc_info:
            extract_text("resume.docx", docx_bytes)
        assert exc_info.value.status_code == 422

    def test_multiline_docx_preserved(self):
        lines = ["Summary", "Senior developer", "Skills", "Python Django Docker"]
        docx_bytes = _make_docx("\n".join(lines))
        text = extract_text("resume.docx", docx_bytes)
        assert "Senior developer" in text
        assert "Django" in text
