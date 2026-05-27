"use client";

import { forwardRef, useEffect, useState } from "react";
import { formatISODateAsTR, parseTRDateToISO } from "@/lib/dates";

export const DateInputTR = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (iso: string) => void;
    className?: string;
    placeholder?: string;
  } & Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "value" | "onChange" | "type"
  >
>(function DateInputTR(
  {
    value,
    onChange,
    className = "input",
    placeholder = "GG/AA/YYYY",
    ...props
  },
  ref
) {
  const [display, setDisplay] = useState(() => formatISODateAsTR(value));

  useEffect(() => {
    setDisplay(formatISODateAsTR(value));
  }, [value]);

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={display}
      onChange={(e) => {
        const next = e.target.value;
        setDisplay(next);
        const iso = parseTRDateToISO(next);
        if (iso) onChange(iso);
      }}
      onBlur={() => {
        const iso = parseTRDateToISO(display);
        if (iso) {
          setDisplay(formatISODateAsTR(iso));
          onChange(iso);
          return;
        }
        setDisplay(formatISODateAsTR(value));
      }}
    />
  );
});
