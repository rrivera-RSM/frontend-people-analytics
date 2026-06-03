"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import type { EmployeeInsightViewModel } from "@/types/employee-insights";
import { EmployeeInsightCard } from "./EmployeeInsightCard";

type Props = {
  insights: EmployeeInsightViewModel[];
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
};

function getWrappedIndex(index: number, total: number) {
  if (total === 0) return 0;
  return (index + total) % total;
}

function getCircularOffset(itemIndex: number, activeIndex: number, total: number) {
  const rawOffset = itemIndex - activeIndex;
  const half = total / 2;

  if (rawOffset > half) return rawOffset - total;
  if (rawOffset < -half) return rawOffset + total;
  return rawOffset;
}

function getFamilyLabel(insight: EmployeeInsightViewModel) {
  if (insight.family === "ona") return "ONA";
  if (insight.family === "performance") return "Desempeño";
  return "Talento";
}

export function DecisionInsightsCarousel({
  insights,
  autoPlay = true,
  autoPlayIntervalMs = 8500,
}: Props) {
  const prefersReducedMotion = useReducedMotion();
  const [index, setIndex] = React.useState(0);
  const [isHoverPaused, setIsHoverPaused] = React.useState(false);
  const [isUserPaused, setIsUserPaused] = React.useState(false);

  React.useEffect(() => {
    setIndex(0);
  }, [insights]);

  const canAutoPlay =
    autoPlay &&
    insights.length > 1 &&
    !prefersReducedMotion &&
    !isHoverPaused &&
    !isUserPaused;

  const goToIndex = React.useCallback(
    (nextIndex: number) => {
      setIndex(getWrappedIndex(nextIndex, insights.length));
    },
    [insights.length],
  );

  const goPrev = React.useCallback(() => {
    goToIndex(index - 1);
  }, [goToIndex, index]);

  const goNext = React.useCallback(() => {
    goToIndex(index + 1);
  }, [goToIndex, index]);

  React.useEffect(() => {
    if (!canAutoPlay) return;

    const id = window.setTimeout(goNext, autoPlayIntervalMs);
    return () => window.clearTimeout(id);
  }, [autoPlayIntervalMs, canAutoPlay, goNext, index]);

  if (!insights.length) {
    return (
      <section className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50/80 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-400">
        Sin insights disponibles
      </section>
    );
  }

  const activeInsight = insights[index];

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm dark:border-slate-700/90 dark:bg-slate-900/35">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-700/80">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
            Insights de decisión
          </div>
          <h3 className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-50">
            Señales relevantes para la propuesta
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-slate-200 bg-white/70 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
            {index + 1}/{insights.length}
          </span>
          {autoPlay && insights.length > 1 && (
            <button
              type="button"
              aria-label={isUserPaused ? "Reanudar rotación" : "Pausar rotación"}
              onClick={() => setIsUserPaused((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-200/75 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              {isUserPaused ? (
                <Play className="h-4 w-4" />
              ) : (
                <Pause className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
      </div>

      <div
        className="relative min-h-[460px] overflow-hidden px-4 py-8 [perspective:1200px]"
        onMouseEnter={() => setIsHoverPaused(true)}
        onMouseLeave={() => setIsHoverPaused(false)}
      >
        {insights.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Insight anterior"
              onClick={goPrev}
              className="absolute left-4 top-1/2 z-30 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-slate-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Insight siguiente"
              onClick={goNext}
              className="absolute right-4 top-1/2 z-30 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white/85 text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:text-slate-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <div className="absolute inset-x-0 top-4 text-center">
          <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
            {getFamilyLabel(activeInsight)}
          </span>
        </div>

        <div className="relative mx-auto h-[390px] max-w-[900px]">
          {insights.map((insight, itemIndex) => {
            const offset = getCircularOffset(itemIndex, index, insights.length);
            const isVisible = Math.abs(offset) <= 2;
            const isActive = offset === 0;

            if (!isVisible) return null;

            const absOffset = Math.abs(offset);
            const x = offset * 185;
            const zIndex = 20 - absOffset;
            const scale = isActive ? 1 : absOffset === 1 ? 0.88 : 0.76;
            const opacity = isActive ? 1 : absOffset === 1 ? 0.62 : 0.34;
            const rotateY = prefersReducedMotion ? 0 : offset * -12;
            const y = absOffset * 8;

            return (
              <motion.div
                key={`${insight.code}-${itemIndex}`}
                className={`absolute left-1/2 top-8 aspect-[10/7] w-[min(560px,78vw)] origin-center ${
                  isActive ? "" : "cursor-pointer"
                }`}
                style={{ zIndex }}
                initial={false}
                animate={{
                  x: `calc(-50% + ${x}px)`,
                  scale,
                  opacity,
                  rotateY,
                  y,
                }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0.12 }
                    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
                }
                aria-hidden={!isActive}
                onClick={() => {
                  if (isActive) return;
                  goToIndex(itemIndex);
                }}
              >
                <motion.div
                  className={
                    isActive
                      ? "h-full drop-shadow-[0_18px_34px_rgba(15,23,42,0.18)] dark:drop-shadow-[0_20px_44px_rgba(0,0,0,0.45)]"
                      : "pointer-events-none h-full blur-[0.2px]"
                  }
                  animate={
                    isActive && !prefersReducedMotion && !isHoverPaused
                      ? { y: [0, -6, 0] }
                      : { y: 0 }
                  }
                  transition={
                    isActive && !prefersReducedMotion && !isHoverPaused
                      ? {
                          duration: 4.6,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }
                      : { duration: 0.2 }
                  }
                >
                  <EmployeeInsightCard
                    insight={insight}
                    compact={!isActive}
                    maxVisibleEvidence={isActive ? 2 : 1}
                    className="h-full overflow-hidden"
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {insights.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 border-t border-slate-200 px-5 py-4 dark:border-slate-700/80">
          {insights.map((insight, dotIndex) => (
            <button
              key={`${insight.code}-dot-${dotIndex}`}
              type="button"
              aria-label={`Ir al insight ${dotIndex + 1}`}
              onClick={() => goToIndex(dotIndex)}
              className={`h-2 rounded-full transition-all ${
                dotIndex === index
                  ? "w-7 bg-cyan-500"
                  : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
