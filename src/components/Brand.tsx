import Image from "next/image";

/** The Yemame OPOS wordmark + logo lockup. */
export function Brand({
  className = "",
  showText = true,
  size = 28,
}: {
  className?: string;
  showText?: boolean;
  size?: number;
}) {
  // Round the logo's corners so the square artwork reads as a tidy app-icon
  // tile everywhere it appears (header, footer, auth pages). Scale the radius
  // with the logo size so it stays proportional.
  const radius = Math.round(size * 0.26);
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/opos-logo.png"
        alt="Yemame OPOS"
        width={size}
        height={size}
        className="object-contain"
        style={{ borderRadius: radius }}
        priority
      />
      {showText && (
        <span className="font-bold tracking-tight">
          Yemame <span className="text-teal-600">OPOS</span>
        </span>
      )}
    </span>
  );
}
