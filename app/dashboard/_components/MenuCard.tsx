import Link from "next/link";

export interface MenuItem {
  icon: string;
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
  // Disabled / "coming soon" tiles (HR, Manajemen User, Aplikasi, ...)
  if (disabled || !href) {
    return (
      <div className="flex flex-col justify-between p-6 bg-macos-popover/40 border border-macos-separator border-dashed rounded-2xl opacity-60 select-none">
        <div className="w-10 h-10 rounded-xl bg-macos-tertiary border border-macos-separator flex items-center justify-center text-lg">
          {icon}
        </div>
        <div className="mt-8">
          <h4 className="text-md font-semibold text-macos-secondary tracking-tight">
            {title}
          </h4>
          {description && (
            <p className="text-xs text-macos-tertiary mt-1">{description}</p>
          )}
        </div>
      </div>
    );
  }

  // Active, clickable tiles
  return (
    <Link
      href={href}
      className="group flex flex-col justify-between p-6 bg-macos-popover border border-macos-separator rounded-2xl shadow-xl hover:shadow-2xl hover:border-macos-blue/50 active:scale-[0.98] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-macos-blue flex items-center justify-center text-white text-lg font-bold shadow-md shadow-macos-blue/20">
          {icon}
        </div>
        <span className="text-xs font-semibold text-macos-blue bg-macos-blue/10 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          Buka →
        </span>
      </div>
      <div>
        <h4 className="text-md font-bold text-macos-primary tracking-tight">
          {title}
        </h4>
        {description && (
          <p className="text-xs text-macos-secondary mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}
