"use client";

import { Button } from "@/components/ui/button";
import { Zap, MessageSquare, GitBranch, Clock, UserPlus } from "lucide-react";
import type { NodeData } from "@/lib/engine/schema";

type NodeTemplate = {
  label: string;
  icon: React.ElementType;
  data: NodeData;
  color: string;
};

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    label: "Trigger",
    icon: Zap,
    color: "text-amber-600",
    data: { type: "trigger", triggerType: "comment_keyword", cooldownHours: 24 },
  },
  {
    label: "Message",
    icon: MessageSquare,
    color: "text-blue-600",
    data: { type: "message", messageType: "dm", text: "Hello!" },
  },
  {
    label: "Condition",
    icon: GitBranch,
    color: "text-purple-600",
    data: { type: "condition", field: "is_follower", operator: "exists" },
  },
  {
    label: "Delay",
    icon: Clock,
    color: "text-orange-600",
    data: { type: "delay", duration: 1, unit: "hours" },
  },
  {
    label: "Lead Capture",
    icon: UserPlus,
    color: "text-emerald-600",
    data: { type: "lead_capture", field: "email", promptText: "What is your email?" },
  },
];

export function FlowToolbar({
  onAddNode,
}: {
  onAddNode: (data: NodeData) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/80 p-1 backdrop-blur-sm">
      {NODE_TEMPLATES.map((tpl) => (
        <Button
          key={tpl.label}
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={() => onAddNode(tpl.data)}
        >
          <tpl.icon className={`h-3.5 w-3.5 ${tpl.color}`} />
          {tpl.label}
        </Button>
      ))}
    </div>
  );
}
