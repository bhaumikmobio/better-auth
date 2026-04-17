import Image from "next/image";
import { APP_COPY } from "@/constants/messages";

type BrandLogoProps = {
  title?: string;
  logoSrc?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: {
    wrapper: "h-10 w-10",
    text: "text-xl",
  },
  md: {
    wrapper: "h-11 w-11",
    text: "text-2xl",
  },
  lg: {
    wrapper: "h-16 w-16",
    text: "text-4xl",
  },
} as const;

const imageSizes = {
  sm: "40px",
  md: "44px",
  lg: "64px",
} as const;

export function BrandLogo({
  title = APP_COPY.appTitle,
  logoSrc = "/favIcon.png",
  size = "md",
  className = "",
}: BrandLogoProps) {
  const selectedSize = sizeClasses[size];

  return (
    <div className={`w-full ${className}`}>
      <div className="flex w-full items-center justify-center gap-3 rounded-3xl border border-cyan-200/80 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-100 px-5 py-2 shadow-[0_20px_42px_-28px_rgba(14,116,144,0.8)]">
        <div className={`${selectedSize.wrapper} relative`}>
          <Image
            src={logoSrc}
            alt={`${title} logo`}
            fill
            sizes={imageSizes[size]}
            priority
            className="object-contain"
          />
        </div>
        <h1
          className={`${selectedSize.text} text-center font-extrabold tracking-tight text-transparent bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-700 bg-clip-text`}
        >
          {title}
        </h1>
      </div>
    </div>
  );
}
