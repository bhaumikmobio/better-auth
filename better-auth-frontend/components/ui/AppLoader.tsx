import { LOADER_COPY } from "@/constants/messages";

type AppLoaderProps = {
  message?: string;
  compact?: boolean;
};

export function AppLoader({ message = LOADER_COPY.default, compact = false }: AppLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "min-h-[180px] px-4 py-6" : "min-h-screen px-6"
      }`}
    >
      <div className="rounded-2xl border border-sky-100/90 bg-white/85 p-5 shadow-[0_24px_48px_-34px_rgba(14,116,144,0.9)] backdrop-blur-sm">
        <div className="animate-[lock-loader-pulse_1.2s_ease-in-out_infinite] text-sky-700">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500">{message}</p>
    </div>
  );
}
