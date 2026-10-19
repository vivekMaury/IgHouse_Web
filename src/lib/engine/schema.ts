import { z } from "zod/v4";

export const TriggerNodeSchema = z.object({
  type: z.literal("trigger"),
  triggerType: z.enum([
    "comment_keyword",
    "dm_keyword",
    "story_mention",
    "story_reply",
    "live_comment",
    "ice_breaker",
  ]),
  keywords: z.array(z.string()).optional(),
  matchAll: z.boolean().optional(),
  postIds: z.array(z.string()).optional(),
  cooldownHours: z.number().min(0).default(24),
});

export const MessageNodeSchema = z.object({
  type: z.literal("message"),
  messageType: z.enum(["dm", "comment_reply", "private_reply"]),
  text: z.string().optional(),
  variants: z.array(z.string()).optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  quickReplies: z
    .array(z.object({ title: z.string(), payload: z.string() }))
    .optional(),
  buttons: z
    .array(
      z.object({
        type: z.enum(["url", "postback"]),
        title: z.string(),
        value: z.string(),
      })
    )
    .optional(),
});

export const ConditionNodeSchema = z.object({
  type: z.literal("condition"),
  field: z.enum([
    "is_follower",
    "has_email",
    "has_phone",
    "has_tag",
    "custom_field",
  ]),
  operator: z.enum(["equals", "not_equals", "contains", "exists"]).default("exists"),
  value: z.string().optional(),
});

export const DelayNodeSchema = z.object({
  type: z.literal("delay"),
  duration: z.number().min(1),
  unit: z.enum(["minutes", "hours", "days"]),
});

export const LeadCaptureNodeSchema = z.object({
  type: z.literal("lead_capture"),
  field: z.enum(["email", "phone"]),
  promptText: z.string(),
  validationRegex: z.string().optional(),
  errorText: z.string().optional(),
});

export const NodeDataSchema = z.discriminatedUnion("type", [
  TriggerNodeSchema,
  MessageNodeSchema,
  ConditionNodeSchema,
  DelayNodeSchema,
  LeadCaptureNodeSchema,
]);

export const FlowNodeSchema = z.object({
  id: z.string(),
  data: NodeDataSchema,
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
});

export const FlowDefinitionSchema = z.object({
  nodes: z.array(FlowNodeSchema),
  edges: z.array(FlowEdgeSchema),
});

export type TriggerNode = z.infer<typeof TriggerNodeSchema>;
export type MessageNode = z.infer<typeof MessageNodeSchema>;
export type ConditionNode = z.infer<typeof ConditionNodeSchema>;
export type DelayNode = z.infer<typeof DelayNodeSchema>;
export type LeadCaptureNode = z.infer<typeof LeadCaptureNodeSchema>;
export type NodeData = z.infer<typeof NodeDataSchema>;
export type FlowNode = z.infer<typeof FlowNodeSchema>;
export type FlowEdge = z.infer<typeof FlowEdgeSchema>;
export type FlowDefinition = z.infer<typeof FlowDefinitionSchema>;
