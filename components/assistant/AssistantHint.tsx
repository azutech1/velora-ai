"use client";

import { OpenAssistantButton } from "./OpenAssistantButton";
import { AssistantLogo } from "./AssistantLogo";

export function AssistantHint({ tip }: { tip: string }) {
  return (
    <div className="rounded-2xl border border-orange/25 bg-orange/10 p-4 shadow-[0_18px_55px_rgba(249,115,22,0.08)] light:border-black light:bg-orange-50">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AssistantLogo size={38} />
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-200 light:text-orange-700">Velora AI Tip</p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-200 light:text-slate-800">{tip}</p>
          </div>
        </div>
        <OpenAssistantButton>Open Assistant</OpenAssistantButton>
      </div>
    </div>
  );
}
