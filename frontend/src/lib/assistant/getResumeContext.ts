import { mockCV } from "@/lib/mock/mockCV";

import type { ResumeContextResult } from "./types";

const MAX_CONTEXT_CHARS = 6000;

export async function getResumeContext(userId: string): Promise<ResumeContextResult> {
  void userId;

  return {
    text: mockCV.raw_text.slice(0, MAX_CONTEXT_CHARS),
    usedResumeChunks: mockCV.resume_chunks.map((chunk) => chunk.id),
  };
}
