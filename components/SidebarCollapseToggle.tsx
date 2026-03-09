"use client";

type Props = {
  collapsed: boolean;
  onToggle: () => void;
  controlsId?: string;
};

export function SidebarCollapseToggle({
  collapsed,
  onToggle,
  controlsId = "employees-sidebar",
}: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
      aria-expanded={!collapsed}
      aria-controls={controlsId}
      className={[
        "absolute -right-3 top-[90%] -translate-y-1/2 z-20",
        "h-8 w-8 rounded-full border",
        "backdrop-blur",
        "border-zinc-200 text-zinc-500 shadow-sm",
        "hover:bg-zinc-100 hover:text-zinc-700",
        "dark:bg-zinc-950/60 dark:border-zinc-800 dark:text-zinc-400",
        "dark:hover:bg-zinc-900 dark:hover:text-zinc-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        "dark:focus-visible:ring-offset-zinc-950",
      ].join(" ")}
    >
      <span className="sr-only">{collapsed ? "Expandir" : "Colapsar"}</span>
      <svg
        className={[
          "mx-auto h-4 w-4 transition-transform",
         
        ].join(" ")}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
      >
        
<path
    d="M9 5l7 7-7 7"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={2}
    className={`transition-transform duration-300 origin-center [transform-box:fill-box] ${
      collapsed ? "rotate-0" : "rotate-180"
    }`}
  />

      </svg>
    </button>
  );
}