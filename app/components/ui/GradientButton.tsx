// components/ui/GradientButton.tsx
import Link from "next/link";

type Variant = "solid" | "outline" | "ghost";

export function GradientButton({
  children,
  href,
  onClick,
  variant = "solid",
  className = "",
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold transition-all duration-300 group overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed";

  const variants: Record<Variant, string> = {
    solid:
      "bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30",
    outline:
      "border border-white/15 text-white/80 hover:border-cyan-400/50 hover:text-cyan-300 bg-white/5 backdrop-blur-sm",
    ghost: "text-white/60 hover:text-white",
  };

  const inner = (
    <>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === "solid" && (
        <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {inner}
    </button>
  );
}