"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cx } from "@/components/azu/utils";

export function openVeloraAssistant() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("velora:open-assistant"));
}

export function OpenAssistantButton({
  children = "Open Assistant",
  className
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={openVeloraAssistant}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-black text-white shadow-[0_14px_34px_rgba(249,115,22,0.24)] transition hover:scale-[1.01] hover:brightness-110",
        className
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4" />
    </button>
  );
}
