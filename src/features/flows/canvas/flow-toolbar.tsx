"use client";

import {
  Zap,
  MessageSquare,
  GitBranch,
  Clock,
  UserPlus,
} from "lucide-react";
import type { NodeData } from "@/lib/engine/schema";

type NodeTemplate = {
  label: string;
  icon: React.ElementType;
  data: NodeData;
  color: string;
  bg: string;
};

const NODE_TEMPLATES: NodeTemplate[] = [
  {
    label: "Trigger",
    icon: Zap,
    color: "text-amber-600 dark:text-amber-400",
    bg: "hover:bg-amber-500/10",
    data: {
      type: "trigger",
      triggerType: "comment_keyword",
      cooldownHours: 24,
    },
  },
  {
    label: "Message",
    icon: MessageSquare,
    color: "text-blue-600 dark:text-blue-400",
    bg: "hover:bg-blue-500/10",
    data: { type: "message", messageType: "dm", text: "Hello!" },
  },
  {
    label: "Condition",
    icon: GitBranch,
    color: "text-purple-600 dark:text-purple-400",
    bg: "hover:bg-purple-500/10",
    data: { type: "condition", field: "is_follower", operator: "exists" },
  },
  {
    label: "Delay",
    icon: Clock,
    color: "text-orange-600 dark:text-orange-400",
    bg: "hover:bg-orange-500/10",
    data: { type: "delay", duration: 1, unit: "hours" },
  },
  {
    label: "Lead Capture",
    icon: UserPlus,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "hover:bg-emerald-500/10",
    data: {
      type: "lead_capture",
      field: "email",
      promptText: "What is your email?",
    },
  },
];

export function FlowToolbar({
  onAddNode,
}: {
  onAddNode: (data: NodeData) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {NODE_TEMPLATES.map((tpl) => (
        <button
          key={tpl.label}
          onClick={() => onAddNode(tpl.data)}
          className={`inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:text-foreground active:scale-95 ${tpl.bg}`}
        >
          <tpl.icon className={`h-3.5 w-3.5 ${tpl.color}`} />
          {tpl.label}
        </button>
      ))}
    </div>
  );
}
