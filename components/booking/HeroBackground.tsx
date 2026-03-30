import Image from "next/image";

export function HeroBackground({ priority = false }: { priority?: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Image
        src="/login-hero-bg.png"
        alt=""
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover object-center scale-[1.02]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/82 via-[#0f172a]/78 to-[#0a1628]/92"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(10,22,40,0.55)_70%,rgba(10,22,40,0.85)_100%)]"
        aria-hidden
      />
    </div>
  );
}
