import Image from "next/image";
import { getNetworkIconPath } from "@/lib/networks/icons";
import { cx } from "@/components/azu/utils";

export function NetworkLogo({ id, size = 40, className }: { id: string; size?: number; className?: string }) {
  return (
    <span
      className={cx("grid shrink-0 place-items-center rounded-full border border-cyan/30 bg-cyan/10 shadow-cyan", className)}
      style={{ width: size, height: size }}
    >
      <Image src={getNetworkIconPath(id)} alt={`${id} network logo`} width={size} height={size} className="h-full w-full rounded-full object-contain" loading="lazy" />
    </span>
  );
}
