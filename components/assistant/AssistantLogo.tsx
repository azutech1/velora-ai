"use client";

import Image from "next/image";
import { cx } from "@/components/azu/utils";

type AssistantLogoProps = {
  size?: number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function AssistantLogo({ size = 40, className, imageClassName, priority = false }: AssistantLogoProps) {
  return (
    <span
      className={cx(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-orange-400/35 bg-black shadow-[0_0_24px_rgba(249,115,22,0.24),0_0_20px_rgba(20,184,166,0.16)] light:border-black/15 light:bg-white light:shadow-[0_14px_34px_rgba(15,23,42,0.14)]",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/assets/velora-ai-assistant-logo.png"
        alt="Velora AI Assistant logo"
        width={size}
        height={size}
        priority={priority}
        className={cx("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}
