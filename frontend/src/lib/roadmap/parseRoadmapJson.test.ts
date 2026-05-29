import { describe, expect, it } from "vitest";

import { parseRoadmapJson } from "./parseRoadmapJson";

describe("parseRoadmapJson", () => {
  it("strips code fences and validates exact week count", () => {
    const parsed = parseRoadmapJson(
      "```json\n" +
        JSON.stringify({
          overview: "Plan",
          items: [
            {
              week_number: 1,
              title: "Python ML",
              description: "Build notebook",
              resources: [{ name: "scikit-learn", url: "https://scikit-learn.org" }],
            },
          ],
        }) +
        "\n```",
      1,
    );

    expect(parsed.items).toHaveLength(1);
    expect(parsed.items[0].resources[0]).toEqual({
      name: "scikit-learn",
      url: "https://scikit-learn.org",
    });
  });

  it("rejects wrong item counts", () => {
    expect(() =>
      parseRoadmapJson(JSON.stringify({ overview: "Plan", items: [] }), 4),
    ).toThrow("exactly 4");
  });
});
