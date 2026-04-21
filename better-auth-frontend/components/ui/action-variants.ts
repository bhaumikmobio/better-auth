/**
 * Reusable surface + text classes for actions (buttons, icon controls, dialog footers).
 * Kept in one place so confirm modals, toolbars, and tables stay visually consistent.
 */
export const actionButton = {
  /** Cancel / low-emphasis: high-contrast text on white. */
  outline:
    "border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50 focus-visible:ring-slate-400/60",
  /** Destructive: solid fill, white label (WCAG-friendly on the fill). */
  danger:
    "border border-rose-800 bg-rose-600 text-white shadow-[0_10px_28px_-16px_rgba(190,18,60,0.5)] hover:border-rose-900 hover:bg-rose-700 focus-visible:ring-rose-500 disabled:text-white",
} as const;

export const actionIconButton = {
  /** Edit / positive icon-only table action. */
  default:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-transparent text-emerald-600 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40",
  /** Delete / danger icon-only table action. */
  danger:
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-transparent text-rose-600 transition-colors hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40",
} as const;
