import Link from "next/link";
import { ReactNode } from "react";

export interface MenuItem {
  icon: ReactNode;
  title: string;
  description?: string;
  href?: string;
  disabled?: boolean;
}

export function MenuCard({ icon, title, href, disabled }: MenuItem) {
  if (disabled || !href) {
    return (
      <div className="flex flex-col justify-between aspect-square w-full max-w-[140px] p-6 bg-macos-popover/40 border border-macos-separator border-dashed rounded-2xl opacity-60 select-none">
        <div className="w-10 h-10 rounded-xl bg-macos-tertiary border border-macos-separator flex items-center justify-center text-lg">
          {icon}
        </div>
        <h4 className="mt-8 text-md font-semibold text-macos-secondary tracking-tight">
          {title}
        </h4>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group relative block aspect-square w-full max-w-[140px] overflow-hidden
                 bg-macos-popover/75 hover:bg-macos-popover border border-macos-separator rounded-2xl cursor-pointer
                 transition-all duration-300 ease-out
                 hover:border-macos-blue/50 hover:shadow-[0_0_0_1px_var(--color-macos-blue)]
                 focus-visible:border-macos-blue/50 active:scale-95"
    >
      {/* Icon layer: shrinks, floats up and fades out */}
      <span
        className="absolute inset-0 flex items-center justify-center text-3xl
                   transition-all duration-300 ease-out
                   group-hover:-translate-y-3 group-hover:scale-75 group-hover:opacity-0
                   group-focus-visible:-translate-y-3 group-focus-visible:scale-75 group-focus-visible:opacity-0"
      >
        {icon}
      </span>

      {/* Title layer: slides up from below and fades in */}
      <span
        className="absolute inset-0 flex items-center justify-center px-3 text-center
                   font-semibold text-sm text-macos-primary
                   translate-y-3 opacity-0 text-2xl
                   transition-all duration-300 ease-out
                   group-hover:translate-y-0 group-hover:opacity-100
                   group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
      >
        {title}
      </span>
    </Link>
  );
}
