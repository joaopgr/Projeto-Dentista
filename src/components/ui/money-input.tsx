"use client";

import { formatMoneyInput } from "@/lib/utils";
import { Input } from "@/components/ui/form";

type MoneyInputProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  error?: string;
};

export function MoneyInput({
  label,
  value,
  onChange,
  required,
  error,
}: MoneyInputProps) {
  return (
    <Input
      label={label}
      required={required}
      value={value}
      onChange={(e) => onChange(formatMoneyInput(e.target.value))}
      placeholder="R$ 0,00"
      inputMode="numeric"
      error={error}
    />
  );
}
