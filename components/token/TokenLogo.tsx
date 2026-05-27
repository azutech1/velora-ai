import Image from "next/image";
import { getTokenIconPath } from "@/lib/tokens/icons";
import { cx } from "@/components/azu/utils";

export function TokenLogo({ symbol, size = 40, className }: { symbol: string; size?: number; className?: string }) {
  return (
    <span
      className={cx("grid shrink-0 place-items-center rounded-full border border-mint/30 bg-mint/10 shadow-neon", className)}
      style={{ width: size, height: size }}
    >
      <Image src={getTokenIconPath(symbol)} alt={`${symbol} logo`} width={size} height={size} className="h-full w-full rounded-full object-contain" loading="lazy" />
    </span>
  );
}
