"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import type { EmployeeInsightViewModel } from "@/types/employee-insights";
import { EmployeeInsightCard } from "./EmployeeInsightCard";

type Props = {
  insights: EmployeeInsightViewModel[];
  title?: string;
  autoPlay?: boolean;
  autoPlayIntervalMs?: number;
};

type Direction = 1 | -1;

function getWrappedIndex(index: number, total: number) {
  if (total === 0) return 0;
  return (index + total) % total;
}

export function EmployeeInsightsDeck({
  insights,
  title = "Contexto del empleado",
  autoPlay = true,
  autoPlayIntervalMs = 8500,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  const [index, setIndex] = React.useState(0);
  const [direction, setDirection] = React.useState<Direction>(1);

  const [isHoverPaused, setIsHoverPaused] = React.useState(false);
  const [isFocusPaused, setIsFocusPaused] = React.useState(false);
  const [isUserPaused, setIsUserPaused] = React.useState(false);

  React.useEffect(() => {
    setIndex(0);
    setDirection(1);
  }, [insights]);

  const canAutoPlay =
    autoPlay &&
    insights.length > 1 &&
    !prefersReducedMotion &&
    !isHoverPaused &&
    !isFocusPaused &&
    !isUserPaused;

  const goToIndex = React.useCallback(
    (nextIndex: number, nextDirection: Direction) => {
      setDirection(nextDirection);
      setIndex(getWrappedIndex(nextIndex, insights.length));
    },
    [insights.length],
  );

  const goPrev = React.useCallback(() => {
    goToIndex(index - 1, -1);
  }, [goToIndex, index]);

  const goNext = React.useCallback(() => {
    goToIndex(index + 1, 1);
  }, [goToIndex, index]);

  React.useEffect(() => {
    if (!canAutoPlay) return;

    const id = window.setTimeout(() => {
      goNext();
    }, autoPlayIntervalMs);

    return () => window.clearTimeout(id);
  }, [canAutoPlay, autoPlayIntervalMs, index, goNext]);

  if (!insights.length) return null;

  const current = insights[index];

  const slideVariants = prefersReducedMotion
    ? {
        enter: { opacity: 0 },
        center: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        enter: (dir: Direction) => ({
          opacity: 0,
          x: dir === 1 ? 48 : -48,
          scale: 0.99,
        }),
        center: {
          opacity: 1,
          x: 0,
          scale: 1,
        },
        exit: (dir: Direction) => ({
          opacity: 0,
          x: dir === 1 ? -36 : 36,
          scale: 0.99,
        }),
      };

  const slideTransition = prefersReducedMotion
    ? { duration: 0.12 }
    : {
        duration: 0.50,
        ease: [0.22, 1, 0.36, 1] as const,
      };

  return (
    <section className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:text-xs">
          {title}
        </div>

        {insights.length > 1 && (
          <button
            type="button"
            aria-label={isUserPaused ? "Reanudar rotación" : "Pausar rotación"}
            onClick={() => setIsUserPaused((prev) => !prev)}
            className="
              inline-flex h-7 w-7 items-center justify-center
              rounded-full text-slate-400
              transition-colors
              hover:bg-white/6 hover:text-slate-200
              dark:text-slate-500 dark:hover:text-slate-100
            "
          >
            {isUserPaused ? (
              <Play className="h-3.5 w-3.5" />
            ) : (
              <Pause className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Card area */}
      <div
        className="relative min-h-[clamp(230px,30vh,300px)] overflow-hidden"
        onMouseEnter={() => setIsHoverPaused(true)}
        onMouseLeave={() => setIsHoverPaused(false)}
        onFocusCapture={() => setIsFocusPaused(true)}
        onBlurCapture={() => setIsFocusPaused(false)}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`${current.code}-${index}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={slideTransition}
            className="absolute inset-0"
          >
            <EmployeeInsightCard insight={current} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      {insights.length > 1 && (
        <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-2">
          <button
            type="button"
            aria-label="Insight anterior"
            onClick={goPrev}
            className=" 
              inline-flex h-7 w-7 items-center justify-center
              rounded-full text-slate-400
              transition-colors
              hover:bg-white/6 hover:text-slate-200
              dark:text-slate-500 dark:hover:text-slate-100
            "
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="overflow-x-auto">
            <div className="flex min-w-max items-center justify-center gap-1.5 px-1">
              {insights.map((insight, dotIndex) => (
                <button
                  key={`${insight.code}-${dotIndex}`}
                  type="button"
                  aria-label={`Ir al insight ${dotIndex + 1}`}
                  onClick={() => {
                    if (dotIndex === index) return;
                    goToIndex(dotIndex, dotIndex > index ? 1 : -1);
                  }}
                  className={`h-2 w-2 rounded-full transition-all ${
                    dotIndex === index
                      ? "bg-primary scale-110"
                      : "bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Insight siguiente"
            onClick={goNext}
            className="
              inline-flex h-7 w-7 items-center justify-center
              rounded-full text-slate-400
              transition-colors
              hover:bg-white/6 hover:text-slate-200
              dark:text-slate-500 dark:hover:text-slate-100
            "
          >
            <ChevronRight className="h41 w-4" />
          </button>
        </div>
      )}

      {prefersReducedMotion && (
        <div className="text-[11px] text-muted-foreground">
          Animación reducida activada.
        </div>
      )}
    </section>
  );
}
``