"use client";

import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NodeData, TriggerNode, MessageNode, ConditionNode, DelayNode, LeadCaptureNode, WaitForReplyNode, HttpRequestNode, AiReplyNode } from "@/lib/engine/schema";

type Props = {
  nodeId: string;
  data: NodeData;
  onChange: (data: NodeData) => void;
  onClose: () => void;
  onDelete: () => void;
};

export function NodeConfigPanel({ nodeId, data, onChange, onClose, onDelete }: Props) {
  return (
    <div className="flex h-full w-80 flex-col border-l border-border/60 bg-background">
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-semibold capitalize">{data.type.replace("_", " ")} Config</h3>
        <div className="flex items-center gap-1">
          <button onClick={onDelete} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Delete node">
            <Trash2 className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <p className="text-[10px] font-mono text-muted-foreground">{nodeId}</p>

        {data.type === "trigger" && <TriggerConfig data={data} onChange={(d) => onChange(d)} />}
        {data.type === "message" && <MessageConfig data={data} onChange={(d) => onChange(d)} />}
        {data.type === "condition" && <ConditionConfig data={data} onChange={(d) => onChange(d)} />}
        {data.type === "delay" && <DelayConfig data={data} onChange={(d) => onChange(d)} />}
        {data.type === "lead_capture" && <LeadCaptureConfig data={data} onChange={(d) => onChange(d)} />}
        {data.type === "wait_for_reply" && <WaitForReplyConfig data={data} onChange={(d) => onChange(d)} />}
        {data.type === "http_request" && <HttpRequestConfig data={data} onChange={(d) => onChange(d)} />}
        {data.type === "ai_reply" && <AiReplyConfig data={data} onChange={(d) => onChange(d)} />}
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-foreground/80">{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text" }: { value: string | number; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="flex h-8 w-full rounded-md border border-border/60 bg-transparent px-2.5 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-8 w-full rounded-md border border-border/60 bg-transparent px-2.5 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="flex w-full rounded-md border border-border/60 bg-transparent px-2.5 py-2 text-xs shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
    />
  );
}

// ---------- Trigger Config ----------

