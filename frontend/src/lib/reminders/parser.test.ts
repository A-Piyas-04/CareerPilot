import { describe, expect, it } from "vitest";

import { parseNudgesJson } from "./parser";

describe("parseNudgesJson", () => {
  it("strips code fences, filters invalid nudges, and clamps to 3", () => {
    const nudges = parseNudgesJson(`\`\`\`json
{
  "nudges": [
    {"type":"task","title":"Do task","message":"Finish one overdue task.","actionLabel":"Open Tasks","actionHref":"/goals"},
    {"type":"bad","title":"Bad type","message":"Still valid.","actionHref":"/nope"},
    {"type":"deadline","title":"Prep","message":"Review tomorrow's event.","actionLabel":"Open Calendar","actionHref":"/calendar"},
    {"type":"general","title":"Extra","message":"Should be clamped.","actionHref":"/dashboard"},
    {"type":"task","message":"Missing title"}
  ]
}
\`\`\``);

    expect(nudges).toHaveLength(3);
    expect(nudges[0]).toMatchObject({
      actionHref: "/goals",
      title: "Do task",
      type: "task",
    });
    expect(nudges[1]).toMatchObject({
      actionHref: "/dashboard",
      type: "general",
    });
  });

  it("rejects responses without a nudges array", () => {
    expect(() => parseNudgesJson("{}")).toThrow(/nudges array/);
  });
});
