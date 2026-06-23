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
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/opos-logo.png"
        alt="Yemame OPOS"
        width={size}
        height={size}
        className="object-contain"
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
