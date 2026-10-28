import { describe, it, expect } from "vitest";
import { step, type FlowRunState, type IncomingEvent } from "./step";
import type { FlowDefinition } from "./schema";

function makeRun(overrides: Partial<FlowRunState> = {}): FlowRunState {
  return {
    id: "run_1",
    flowId: "flow_1",
    contactId: "contact_1",
    currentNodeId: null,
    status: "running",
    context: {
      variables: {},
      capturedFields: {},
      privateReplySent: {},
      tags: [],
    },
    ...overrides,
  };
}

const triggerEvent: IncomingEvent = { type: "trigger", commentId: "comment_1", senderId: "sender_1" };

describe("Engine step() — Trigger node", () => {
  const flow: FlowDefinition = {
    nodes: [
      { id: "t1", data: { type: "trigger", triggerType: "comment_keyword", cooldownHours: 24 } },
      { id: "m1", data: { type: "message", messageType: "dm", text: "Hello!" } },
    ],
    edges: [{ id: "e1", source: "t1", target: "m1" }],
  };

  it("starts from trigger and advances to next node", () => {
    const result = step(makeRun(), triggerEvent, flow);
    expect(result.actions.some((a) => a.type === "send_dm")).toBe(true);
    expect(result.nextState.status).toBe("completed");
  });

  it("fails if no trigger node exists", () => {
    const noTriggerFlow: FlowDefinition = { nodes: [], edges: [] };
    const result = step(makeRun(), triggerEvent, noTriggerFlow);
    expect(result.nextState.status).toBe("failed");
  });
});

describe("Engine step() — Message node", () => {
  it("sends a DM with interpolated variables", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Hi {{name}}!" } },
      ],
      edges: [{ id: "e1", source: "t1", target: "m1" }],
    };

    const run = makeRun({ context: { variables: { name: "Alice" }, capturedFields: {}, privateReplySent: {}, tags: [] } });
    const result = step(run, triggerEvent, flow);
    const dm = result.actions.find((a) => a.type === "send_dm");
    expect(dm).toBeDefined();
    if (dm?.type === "send_dm") {
      expect(dm.text).toBe("Hi Alice!");
    }
  });

  it("picks a random variant when variants are provided", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "m1", data: { type: "message", messageType: "dm", variants: ["A", "B", "C"] } },
      ],
      edges: [{ id: "e1", source: "t1", target: "m1" }],
    };

    const result = step(makeRun(), triggerEvent, flow);
    const dm = result.actions.find((a) => a.type === "send_dm");
    expect(dm).toBeDefined();
    if (dm?.type === "send_dm") {
      expect(["A", "B", "C"]).toContain(dm.text);
    }
  });

  it("sends comment reply with commentId", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "comment_keyword", cooldownHours: 0 } },
        { id: "m1", data: { type: "message", messageType: "comment_reply", text: "Thanks!" } },
      ],
      edges: [{ id: "e1", source: "t1", target: "m1" }],
    };

    const result = step(makeRun(), triggerEvent, flow);
    const reply = result.actions.find((a) => a.type === "send_comment_reply");
    expect(reply).toBeDefined();
  });

  it("enforces one private reply per comment", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "comment_keyword", cooldownHours: 0 } },
        { id: "m1", data: { type: "message", messageType: "private_reply", text: "Check DM!" } },
        { id: "m2", data: { type: "message", messageType: "private_reply", text: "Second DM!" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "m1" },
        { id: "e2", source: "m1", target: "m2" },
      ],
    };

    const result = step(makeRun(), triggerEvent, flow);
    const privateReplies = result.actions.filter((a) => a.type === "send_private_reply");
    expect(privateReplies).toHaveLength(1);
  });

  it("sends DM with quick replies", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Pick one:", quickReplies: [{ title: "Yes", payload: "yes" }, { title: "No", payload: "no" }] } },
      ],
      edges: [{ id: "e1", source: "t1", target: "m1" }],
    };

    const result = step(makeRun(), triggerEvent, flow);
    const dm = result.actions.find((a) => a.type === "send_dm");
    if (dm?.type === "send_dm") {
      expect(dm.quickReplies).toHaveLength(2);
    }
  });
});

