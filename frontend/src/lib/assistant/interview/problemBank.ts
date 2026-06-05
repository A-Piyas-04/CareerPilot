import type { InterviewDifficulty } from "@/lib/types/assistant";

export type CodingProblem = {
  id: string;
  title: string;
  difficulty: InterviewDifficulty;
  tags: string[];
  prompt: string;
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints: string[];
  expectedApproach: string;
  edgeCases: string[];
  referenceLinks?: Array<{
    label: string;
    href: string;
  }>;
};

export const CODING_PROBLEM_BANK: CodingProblem[] = [
  {
    id: "pair-sum-indexes",
    title: "Pair Sum Indexes",
    difficulty: "easy",
    tags: ["array", "hash-map"],
    prompt:
      "Given an array of integers and a target number, return the indexes of two different elements whose values add up to the target. You may assume there is at most one valid pair.",
    examples: [
      {
        input: "nums = [4, 1, 7, 3], target = 10",
        output: "[2, 3]",
        explanation: "7 + 3 equals 10.",
      },
    ],
    constraints: [
      "Use zero-based indexes.",
      "Return an empty array if no pair exists.",
      "Aim for better than O(n^2).",
    ],
    expectedApproach:
      "Scan once while storing seen values and their indexes in a hash map. For each value, check whether target - value was seen earlier.",
    edgeCases: ["Duplicate values", "negative numbers", "no valid pair"],
    referenceLinks: [
      {
        label: "Hash map pattern",
        href: "https://neetcode.io/roadmap",
      },
    ],
  },
  {
    id: "longest-distinct-window",
    title: "Longest Distinct Window",
    difficulty: "medium",
    tags: ["string", "sliding-window", "hash-set"],
    prompt:
      "Given a string, find the length of the longest contiguous substring that contains no repeated characters.",
    examples: [
      {
        input: 's = "careerpilot"',
        output: "7",
        explanation: '"care" is length 4, while "erpilot" is length 7.',
      },
    ],
    constraints: [
      "Characters can be letters, digits, or symbols.",
      "An empty string has answer 0.",
      "Aim for O(n) time.",
    ],
    expectedApproach:
      "Use a sliding window with a map from character to latest index. Move the left boundary past repeated characters and track the best window length.",
    edgeCases: ["empty string", "all same character", "repeat before current window"],
  },
  {
    id: "balanced-token-stream",
    title: "Balanced Token Stream",
    difficulty: "easy",
    tags: ["stack", "string"],
    prompt:
      "Given a string containing only bracket characters (), [], and {}, decide whether every opening bracket is closed in the correct order.",
    examples: [
      {
        input: 'tokens = "{[()]}"',
        output: "true",
      },
      {
        input: 'tokens = "{[(])}"',
        output: "false",
      },
    ],
    constraints: [
      "Ignore no characters; the input contains only brackets.",
      "A closing bracket must match the most recent unmatched opening bracket.",
    ],
    expectedApproach:
      "Push opening brackets onto a stack. For closing brackets, pop and compare against the expected pair. The string is valid only if the stack ends empty.",
    edgeCases: ["starts with closing bracket", "leftover opening brackets", "empty string"],
  },
  {
    id: "rotated-boundary-search",
    title: "Rotated Boundary Search",
    difficulty: "medium",
    tags: ["array", "binary-search"],
    prompt:
      "A sorted array was rotated at an unknown pivot. Given the rotated array and a target value, return the target index or -1 if it is absent.",
    examples: [
      {
        input: "nums = [8, 9, 2, 3, 4, 5], target = 3",
        output: "3",
      },
    ],
    constraints: [
      "Values are unique.",
      "Aim for O(log n) time.",
      "Do not rebuild or sort the array.",
    ],
    expectedApproach:
      "Use binary search. At each step, identify which half is sorted, then decide whether the target lies inside that sorted half.",
    edgeCases: ["not rotated", "single element", "target outside range"],
  },
  {
    id: "merge-calendar-blocks",
    title: "Merge Calendar Blocks",
    difficulty: "medium",
    tags: ["intervals", "sorting"],
    prompt:
      "Given time blocks represented as [start, end], merge all overlapping blocks and return the condensed schedule sorted by start time.",
    examples: [
      {
        input: "blocks = [[1,3], [2,5], [8,10], [10,12]]",
        output: "[[1,5], [8,12]]",
      },
    ],
    constraints: [
      "Treat touching endpoints as mergeable.",
      "Input may be unsorted.",
      "Each block has start <= end.",
    ],
    expectedApproach:
      "Sort by start time, then scan and either extend the last merged interval or append a new one.",
    edgeCases: ["empty list", "nested intervals", "touching endpoints"],
  },
  {
    id: "team-tree-levels",
    title: "Team Tree Levels",
    difficulty: "medium",
    tags: ["tree", "breadth-first-search", "queue"],
    prompt:
      "Given the root of a binary tree, return a list containing the sum of node values at each depth from top to bottom.",
    examples: [
      {
        input: "root = [5, 3, 8, 1, 4]",
        output: "[5, 11, 5]",
      },
    ],
    constraints: [
      "The tree may be empty.",
      "Use the provided tree nodes; do not convert to a sorted structure.",
    ],
    expectedApproach:
      "Run breadth-first search with a queue. For each level, process exactly the current queue length and accumulate the sum.",
    edgeCases: ["empty tree", "one node", "unbalanced tree"],
  },
  {
    id: "grid-cluster-count",
    title: "Grid Cluster Count",
    difficulty: "medium",
    tags: ["graph", "dfs", "bfs", "grid"],
    prompt:
      "Given a grid of 1s and 0s, count how many connected clusters of 1s exist. Cells connect horizontally and vertically, not diagonally.",
    examples: [
      {
        input: "grid = [[1,1,0], [0,1,0], [1,0,1]]",
        output: "3",
      },
    ],
    constraints: [
      "Mark visited cells or mutate safely.",
      "Rows and columns can be different lengths only if your language representation allows it; explain your assumption.",
    ],
    expectedApproach:
      "Scan the grid. When an unvisited 1 is found, increment the count and flood-fill its connected component with DFS or BFS.",
    edgeCases: ["empty grid", "all zeros", "all ones", "thin row or column"],
  },
  {
    id: "minimum-training-cost",
    title: "Minimum Training Cost",
    difficulty: "hard",
    tags: ["dynamic-programming"],
    prompt:
      "You are given a list of non-negative costs where each position represents a training module. Starting before the first module, you may move one or two modules at a time. Return the minimum total cost to move beyond the last module.",
    examples: [
      {
        input: "costs = [10, 15, 20]",
        output: "15",
      },
    ],
    constraints: [
      "You pay the cost of a module when you land on it.",
      "You may start by landing on index 0 or index 1.",
      "Aim for O(n) time and O(1) extra space if possible.",
    ],
    expectedApproach:
      "Use dynamic programming where the cost to reach each position depends on the cheaper of the previous one or two positions.",
    edgeCases: ["zero modules", "one module", "large costs", "all equal costs"],
  },
];

