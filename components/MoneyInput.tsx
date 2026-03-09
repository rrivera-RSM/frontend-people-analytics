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
  name?: string;
};

export function MoneyInput({
  value,
  onChange,
  onBlur,
  disabled,
  readOnly,
  placeholder,
  name,
}: MoneyInputProps) {
  const [raw, setRaw] = React.useState(() =>
    Number.isFinite(value) ? formatEURNumber(value) : ""
  );
  const [isFocused, setIsFocused] = React.useState(false);

  // sincroniza desde RHF SOLO cuando NO estás editando
  React.useEffect(() => {
    if (isFocused) return;
    setRaw(Number.isFinite(value) ? formatEURNumber(value) : "");
  }, [value, isFocused]);

  const commit = React.useCallback(() => {
    if (isEffectivelyEmpty(raw)) {
      // si tu schema NO permite vacío, aquí puedes decidir:
      // - forzar 0
      // - o dejarlo como el valor anterior
      // Por ahora: forzamos 0 para no romper z.number()
      onChange(0);
      setRaw(formatEURNumber(0));
      return;
    }

    const numeric = parseEUR(raw);
    onChange(numeric);
    setRaw(formatEURNumber(numeric));
  }, [raw, onChange]);

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