describe("Engine step() — Condition node", () => {
  function conditionFlow(field: string, value?: string): FlowDefinition {
    return {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "c1", data: { type: "condition", field: field as "is_follower", operator: "exists", value } },
        { id: "m_yes", data: { type: "message", messageType: "dm", text: "YES" } },
        { id: "m_no", data: { type: "message", messageType: "dm", text: "NO" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "c1" },
        { id: "e2", source: "c1", target: "m_yes", sourceHandle: "true" },
        { id: "e3", source: "c1", target: "m_no", sourceHandle: "false" },
      ],
    };
  }

  it("branches true when contact is follower", () => {
    const result = step(makeRun(), { ...triggerEvent, isFollower: true }, conditionFlow("is_follower"));
    const dm = result.actions.find((a) => a.type === "send_dm");
    if (dm?.type === "send_dm") expect(dm.text).toBe("YES");
  });

  it("branches false when contact is not follower", () => {
    const result = step(makeRun(), { ...triggerEvent, isFollower: false }, conditionFlow("is_follower"));
    const dm = result.actions.find((a) => a.type === "send_dm");
    if (dm?.type === "send_dm") expect(dm.text).toBe("NO");
  });

  it("branches true when contact has email", () => {
    const result = step(makeRun(), { ...triggerEvent, contactEmail: "a@b.com" }, conditionFlow("has_email"));
    const dm = result.actions.find((a) => a.type === "send_dm");
    if (dm?.type === "send_dm") expect(dm.text).toBe("YES");
  });

  it("branches true when email is in captured fields", () => {
    const run = makeRun({ context: { variables: {}, capturedFields: { email: "a@b.com" }, privateReplySent: {}, tags: [] } });
    const result = step(run, triggerEvent, conditionFlow("has_email"));
    const dm = result.actions.find((a) => a.type === "send_dm");
    if (dm?.type === "send_dm") expect(dm.text).toBe("YES");
  });

  it("branches true when contact has matching tag", () => {
    const result = step(makeRun(), { ...triggerEvent, contactTags: ["VIP", "lead"] }, conditionFlow("has_tag", "VIP"));
    const dm = result.actions.find((a) => a.type === "send_dm");
    if (dm?.type === "send_dm") expect(dm.text).toBe("YES");
  });

  it("branches false when contact missing tag", () => {
    const result = step(makeRun(), { ...triggerEvent, contactTags: ["lead"] }, conditionFlow("has_tag", "VIP"));
    const dm = result.actions.find((a) => a.type === "send_dm");
    if (dm?.type === "send_dm") expect(dm.text).toBe("NO");
  });
});

