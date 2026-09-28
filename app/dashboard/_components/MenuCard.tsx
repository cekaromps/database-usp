"use client";
import Link from "next/link";
import { ReactNode, useState } from "react";

export interface MenuItem {
  icon: ReactNode; // was: IconType
  title: string;
  description?: string;
  href?: string;
  disabled?: boolean;
}

export function MenuCard({
  icon,
  title,
  description,
  href,
  disabled,
}: MenuItem) {
  const [hover, setHover] = useState(false);

  if (disabled || !href) {
    return (
      <div className="flex flex-col justify-between aspect-square w-full max-w-[140px] p-6 bg-macos-popover/40 border border-macos-separator border-dashed rounded-2xl opacity-60 select-none">
        <div className="w-10 h-10 rounded-xl bg-macos-tertiary border border-macos-separator flex items-center justify-center text-lg">
          {icon}
        </div>
        <div className="mt-8">
          <h4 className="text-md font-semibold text-macos-secondary tracking-tight">
            {title}
          </h4>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="flex flex-col items-center justify-center aspect-square w-full max-w-[140px] p-6 bg-macos-popover border border-macos-separator rounded-2xl hover:border-macos-blue/50 transition-all duration-200 cursor-pointer"
    >
      {hover ? (
        <span className="font-semibold text-sm text-macos-primary text-center px-2">
          {title}
        </span>
      ) : (
        icon
      )}
    </Link>
  );
}
