import { TriggerNode } from "./trigger-node";
import { MessageNode } from "./message-node";
import { ConditionNode } from "./condition-node";
import { DelayNode } from "./delay-node";
import { LeadCaptureNode } from "./lead-capture-node";
import { WaitForReplyNode } from "./wait-for-reply-node";
import { HttpRequestNode } from "./http-request-node";
import { AiReplyNode } from "./ai-reply-node";

export const nodeTypes = {
  trigger: TriggerNode,
  message: MessageNode,
  condition: ConditionNode,
  delay: DelayNode,
  lead_capture: LeadCaptureNode,
  wait_for_reply: WaitForReplyNode,
  http_request: HttpRequestNode,
  ai_reply: AiReplyNode,
} as const;