describe("Engine step() — Delay node", () => {
  const flow: FlowDefinition = {
    nodes: [
      { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
      { id: "d1", data: { type: "delay", duration: 2, unit: "hours" } },
      { id: "m1", data: { type: "message", messageType: "dm", text: "After delay" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "d1" },
      { id: "e2", source: "d1", target: "m1" },
    ],
  };

  it("schedules a delay and sets status to waiting", () => {
    const result = step(makeRun(), triggerEvent, flow);
    const delay = result.actions.find((a) => a.type === "schedule_delay");
    expect(delay).toBeDefined();
    if (delay?.type === "schedule_delay") {
      expect(delay.durationMs).toBe(2 * 3_600_000);
    }
    expect(result.nextState.status).toBe("waiting");
    expect(result.nextState.currentNodeId).toBe("m1");
  });

  it("resumes after delay and sends the message", () => {
    const resumeRun = makeRun({ currentNodeId: "m1", status: "running" });
    const result = step(resumeRun, { type: "timeout" }, flow);
    const dm = result.actions.find((a) => a.type === "send_dm");
    expect(dm).toBeDefined();
    if (dm?.type === "send_dm") expect(dm.text).toBe("After delay");
    expect(result.nextState.status).toBe("completed");
  });
});

describe("Engine step() — Lead Capture node", () => {
  const flow: FlowDefinition = {
    nodes: [
      { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
      { id: "lc1", data: { type: "lead_capture", field: "email", promptText: "What is your email?" } },
      { id: "m1", data: { type: "message", messageType: "dm", text: "Got it: {{email}}" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "lc1" },
      { id: "e2", source: "lc1", target: "m1" },
    ],
  };

  it("sends prompt and waits for reply on trigger", () => {
    const result = step(makeRun(), triggerEvent, flow);
    const prompt = result.actions.find((a) => a.type === "request_reply");
    expect(prompt).toBeDefined();
    expect(result.nextState.status).toBe("waiting");
    expect(result.nextState.currentNodeId).toBe("lc1");
  });

  it("captures valid email and advances", () => {
    const run = makeRun({ currentNodeId: "lc1", status: "running" });
    const result = step(run, { type: "message", text: "alice@example.com" }, flow);
    const capture = result.actions.find((a) => a.type === "capture_lead");
    expect(capture).toBeDefined();
    if (capture?.type === "capture_lead") {
      expect(capture.field).toBe("email");
      expect(capture.value).toBe("alice@example.com");
    }
    expect(result.nextState.context.capturedFields["email"]).toBe("alice@example.com");

    const dm = result.actions.find((a) => a.type === "send_dm");
    if (dm?.type === "send_dm") expect(dm.text).toBe("Got it: alice@example.com");
  });

  it("rejects invalid email and stays waiting", () => {
    const run = makeRun({ currentNodeId: "lc1", status: "running" });
    const result = step(run, { type: "message", text: "not-an-email" }, flow);
    expect(result.nextState.status).toBe("waiting");
    expect(result.nextState.currentNodeId).toBe("lc1");
    const errorDm = result.actions.find((a) => a.type === "send_dm");
    expect(errorDm).toBeDefined();
  });

  it("captures valid phone number", () => {
    const phoneFlow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "lc1", data: { type: "lead_capture", field: "phone", promptText: "Your phone?" } },
      ],
      edges: [{ id: "e1", source: "t1", target: "lc1" }],
    };

    const run = makeRun({ currentNodeId: "lc1", status: "running" });
    const result = step(run, { type: "message", text: "+1 555-123-4567" }, phoneFlow);
    const capture = result.actions.find((a) => a.type === "capture_lead");
    expect(capture).toBeDefined();
  });
});

describe("Engine step() — Complex flow", () => {
  const flow: FlowDefinition = {
    nodes: [
      { id: "t1", data: { type: "trigger", triggerType: "comment_keyword", keywords: ["info"], cooldownHours: 24 } },
      { id: "m1", data: { type: "message", messageType: "private_reply", text: "Thanks for your interest!" } },
      { id: "c1", data: { type: "condition", field: "has_email", operator: "exists" } },
      { id: "lc1", data: { type: "lead_capture", field: "email", promptText: "Drop your email:" } },
      { id: "m2", data: { type: "message", messageType: "dm", text: "Welcome {{email}}!" } },
      { id: "d1", data: { type: "delay", duration: 30, unit: "minutes" } },
      { id: "m3", data: { type: "message", messageType: "dm", text: "Here is your guide!" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "m1" },
      { id: "e2", source: "m1", target: "c1" },
      { id: "e3", source: "c1", target: "m2", sourceHandle: "true" },
      { id: "e4", source: "c1", target: "lc1", sourceHandle: "false" },
      { id: "e5", source: "lc1", target: "m2" },
      { id: "e6", source: "m2", target: "d1" },
      { id: "e7", source: "d1", target: "m3" },
    ],
  };

  it("full flow: trigger → private reply → condition (no email) → lead capture → wait", () => {
    const result = step(makeRun(), triggerEvent, flow);

    const privateReply = result.actions.find((a) => a.type === "send_private_reply");
    expect(privateReply).toBeDefined();

    const prompt = result.actions.find((a) => a.type === "request_reply");
    expect(prompt).toBeDefined();

    expect(result.nextState.status).toBe("waiting");
    expect(result.nextState.currentNodeId).toBe("lc1");
  });

  it("full flow: resume with email → welcome → delay → wait", () => {
    const run = makeRun({ currentNodeId: "lc1", status: "running" });
    const result = step(run, { type: "message", text: "alice@test.com" }, flow);

    const dm = result.actions.find(
      (a) => a.type === "send_dm" && a.text === "Welcome alice@test.com!"
    );
    expect(dm).toBeDefined();

    const delay = result.actions.find((a) => a.type === "schedule_delay");
    expect(delay).toBeDefined();
    expect(result.nextState.status).toBe("waiting");
  });

  it("full flow: resume after delay → final message → completed", () => {
    const run = makeRun({ currentNodeId: "m3", status: "running" });
    const result = step(run, { type: "timeout" }, flow);

    const dm = result.actions.find(
      (a) => a.type === "send_dm" && a.text === "Here is your guide!"
    );
    expect(dm).toBeDefined();
    expect(result.nextState.status).toBe("completed");
  });
});

describe("Engine step() — Edge cases", () => {
  it("handles missing node gracefully", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: "missing_node" }],
    };

    const result = step(makeRun(), triggerEvent, flow);
    expect(result.nextState.status).toBe("failed");
  });

  it("completes when no outgoing edges", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Done" } },
      ],
      edges: [{ id: "e1", source: "t1", target: "m1" }],
    };

    const result = step(makeRun(), triggerEvent, flow);
    expect(result.nextState.status).toBe("completed");
  });

  it("prevents infinite loops with iteration limit", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Loop" } },
        { id: "m2", data: { type: "message", messageType: "dm", text: "Loop2" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "m1" },
        { id: "e2", source: "m1", target: "m2" },
        { id: "e3", source: "m2", target: "m1" },
      ],
    };

    const result = step(makeRun(), triggerEvent, flow);
    expect(result.nextState.status).toBe("running");
  });
});

