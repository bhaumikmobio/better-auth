"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type FormValues = {
  yesterday: string;
  today: string;
  blockers: string;
  mood: string;
};

const STEPS = [
  {
    key: "yesterday",
    title: "Yesterday",
    placeholder: "Share what you completed yesterday...",
  },
  {
    key: "today",
    title: "Today",
    placeholder: "What are you planning to deliver today?",
  },
  {
    key: "blockers",
    title: "Blockers",
    placeholder: "Any blockers? If none, write 'None'.",
  },
] as const;

type StandupFormCardProps = {
  dailyPrompt: string;
  isSubmitting: boolean;
  onSubmit: (values: FormValues) => Promise<void>;
};

export function StandupFormCard({ dailyPrompt, isSubmitting, onSubmit }: StandupFormCardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<FormValues>({
    yesterday: "",
    today: "",
    blockers: "",
    mood: "",
  });

  const currentStep = STEPS[stepIndex];
  const isFinalStep = stepIndex === STEPS.length - 1;
  const currentValue = values[currentStep.key];
  const canContinue = currentValue.trim().length > 0;

  const progressPercent = useMemo(() => {
    return Math.round(((stepIndex + 1) / STEPS.length) * 100);
  }, [stepIndex]);

  return (
    <article className="rounded-3xl border border-slate-300/60 bg-white/70 p-5 shadow-[0_25px_50px_-34px_rgba(30,41,59,0.75)] backdrop-blur-xl sm:p-6">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">
          Daily Prompt
        </p>
        <p className="rounded-xl border border-slate-200/80 bg-slate-50/85 px-3 py-2 text-sm text-slate-700">
          {dailyPrompt}
        </p>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STEPS.map((step, index) => (
            <span
              key={step.key}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                index <= stepIndex ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-500"
              }`}
            >
              {step.title}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep.key}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="space-y-3"
          >
            <label className="block text-sm font-semibold text-slate-800">{currentStep.title}</label>
            <textarea
              value={values[currentStep.key]}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  [currentStep.key]: event.target.value,
                }))
              }
              rows={5}
              className="w-full rounded-2xl border border-slate-300/75 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              placeholder={currentStep.placeholder}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {isFinalStep ? (
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Mood (optional)
          </label>
          <input
            type="text"
            value={values.mood}
            onChange={(event) =>
              setValues((prev) => ({
                ...prev,
                mood: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300/75 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
            placeholder="Calm, focused, energized..."
          />
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
        <Button
          variant="secondary"
          onClick={() => setStepIndex((prev) => Math.max(0, prev - 1))}
          disabled={stepIndex === 0 || isSubmitting}
        >
          Back
        </Button>

        {isFinalStep ? (
          <Button
            onClick={() => void onSubmit(values)}
            disabled={
              isSubmitting ||
              values.yesterday.trim().length === 0 ||
              values.today.trim().length === 0 ||
              values.blockers.trim().length === 0
            }
            isLoading={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit stand-up"}
          </Button>
        ) : (
          <Button onClick={() => setStepIndex((prev) => prev + 1)} disabled={!canContinue || isSubmitting}>
            Continue
          </Button>
        )}
      </div>
    </article>
  );
}
