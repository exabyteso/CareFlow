import Image from "next/image";

type BrandMarkProps = {
  size?: number;
  className?: string;
  /** Compact header chip vs landing hero (centered, vw-sized). */
  variant?: "mark" | "hero";
};

/** Square CareFlow infinity mark. Decorative when placed next to a CareFlow title. */
export function BrandMark({
  size = 40,
  className = "",
  variant = "mark",
}: BrandMarkProps) {
  if (variant === "hero") {
    return (
      <div className={`relative flex w-full justify-center ${className}`}>
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(74,168,181,0.42)_0%,_rgba(30,99,184,0.22)_45%,_transparent_72%)] blur-3xl"
        />
        <Image
          src="/icons/hero.png"
          alt=""
          width={866}
          height={481}
          priority
          sizes="(min-width: 1024px) 40vw, 80vw"
          className="relative h-auto w-[80vw] max-w-full drop-shadow-[0_18px_40px_rgba(30,99,184,0.45)] lg:w-[40vw]"
        />
      </div>
    );
  }

  return (
    <Image
      src="/icons/icon-192.png"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-xl bg-white ${className}`}
    />
  );
}
