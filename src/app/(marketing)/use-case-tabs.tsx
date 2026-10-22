"use client";

import { useRef, useState, type KeyboardEvent } from "react";

const useCases = [
  {
    id: "creators",
    label: "Creators",
    title: "Deliver the resource they came for.",
    description:
      "When someone comments for your checklist, recipe, or latest guide, send the right follow-up and keep the conversation moving.",
    example: "Comment “GUIDE” → Send your free resource → Continue the conversation",
  },
  {
    id: "ecommerce",
    label: "E-commerce",
    title: "Turn product questions into helpful answers.",
    description:
      "Welcome shoppers from comments, answer common questions, and point them toward the details they need to choose with confidence.",
    example: "Comment “SIZE” → Share sizing details → Hand off when needed",
  },
  {
    id: "agencies",
    label: "Agencies",
    title: "Keep client conversations organized.",
    description:
      "Build repeatable automations for the accounts you support and give your team a shared place to follow every conversation.",
    example: "New comment → Apply a client workflow → Review in the shared inbox",
  },
  {
    id: "coaches",
    label: "Coaches",
    title: "Make it easy to take the next step.",
    description:
      "Respond to interest in your program, share the right next step, and leave space for a personal conversation when it counts.",
    example: "Comment “COACHING” → Share program details → Invite a reply",
  },
];

export default function UseCaseTabs() {
  const [active, setActive] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | undefined;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % useCases.length;
    if (event.key === "ArrowLeft") nextIndex = (index + useCases.length - 1) % useCases.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = useCases.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      setActive(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    }
  }

  const selected = useCases[active];
  if (!selected) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#101015]">
      <div role="tablist" aria-label="Use cases" className="flex overflow-x-auto border-b border-white/[0.07] p-2">
        {useCases.map((useCase, index) => (
          <button
            key={useCase.id}
            ref={(element) => { tabRefs.current[index] = element; }}
            id={`tab-${useCase.id}`}
            type="button"
            role="tab"
            aria-selected={active === index}
            aria-controls={`panel-${useCase.id}`}
            tabIndex={active === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-medium transition sm:px-5 sm:text-sm ${
              active === index ? "bg-white/[0.09] text-white" : "text-zinc-500 hover:text-zinc-200"
            }`}
          >
            {useCase.label}
          </button>
        ))}
      </div>
      <div
        id={`panel-${selected.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${selected.id}`}
        tabIndex={0}
        className="grid gap-8 p-6 sm:p-9 md:grid-cols-[1fr_.8fr] md:items-center"
      >
        <div>
          <p className="mb-3 text-xs font-medium text-pink-300">{selected.label}</p>
          <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{selected.title}</h3>
          <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-400">{selected.description}</p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4 sm:p-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-600">Example flow</p>
          <p className="text-sm leading-6 text-zinc-300">{selected.example}</p>
        </div>
      </div>
    </div>
  );
}
