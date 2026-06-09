// components/MoneyInput.tsx
import * as React from "react";
import { Input } from "@/components/ui/input";

const eurNumberFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// si mantienes el "€" como prefijo visual, formatea SOLO número
export function formatEURNumber(value: number) {
  return eurNumberFormatter.format(value ?? 0);
}

export function parseEUR(input: string): number {
  const cleaned = (input ?? "")
    .replace(/[€\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function isEffectivelyEmpty(raw: string) {
  return (raw ?? "").replace(/[€\s]/g, "").length === 0;
}

type MoneyInputProps = {
  value: number;
  onChange: (value: number) => void; // RHF espera number aquí si tu schema es number
  onBlur?: () => void;               // 👈 para RHF touched/validation
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  showZeroAsEmpty?: boolean;
  name?: string;
};

export function MoneyInput({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  placeholder,
  showZeroAsEmpty = false,
  name,
}: MoneyInputProps) {
  const displayValue = React.useCallback(
    (nextValue: number) =>
      Number.isFinite(nextValue) && (!showZeroAsEmpty || nextValue !== 0)
        ? formatEURNumber(nextValue)
        : "",
    [showZeroAsEmpty],
  );

  const [raw, setRaw] = React.useState(() =>
    displayValue(value)
  );
  const [isFocused, setIsFocused] = React.useState(false);

  // sincroniza desde RHF SOLO cuando NO estás editando
  React.useEffect(() => {
    if (isFocused) return;
    setRaw(displayValue(value));
  }, [value, isFocused, displayValue]);

  const commit = React.useCallback(() => {
    if (isEffectivelyEmpty(raw)) {
      onChange(0);
      setRaw(displayValue(0));
      return;
    }

    const numeric = parseEUR(raw);
    onChange(numeric);
    setRaw(formatEURNumber(numeric));
  }, [raw, onChange, displayValue]);

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        €
      </span>

      <Input
        name={name}
        className="pl-8"
        value={raw}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        inputMode="decimal"
        onFocus={() => setIsFocused(true)}
        onChange={(e) => {
          setRaw(e.target.value); // 👈 solo display, NO onChange al form
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
            (e.currentTarget as HTMLInputElement).blur();
          }
        }}
        onBlur={() => {
          setIsFocused(false);
          commit();
          onBlur?.(); // 👈 importante para RHF
        }}
      />
    </div>
  );
}
