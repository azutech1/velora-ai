import { LogoMark } from "@/components/azu/brand";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#05070D] px-6">
      <div className="text-center">
        <div className="relative mx-auto grid h-24 w-24 place-items-center">
          <div className="absolute inset-0 animate-ping rounded-2xl border border-cyan/30" />
          <div className="absolute inset-2 animate-pulse rounded-2xl bg-cyan/10" />
          <LogoMark size={76} className="relative rounded-2xl" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-cyan">Loading Velora</p>
      </div>
    </main>
  );
}