describe("Engine step() — Wait for Reply node", () => {
  const flow: FlowDefinition = {
    nodes: [
      { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
      { id: "w1", data: { type: "wait_for_reply", timeoutMinutes: 30 } },
      { id: "m_reply", data: { type: "message", messageType: "dm", text: "Got reply" } },
      { id: "m_timeout", data: { type: "message", messageType: "dm", text: "Timed out" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "w1" },
      { id: "e2", source: "w1", target: "m_reply", sourceHandle: "reply" },
      { id: "e3", source: "w1", target: "m_timeout", sourceHandle: "timeout" },
    ],
  };

  it("emits schedule_wait_timeout and sets status to waiting on first visit", () => {
    const result = step(makeRun(), triggerEvent, flow);
    const waitAction = result.actions.find((a) => a.type === "schedule_wait_timeout");
    expect(waitAction).toBeDefined();
    if (waitAction?.type === "schedule_wait_timeout") {
      expect(waitAction.durationMs).toBe(1_800_000);
    }
    expect(result.nextState.status).toBe("waiting");
    expect(result.nextState.currentNodeId).toBe("w1");
  });

  it("follows reply handle when message event resumes", () => {
    const run = makeRun({ currentNodeId: "w1", status: "running" });
    const result = step(run, { type: "message", text: "hello" }, flow);
    const dm = result.actions.find((a) => a.type === "send_dm");
    expect(dm).toBeDefined();
    if (dm?.type === "send_dm") expect(dm.text).toBe("Got reply");
    expect(result.nextState.status).toBe("completed");
  });

  it("follows timeout handle when timeout event resumes", () => {
    const run = makeRun({ currentNodeId: "w1", status: "running" });
    const result = step(run, { type: "timeout" }, flow);
    const dm = result.actions.find((a) => a.type === "send_dm");
    expect(dm).toBeDefined();
    if (dm?.type === "send_dm") expect(dm.text).toBe("Timed out");
    expect(result.nextState.status).toBe("completed");
  });

  it("sends timeoutText DM when timing out with timeoutText configured", () => {
    const flowWithText: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "w1", data: { type: "wait_for_reply", timeoutMinutes: 30, timeoutText: "Sorry, you took too long" } },
        { id: "m_reply", data: { type: "message", messageType: "dm", text: "Got reply" } },
        { id: "m_timeout", data: { type: "message", messageType: "dm", text: "Timed out" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "w1" },
        { id: "e2", source: "w1", target: "m_reply", sourceHandle: "reply" },
        { id: "e3", source: "w1", target: "m_timeout", sourceHandle: "timeout" },
      ],
    };

    const run = makeRun({ currentNodeId: "w1", status: "running" });
    const result = step(run, { type: "timeout" }, flowWithText);
    const dms = result.actions.filter((a) => a.type === "send_dm");
    expect(dms.some((a) => a.type === "send_dm" && a.text === "Sorry, you took too long")).toBe(true);
    expect(dms.some((a) => a.type === "send_dm" && a.text === "Timed out")).toBe(true);
  });
});

