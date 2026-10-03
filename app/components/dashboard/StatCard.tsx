// components/dashboard/StatCard.tsx
import Link from "next/link";

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "text-cyan-400",
  href,
}: {
  label: string;
  value: string;
  icon: any;
  color?: string;
  href?: string;
}) {
  const content = (
    <>
      <div className="p-2 rounded-lg bg-white/5 inline-flex mb-3">
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-[11px] text-white/40 mt-1 uppercase tracking-wide">
        {label}
      </p>
    </>
  );

  const baseClasses =
    "block backdrop-blur-2xl bg-white/5 rounded-xl p-4 border border-white/10 transition-all";

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} hover:border-white/20 hover:bg-white/[0.07]`}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}