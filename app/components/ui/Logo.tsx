// components/ui/Logo.tsx
import Link from "next/link";

export function Logo({
  href = "/dashboard",
  className = "",
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`text-lg font-bold tracking-tight text-white ${className}`}
    >
      KROWN
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
        BRAIDS
      </span>
    </Link>
  );
}