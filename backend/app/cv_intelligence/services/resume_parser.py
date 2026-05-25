"""Resume file parsing — PDF and DOCX text extraction."""
import io
import re
from pathlib import Path

from fastapi import HTTPException, status

ALLOWED_EXTENSIONS: set[str] = {".pdf", ".docx"}
MAX_FILE_BYTES: int = 10 * 1024 * 1024  # 10 MB


def validate_file(filename: str, size: int) -> None:
    """Raise 422 if the file extension or size is not acceptable."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    if size > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"File too large ({size} bytes). Maximum allowed is {MAX_FILE_BYTES} bytes.",
        )


def extract_text(filename: str, file_bytes: bytes) -> str:
    """Extract plain text from a PDF or DOCX file and normalise whitespace."""
    ext = Path(filename).suffix.lower()
    if ext == ".pdf":
        raw = _extract_pdf(file_bytes)
    else:
        raw = _extract_docx(file_bytes)

    text = _normalise(raw)
    if not text:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No text could be extracted from the uploaded file. "
            "Please ensure the file contains selectable text (not a scanned image).",
        )
    return text


def _extract_pdf(file_bytes: bytes) -> str:
    """Extract text from a PDF using pypdf."""
    try:
        import pypdf  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError("pypdf is not installed. Run: pip install pypdf") from exc

    reader = pypdf.PdfReader(io.BytesIO(file_bytes))
    pages: list[str] = []
    for page in reader.pages:
        page_text = page.extract_text() or ""
        pages.append(page_text)
    return "\n".join(pages)


def _extract_docx(file_bytes: bytes) -> str:
    """Extract text from a DOCX file using python-docx."""
    try:
        import docx  # noqa: PLC0415
    except ImportError as exc:
        raise RuntimeError(
            "python-docx is not installed. Run: pip install python-docx"
        ) from exc

    document = docx.Document(io.BytesIO(file_bytes))
    paragraphs: list[str] = [para.text for para in document.paragraphs if para.text.strip()]
    return "\n".join(paragraphs)


def _normalise(text: str) -> str:
    """Collapse excessive whitespace while preserving paragraph breaks."""
    # Replace Windows line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse runs of spaces/tabs to a single space
    text = re.sub(r"[ \t]+", " ", text)
    # Collapse 3+ consecutive newlines to two
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