describe("Engine step() — HTTP Request node", () => {
  it("emits http_request action with interpolated URL and body", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "h1", data: { type: "http_request", url: "https://api.example.com/{{name}}", method: "POST", bodyTemplate: '{"email":"{{email}}"}', responseMapping: [{ jsonPath: "$.id", variable: "api_id" }], timeoutMs: 5000 } },
        { id: "m1", data: { type: "message", messageType: "dm", text: "Done" } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "h1" },
        { id: "e2", source: "h1", target: "m1" },
      ],
    };

    const run = makeRun({ context: { variables: { name: "alice" }, capturedFields: { email: "a@b.com" }, privateReplySent: {}, tags: [] } });
    const result = step(run, triggerEvent, flow);
    const httpAction = result.actions.find((a) => a.type === "http_request");
    expect(httpAction).toBeDefined();
    if (httpAction?.type === "http_request") {
      expect(httpAction.url).toBe("https://api.example.com/alice");
      expect(httpAction.body).toBe('{"email":"a@b.com"}');
      expect(httpAction.method).toBe("POST");
      expect(httpAction.responseMapping).toHaveLength(1);
      expect(httpAction.timeoutMs).toBe(5000);
    }
    const dm = result.actions.find((a) => a.type === "send_dm");
    expect(dm).toBeDefined();
    if (dm?.type === "send_dm") expect(dm.text).toBe("Done");
    expect(result.nextState.status).toBe("completed");
  });

  it("uses GET with no body by default", () => {
    const flow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "h1", data: { type: "http_request", url: "https://api.example.com/check", method: "GET", timeoutMs: 10000 } },
      ],
      edges: [
        { id: "e1", source: "t1", target: "h1" },
      ],
    };

    const result = step(makeRun(), triggerEvent, flow);
    const httpAction = result.actions.find((a) => a.type === "http_request");
    expect(httpAction).toBeDefined();
    if (httpAction?.type === "http_request") {
      expect(httpAction.method).toBe("GET");
      expect(httpAction.body).toBeUndefined();
    }
  });
});

describe("Engine step() — AI Reply node", () => {
  const flow: FlowDefinition = {
    nodes: [
      { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
      { id: "a1", data: { type: "ai_reply", systemPrompt: "You are a helpful assistant", maxTokens: 200, fallbackText: "Sorry, I can't help right now" } },
      { id: "m1", data: { type: "message", messageType: "dm", text: "follow up" } },
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1" },
      { id: "e2", source: "a1", target: "m1" },
    ],
  };

  it("emits ai_reply action and sets status to waiting", () => {
    const event: IncomingEvent = { type: "trigger", text: "What is your return policy?" };
    const result = step(makeRun(), event, flow);
    const aiAction = result.actions.find((a) => a.type === "ai_reply");
    expect(aiAction).toBeDefined();
    if (aiAction?.type === "ai_reply") {
      expect(aiAction.systemPrompt).toBe("You are a helpful assistant");
      expect(aiAction.contactMessage).toBe("What is your return policy?");
      expect(aiAction.maxTokens).toBe(200);
      expect(aiAction.fallbackText).toBe("Sorry, I can't help right now");
    }
    expect(result.nextState.status).toBe("waiting");
    expect(result.nextState.currentNodeId).toBe("m1");
  });

  it("interpolates variables in systemPrompt", () => {
    const varFlow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "a1", data: { type: "ai_reply", systemPrompt: "Help {{name}} with their order", maxTokens: 200, fallbackText: "Sorry" } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };

    const run = makeRun({ context: { variables: { name: "Bob" }, capturedFields: {}, privateReplySent: {}, tags: [] } });
    const result = step(run, triggerEvent, varFlow);
    const aiAction = result.actions.find((a) => a.type === "ai_reply");
    if (aiAction?.type === "ai_reply") {
      expect(aiAction.systemPrompt).toBe("Help Bob with their order");
    }
  });

  it("interpolates fallbackText variables", () => {
    const varFlow: FlowDefinition = {
      nodes: [
        { id: "t1", data: { type: "trigger", triggerType: "dm_keyword", cooldownHours: 0 } },
        { id: "a1", data: { type: "ai_reply", systemPrompt: "Help", maxTokens: 200, fallbackText: "Sorry {{name}}, try again later" } },
      ],
      edges: [{ id: "e1", source: "t1", target: "a1" }],
    };

    const run = makeRun({ context: { variables: { name: "Bob" }, capturedFields: {}, privateReplySent: {}, tags: [] } });
    const result = step(run, triggerEvent, varFlow);
    const aiAction = result.actions.find((a) => a.type === "ai_reply");
    if (aiAction?.type === "ai_reply") {
      expect(aiAction.fallbackText).toBe("Sorry Bob, try again later");
    }
  });
});
