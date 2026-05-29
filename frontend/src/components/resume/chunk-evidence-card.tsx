type ChunkEvidence = {
  chunk_id: string;
  section_name: string | null;
  chunk_text: string;
  similarity: number;
};

function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`;
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}

export function ChunkEvidenceCard({ chunk }: { chunk: ChunkEvidence }) {
  return (
    <article className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-900">
          {chunk.section_name ?? "General"}
        </p>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-800">
          {formatSimilarity(chunk.similarity)} match
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-700">
        {truncateText(chunk.chunk_text, 280)}
      </p>
    </article>
  );
}
