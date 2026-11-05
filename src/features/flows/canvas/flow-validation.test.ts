import { describe, it, expect } from "vitest";
import { validateFlow, type ValidationError } from "./flow-validation";
import type { FlowDefinition } from "@/lib/engine/schema";

function errorsOf(errors: ValidationError[], severity: "error" | "warning") {
  return errors.filter((e) => e.severity === severity);
}

describe("validateFlow", () => {
  it("detects missing trigger", () => {
    const def: FlowDefinition = {
      nodes: [{ id: "m1", data: { type: "message", messageType: "dm", text: "hi" } }],
      edges: [],
    };
    const errors = validateFlow(def);
    expect(errorsOf(errors, "error").some((e) => e.message.includes("Trigger"))).toBe(true);
  });

  it("detects dangling edge (missing target)", () => {
    const def: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", keywords: ["hi"], cooldownHours: 24 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "ghost" }],
    };
    const errors = validateFlow(def);
    expect(errors.some((e) => e.message.includes("missing target"))).toBe(true);
  });

  it("detects disconnected node", () => {
    const def: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", keywords: ["hi"], cooldownHours: 24 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Hello" } },
        { id: "m2", data: { type: "message", messageType: "dm", text: "Orphan" } },
      ],
      edges: [{ id: "e1", source: "t1", target: "m1" }],
    };
    const errors = validateFlow(def);
    expect(errors.some((e) => e.nodeId === "m2" && e.message.includes("not connected"))).toBe(true);
  });

  it("detects simple cycle (A → B → A)", () => {
    const def: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", keywords: ["hi"], cooldownHours: 24 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Hello" } },
        { id: "m2", data: { type: "message", messageType: "dm", text: "Loop" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "m1" },
        { id: "e2", source: "m1", target: "m2" },
        { id: "e3", source: "m2", target: "m1" },
      ],
    };
    const errors = validateFlow(def);
    expect(errors.some((e) => e.message.includes("Infinite loop"))).toBe(true);
  });

  it("detects self-referencing node", () => {
    const def: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", keywords: ["hi"], cooldownHours: 24 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Loop" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "m1" },
        { id: "e2", source: "m1", target: "m1" },
      ],
    };
    const errors = validateFlow(def);
    expect(errors.some((e) => e.message.includes("Infinite loop"))).toBe(true);
  });

  it("passes valid linear flow", () => {
    const def: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", keywords: ["hi"], cooldownHours: 24 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Hello" } },
        { id: "m2", data: { type: "message", messageType: "dm", text: "Bye" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "m1" },
        { id: "e2", source: "m1", target: "m2" },
      ],
    };
    const errors = validateFlow(def);
    expect(errorsOf(errors, "error")).toHaveLength(0);
    expect(errors.some((e) => e.message.includes("Infinite loop"))).toBe(false);
  });

  it("detects empty message text", () => {
    const def: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", keywords: ["hi"], cooldownHours: 24 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "" } },
      ],
      edges: [{ id: "e1", source: "t1", target: "m1" }],
    };
    const errors = validateFlow(def);
    expect(errors.some((e) => e.message.includes("no text"))).toBe(true);
  });
});
