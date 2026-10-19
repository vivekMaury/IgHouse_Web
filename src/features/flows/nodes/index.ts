import { TriggerNode } from "./trigger-node";
import { MessageNode } from "./message-node";
import { ConditionNode } from "./condition-node";
import { DelayNode } from "./delay-node";
import { LeadCaptureNode } from "./lead-capture-node";

export const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  condition: ConditionNode,
  delay: DelayNode,
  lead_capture: LeadCaptureNode,
} as const;
