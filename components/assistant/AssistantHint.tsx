"use client";

import { Sparkles } from "lucide-react";
import { OpenAssistantButton } from "./OpenAssistantButton";

export function AssistantHint({ tip }: { tip: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange/25 bg-orange/10 p-4 light:border-black light:bg-orange-50">
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-black text-white light:text-slate-950">Tip</p>
          <p className="mt-1 text-sm leading-6 text-slate-300 light:text-slate-700">{tip}</p>
        </div>
      </div>
      <OpenAssistantButton />
    </div>
  );
}
