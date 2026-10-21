import type { FlowDefinition } from "@/lib/engine/schema";

export type ValidationError = {
  nodeId?: string;
  message: string;
  severity: "error" | "warning";
};

export function validateFlow(def: FlowDefinition): ValidationError[] {
  const errors: ValidationError[] = [];

  const triggerNodes = def.nodes.filter((n) => n.data.type === "trigger");
  if (triggerNodes.length === 0) {
    errors.push({ message: "Flow must have at least one Trigger node.", severity: "error" });
  }
  if (triggerNodes.length > 1) {
    errors.push({ message: "Flow should have only one Trigger node.", severity: "warning" });
  }

  const nodeIds = new Set(def.nodes.map((n) => n.id));

  for (const edge of def.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({ message: `Edge references missing source node: ${edge.source}`, severity: "error" });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({ message: `Edge references missing target node: ${edge.target}`, severity: "error" });
    }
  }

  for (const node of def.nodes) {
    if (node.data.type === "trigger") continue;

    const hasIncoming = def.edges.some((e) => e.target === node.id);
    if (!hasIncoming) {
      errors.push({
        nodeId: node.id,
        message: `"${node.data.type}" node is not connected to any input.`,
        severity: "warning",
      });
    }
  }

  for (const node of def.nodes) {
    if (node.data.type === "trigger") {
      const d = node.data;
      const needsKeywords = d.triggerType === "comment_keyword" || d.triggerType === "dm_keyword" || d.triggerType === "live_comment";
      if (needsKeywords && (!d.keywords || d.keywords.length === 0 || d.keywords.every((k) => !k.trim()))) {
        errors.push({
          nodeId: node.id,
          message: "Trigger requires at least one keyword.",
          severity: "warning",
        });
      }
    }

    if (node.data.type === "message") {
      const d = node.data;
      const hasText = d.text?.trim();
      const hasVariants = d.variants?.some((v) => v.trim());
      if (!hasText && !hasVariants) {
        errors.push({
          nodeId: node.id,
          message: "Message node has no text.",
          severity: "error",
        });
      }
    }

    if (node.data.type === "lead_capture") {
      if (!node.data.promptText.trim()) {
        errors.push({
          nodeId: node.id,
          message: "Lead Capture needs a prompt message.",
          severity: "error",
        });
      }
    }

    if (node.data.type === "condition") {
      const hasTrue = def.edges.some((e) => e.source === node.id && e.sourceHandle === "true");
      const hasFalse = def.edges.some((e) => e.source === node.id && e.sourceHandle === "false");
      if (!hasTrue && !hasFalse) {
        errors.push({
          nodeId: node.id,
          message: "Condition node has no outgoing connections.",
          severity: "warning",
        });
      }
    }
  }

  return errors;
}
