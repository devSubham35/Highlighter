import Image from "next/image";

export function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[760px] md:-ml-8 lg:-ml-14 lg:w-[118%]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-12 rounded-full bg-primary/15 blur-3xl"
      />
      <Image
        src="/assets/hero.png"
        alt="Highlight visual bug reporting interface"
        width={1536}
        height={1024}
        priority
        className="relative h-auto w-full object-contain"
        sizes="(min-width: 1024px) 760px, (min-width: 768px) 58vw, 100vw"
      />
    </div>
  );
}