function TriggerConfig({ data, onChange }: { data: TriggerNode; onChange: (d: TriggerNode) => void }) {
  const keywords = data.keywords ?? [];

  function addKeyword() {
    onChange({ ...data, keywords: [...keywords, ""] });
  }

  function updateKeyword(index: number, value: string) {
    const updated = [...keywords];
    updated[index] = value;
    onChange({ ...data, keywords: updated });
  }

  function removeKeyword(index: number) {
    onChange({ ...data, keywords: keywords.filter((_, i) => i !== index) });
  }

  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Trigger Type</FieldLabel>
        <Select
          value={data.triggerType}
          onChange={(v) => onChange({ ...data, triggerType: v as TriggerNode["triggerType"] })}
          options={[
            { value: "comment_keyword", label: "Comment Keyword" },
            { value: "dm_keyword", label: "DM Keyword" },
            { value: "story_mention", label: "Story Mention" },
            { value: "story_reply", label: "Story Reply" },
            { value: "live_comment", label: "Live Comment" },
            { value: "ice_breaker", label: "Ice Breaker" },
          ]}
        />
      </div>

      {(data.triggerType === "comment_keyword" || data.triggerType === "dm_keyword" || data.triggerType === "live_comment") && (
        <div className="space-y-1.5">
          <FieldLabel>Keywords</FieldLabel>
          <div className="space-y-1.5">
            {keywords.map((kw, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input value={kw} onChange={(v) => updateKeyword(i, v)} placeholder="Enter keyword…" />
                <button onClick={() => removeKeyword(i)} className="rounded p-1 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={addKeyword}>
            <Plus className="mr-1 h-3 w-3" /> Add Keyword
          </Button>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="matchAll"
              checked={data.matchAll ?? false}
              onChange={(e) => onChange({ ...data, matchAll: e.target.checked })}
              className="h-3.5 w-3.5 rounded border-border"
            />
            <label htmlFor="matchAll" className="text-xs text-muted-foreground">
              Require all keywords (AND)
            </label>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <FieldLabel>Cooldown (hours)</FieldLabel>
        <Input
          type="number"
          value={data.cooldownHours ?? 24}
          onChange={(v) => onChange({ ...data, cooldownHours: Math.max(0, Number(v)) })}
        />
        <p className="text-[10px] text-muted-foreground">Set to 0 to disable cooldown.</p>
      </div>
    </>
  );
}

// ---------- Message Config ----------

function MessageConfig({ data, onChange }: { data: MessageNode; onChange: (d: MessageNode) => void }) {
  const variants = data.variants ?? [];
  const quickReplies = data.quickReplies ?? [];
  const buttons = data.buttons ?? [];

  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Message Type</FieldLabel>
        <Select
          value={data.messageType}
          onChange={(v) => onChange({ ...data, messageType: v as MessageNode["messageType"] })}
          options={[
            { value: "dm", label: "Send DM" },
            { value: "comment_reply", label: "Comment Reply" },
            { value: "private_reply", label: "Private Reply" },
          ]}
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Message Text</FieldLabel>
        <Textarea
          value={data.text ?? ""}
          onChange={(v) => onChange({ ...data, text: v })}
          placeholder="Type your message… Use {{variable}} for dynamic content"
        />
        <p className="text-[10px] text-muted-foreground">
          Variables: {"{{username}}"}, {"{{email}}"}, {"{{phone}}"}
        </p>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Message Variants (A/B)</FieldLabel>
        {variants.map((v, i) => (
          <div key={i} className="flex items-start gap-1">
            <Textarea value={v} onChange={(val) => {
              const updated = [...variants];
              updated[i] = val;
              onChange({ ...data, variants: updated });
            }} placeholder={`Variant ${i + 1}`} rows={2} />
            <button onClick={() => onChange({ ...data, variants: variants.filter((_, j) => j !== i) })} className="mt-1 rounded p-1 text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onChange({ ...data, variants: [...variants, ""] })}>
          <Plus className="mr-1 h-3 w-3" /> Add Variant
        </Button>
      </div>

      {data.messageType === "dm" && (
        <>
          <div className="space-y-1.5">
            <FieldLabel>Quick Replies</FieldLabel>
            {quickReplies.map((qr, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input value={qr.title} onChange={(v) => {
                  const updated = [...quickReplies];
                  updated[i] = { title: v, payload: v.toLowerCase().replace(/\s+/g, "_") };
                  onChange({ ...data, quickReplies: updated });
                }} placeholder="Button label" />
                <button onClick={() => onChange({ ...data, quickReplies: quickReplies.filter((_, j) => j !== i) })} className="rounded p-1 text-muted-foreground hover:text-destructive">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {quickReplies.length < 13 && (
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onChange({ ...data, quickReplies: [...quickReplies, { title: "", payload: "" }] })}>
                <Plus className="mr-1 h-3 w-3" /> Add Quick Reply
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Buttons</FieldLabel>
            {buttons.map((btn, i) => (
              <div key={i} className="space-y-1 rounded-md border border-border/40 p-2">
                <Select value={btn.type} onChange={(v) => {
                  const updated = [...buttons];
                  updated[i] = { ...btn, type: v as "url" | "postback" };
                  onChange({ ...data, buttons: updated });
                }} options={[
                  { value: "url", label: "URL" },
                  { value: "postback", label: "Postback" },
                ]} />
                <Input value={btn.title} onChange={(v) => {
                  const updated = [...buttons];
                  updated[i] = { ...btn, title: v };
                  onChange({ ...data, buttons: updated });
                }} placeholder="Button label" />
                <Input value={btn.value} onChange={(v) => {
                  const updated = [...buttons];
                  updated[i] = { ...btn, value: v };
                  onChange({ ...data, buttons: updated });
                }} placeholder={btn.type === "url" ? "https://…" : "payload_value"} />
                <button onClick={() => onChange({ ...data, buttons: buttons.filter((_, j) => j !== i) })} className="text-[10px] text-destructive hover:underline">
                  Remove
                </button>
              </div>
            ))}
            {buttons.length < 3 && (
              <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => onChange({ ...data, buttons: [...buttons, { type: "url", title: "", value: "" }] })}>
                <Plus className="mr-1 h-3 w-3" /> Add Button
              </Button>
            )}
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Media URL (optional)</FieldLabel>
            <Input value={data.mediaUrl ?? ""} onChange={(v) => onChange({ ...data, mediaUrl: v || undefined })} placeholder="https://…" />
            {data.mediaUrl && (
              <Select value={data.mediaType ?? "image"} onChange={(v) => onChange({ ...data, mediaType: v as "image" | "video" })} options={[
                { value: "image", label: "Image" },
                { value: "video", label: "Video" },
              ]} />
            )}
          </div>
        </>
      )}
    </>
  );
}

// ---------- Condition Config ----------

function ConditionConfig({ data, onChange }: { data: ConditionNode; onChange: (d: ConditionNode) => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Field</FieldLabel>
        <Select
          value={data.field}
          onChange={(v) => onChange({ ...data, field: v as ConditionNode["field"] })}
          options={[
            { value: "is_follower", label: "Is Follower" },
            { value: "has_email", label: "Has Email" },
            { value: "has_phone", label: "Has Phone" },
            { value: "has_tag", label: "Has Tag" },
            { value: "custom_field", label: "Custom Field" },
          ]}
        />
      </div>

      {(data.field === "has_tag" || data.field === "custom_field") && (
        <>
          <div className="space-y-1.5">
            <FieldLabel>Operator</FieldLabel>
            <Select
              value={data.operator ?? "exists"}
              onChange={(v) => onChange({ ...data, operator: v as ConditionNode["operator"] })}
              options={[
                { value: "exists", label: "Exists" },
                { value: "equals", label: "Equals" },
                { value: "not_equals", label: "Not Equals" },
                { value: "contains", label: "Contains" },
              ]}
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Value</FieldLabel>
            <Input
              value={data.value ?? ""}
              onChange={(v) => onChange({ ...data, value: v })}
              placeholder={data.field === "has_tag" ? "Tag name" : "Field value"}
            />
          </div>
        </>
      )}

      <div className="rounded-md bg-muted/50 p-2.5">
        <p className="text-[10px] text-muted-foreground">
          Connect the <span className="font-medium text-emerald-600">Yes</span> handle for when the condition is true,
          and the <span className="font-medium text-red-500">No</span> handle for false.
        </p>
      </div>
    </>
  );
}

// ---------- Delay Config ----------

function DelayConfig({ data, onChange }: { data: DelayNode; onChange: (d: DelayNode) => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Duration</FieldLabel>
        <div className="flex gap-2">
          <Input
            type="number"
            value={data.duration}
            onChange={(v) => onChange({ ...data, duration: Math.max(1, Number(v)) })}
          />
          <Select
            value={data.unit}
            onChange={(v) => onChange({ ...data, unit: v as DelayNode["unit"] })}
            options={[
              { value: "minutes", label: "Minutes" },
              { value: "hours", label: "Hours" },
              { value: "days", label: "Days" },
            ]}
          />
        </div>
      </div>

      <div className="rounded-md bg-muted/50 p-2.5">
        <p className="text-[10px] text-muted-foreground">
          Delays are durable — they survive server restarts and deployments.
        </p>
      </div>
    </>
  );
}

// ---------- Lead Capture Config ----------

function LeadCaptureConfig({ data, onChange }: { data: LeadCaptureNode; onChange: (d: LeadCaptureNode) => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Capture Field</FieldLabel>
        <Select
          value={data.field}
          onChange={(v) => onChange({ ...data, field: v as "email" | "phone" })}
          options={[
            { value: "email", label: "Email Address" },
            { value: "phone", label: "Phone Number" },
          ]}
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Prompt Message</FieldLabel>
        <Textarea
          value={data.promptText}
          onChange={(v) => onChange({ ...data, promptText: v })}
          placeholder="What is your email address?"
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Error Message (optional)</FieldLabel>
        <Textarea
          value={data.errorText ?? ""}
          onChange={(v) => onChange({ ...data, errorText: v || undefined })}
          placeholder="That doesn't look right. Please try again."
          rows={2}
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Custom Validation Regex (optional)</FieldLabel>
        <Input
          value={data.validationRegex ?? ""}
          onChange={(v) => onChange({ ...data, validationRegex: v || undefined })}
          placeholder="^[^\s@]+@[^\s@]+\.[^\s@]+$"
        />
        <p className="text-[10px] text-muted-foreground">
          Leave empty to use built-in {data.field} validation.
        </p>
      </div>
    </>
  );
}

// ---------- Wait for Reply Config ----------

function WaitForReplyConfig({ data, onChange }: { data: WaitForReplyNode; onChange: (d: WaitForReplyNode) => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Timeout (minutes)</FieldLabel>
        <Input
          type="number"
          value={data.timeoutMinutes}
          onChange={(v) => onChange({ ...data, timeoutMinutes: Math.max(1, Number(v)) })}
        />
        <p className="text-[10px] text-muted-foreground">
          How long to wait for a reply before following the timeout branch.
        </p>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Timeout Message (optional)</FieldLabel>
        <Textarea
          value={data.timeoutText ?? ""}
          onChange={(v) => onChange({ ...data, timeoutText: v || undefined })}
          placeholder="We didn't hear back from you…"
          rows={2}
        />
      </div>

      <div className="rounded-md bg-muted/50 p-2.5">
        <p className="text-[10px] text-muted-foreground">
          Connect the <span className="font-medium text-emerald-600">Reply</span> handle for when the contact responds,
          and the <span className="font-medium text-amber-600">Timeout</span> handle if they don&apos;t.
        </p>
      </div>
    </>
  );
}

// ---------- HTTP Request Config ----------

function HttpRequestConfig({ data, onChange }: { data: HttpRequestNode; onChange: (d: HttpRequestNode) => void }) {
  const headers = data.headers ?? {};
  const headerEntries = Object.entries(headers);
  const responseMapping = data.responseMapping ?? [];

  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>Method</FieldLabel>
        <Select
          value={data.method}
          onChange={(v) => onChange({ ...data, method: v as "GET" | "POST" })}
          options={[
            { value: "GET", label: "GET" },
            { value: "POST", label: "POST" },
          ]}
        />
      </div>

      <div className="space-y-1.5">
        <FieldLabel>URL</FieldLabel>
        <Input
          value={data.url}
          onChange={(v) => onChange({ ...data, url: v })}
          placeholder="https://api.example.com/endpoint"
        />
        <p className="text-[10px] text-muted-foreground">
          Use {"{{variable}}"} for dynamic values. HTTPS only.
        </p>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Headers</FieldLabel>
        {headerEntries.map(([key, val], i) => (
          <div key={i} className="flex items-center gap-1">
            <Input
              value={key}
              onChange={(newKey) => {
                const updated = { ...headers };
                delete updated[key];
                updated[newKey] = val;
                onChange({ ...data, headers: updated });
              }}
              placeholder="Header-Name"
            />
            <Input
              value={val}
              onChange={(newVal) => {
                onChange({ ...data, headers: { ...headers, [key]: newVal } });
              }}
              placeholder="value"
            />
            <button
              onClick={() => {
                const updated = { ...headers };
                delete updated[key];
                onChange({ ...data, headers: Object.keys(updated).length > 0 ? updated : undefined });
              }}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => onChange({ ...data, headers: { ...headers, "": "" } })}
        >
          <Plus className="mr-1 h-3 w-3" /> Add Header
        </Button>
      </div>

      {data.method === "POST" && (
        <div className="space-y-1.5">
          <FieldLabel>Body Template (JSON)</FieldLabel>
          <Textarea
            value={data.bodyTemplate ?? ""}
            onChange={(v) => onChange({ ...data, bodyTemplate: v || undefined })}
            placeholder={'{"email": "{{email}}"}'}
            rows={4}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <FieldLabel>Response Mapping</FieldLabel>
        {responseMapping.map((m, i) => (
          <div key={i} className="flex items-center gap-1">
            <Input
              value={m.jsonPath}
              onChange={(v) => {
                const updated = [...responseMapping];
                updated[i] = { ...m, jsonPath: v };
                onChange({ ...data, responseMapping: updated });
              }}
              placeholder="$.data.id"
            />
            <Input
              value={m.variable}
              onChange={(v) => {
                const updated = [...responseMapping];
                updated[i] = { ...m, variable: v };
                onChange({ ...data, responseMapping: updated });
              }}
              placeholder="variable_name"
            />
            <button
              onClick={() => onChange({ ...data, responseMapping: responseMapping.filter((_, j) => j !== i) })}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => onChange({ ...data, responseMapping: [...responseMapping, { jsonPath: "", variable: "" }] })}
        >
          <Plus className="mr-1 h-3 w-3" /> Add Mapping
        </Button>
        <p className="text-[10px] text-muted-foreground">
          Map JSON response fields to flow variables.
        </p>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Timeout (ms)</FieldLabel>
        <Input
          type="number"
          value={data.timeoutMs}
          onChange={(v) => onChange({ ...data, timeoutMs: Math.min(30000, Math.max(1000, Number(v))) })}
        />
      </div>
    </>
  );
}

// ---------- AI Reply Config ----------

function AiReplyConfig({ data, onChange }: { data: AiReplyNode; onChange: (d: AiReplyNode) => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <FieldLabel>System Prompt</FieldLabel>
        <Textarea
          value={data.systemPrompt}
          onChange={(v) => onChange({ ...data, systemPrompt: v })}
          placeholder="You are a helpful customer support agent for our store…"
          rows={5}
        />
        <p className="text-[10px] text-muted-foreground">
          Use {"{{variable}}"} for dynamic context. The contact&apos;s message is provided automatically.
        </p>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Max Tokens</FieldLabel>
        <Input
          type="number"
          value={data.maxTokens}
          onChange={(v) => onChange({ ...data, maxTokens: Math.min(1000, Math.max(1, Number(v))) })}
        />
        <p className="text-[10px] text-muted-foreground">
          Maximum response length (1–1000 tokens).
        </p>
      </div>

      <div className="space-y-1.5">
        <FieldLabel>Fallback Text</FieldLabel>
        <Textarea
          value={data.fallbackText}
          onChange={(v) => onChange({ ...data, fallbackText: v })}
          placeholder="Sorry, I can't help with that right now. A team member will follow up."
          rows={2}
        />
        <p className="text-[10px] text-muted-foreground">
          Sent if the AI fails to generate a response.
        </p>
      </div>
    </>
  );
}
