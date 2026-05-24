import { CheckCircle2 } from "lucide-react";

export function UtilityGrid({ utilities }: { utilities: string[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {utilities.map((utility) => (
        <div key={utility} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <CheckCircle2 className="h-5 w-5 text-mint" />
          <p className="mt-4 font-semibold text-white">{utility}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">Designed as product utility inside the Velora AI stablecoin operating system.</p>
        </div>
      ))}
    </div>
  );
}
