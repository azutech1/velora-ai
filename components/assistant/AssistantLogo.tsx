"use client";

import Image from "next/image";
import { cx } from "@/components/azu/utils";

type AssistantLogoProps = {
  size?: 28 | 30 | 32 | 36 | 38 | 40 | 44 | 48 | 64 | 128 | number;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

function avatarSource(size: number) {
  if (size <= 32) return "/assets/velora-ai-assistant-avatar-32.png";
  if (size <= 40) return "/assets/velora-ai-assistant-avatar-40.png";
  if (size <= 64) return "/assets/velora-ai-assistant-avatar-64.png";
  return "/assets/velora-ai-assistant-avatar-128.png";
}

export function AssistantLogo({ size = 40, className, imageClassName, priority = false }: AssistantLogoProps) {
  return (
    <span
      className={cx(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-400/35 bg-black shadow-[0_0_24px_rgba(249,115,22,0.24),0_0_20px_rgba(20,184,166,0.16)] light:border-black/15 light:bg-white light:shadow-[0_14px_34px_rgba(15,23,42,0.14)]",
        className
      )}
      style={{ width: size, height: size, borderRadius: "50%" }}
    >
      <Image
        src={avatarSource(size)}
        alt="Velora AI Assistant logo"
        width={size}
        height={size}
        priority={priority}
        sizes={`${size}px`}
        className={cx("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}
