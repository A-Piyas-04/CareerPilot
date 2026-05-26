"""Text chunking — sliding-window character-based chunker for resume sections."""

CHUNK_SIZE: int = 900    # target chunk size in characters
OVERLAP: int = 150       # overlap between consecutive chunks in characters


def chunk_sections(sections: list[dict]) -> list[dict]:
    """
    Chunk all sections and return a flat list of chunk dicts with a globally
    unique chunk_index across the entire resume.

    Each input section dict must have keys: section_name, content.
    Each output chunk dict has keys:
        section_name  (str)
        chunk_text    (str)
        chunk_index   (int)  — 0-based, globally unique within resume
        token_count   (int)  — approximate token count (chars // 4)
    """
    all_chunks: list[dict] = []
    global_index = 0

    for section in sections:
        section_chunks = _chunk_text(
            text=section["content"],
            section_name=section["section_name"],
            start_index=global_index,
        )
        all_chunks.extend(section_chunks)
        global_index += len(section_chunks)

    return all_chunks


def _chunk_text(text: str, section_name: str, start_index: int) -> list[dict]:
    """
    Split a single section's text into overlapping character-window chunks.

    Returns list of dicts with section_name, chunk_text, chunk_index, token_count.
    Short texts that fit in one chunk are returned as a single chunk.
    """
    text = text.strip()
    if not text:
        return []

    chunks: list[dict] = []
    pos = 0
    local_index = 0

    while pos < len(text):
        end = pos + CHUNK_SIZE
        chunk_text = text[pos:end].strip()

        if chunk_text:
            chunks.append(
                {
                    "section_name": section_name,
                    "chunk_text": chunk_text,
                    "chunk_index": start_index + local_index,
                    "token_count": max(1, len(chunk_text) // 4),
                }
            )
            local_index += 1

        # Advance by CHUNK_SIZE - OVERLAP so consecutive chunks share context
        step = CHUNK_SIZE - OVERLAP
        pos += step

        # Safety: avoid infinite loop on very short text
        if step <= 0:
            break

    return chunks