export function findCodingProblem(problemId?: string | null) {
  if (!problemId) {
    return null;
  }

  return CODING_PROBLEM_BANK.find((problem) => problem.id === problemId) ?? null;
}

export function selectCodingProblem({
  conversationId,
  difficulty,
  focusAreas,
  messageCount,
}: {
  conversationId: string;
  difficulty: InterviewDifficulty;
  focusAreas?: string[];
  messageCount: number;
}) {
  const normalizedFocus = new Set(
    (focusAreas ?? []).map((area) => area.toLowerCase().trim()).filter(Boolean),
  );
  const candidates = CODING_PROBLEM_BANK.filter((problem) => {
    const difficultyMatches = problem.difficulty === difficulty;
    const focusMatches =
      normalizedFocus.size === 0 ||
      problem.tags.some((tag) => normalizedFocus.has(tag.toLowerCase()));

    return difficultyMatches && focusMatches;
  });
  const fallbackCandidates = candidates.length
    ? candidates
    : CODING_PROBLEM_BANK.filter((problem) => problem.difficulty === difficulty);
  const pool = fallbackCandidates.length ? fallbackCandidates : CODING_PROBLEM_BANK;
  const seed = hashString(`${conversationId}:${messageCount}:${difficulty}`);

  return pool[seed % pool.length];
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}
