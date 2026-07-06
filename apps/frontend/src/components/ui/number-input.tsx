import * as React from "react";
import { Input } from "@/components/ui/input";

const THOUSANDS_LOCALE = "es-CO";

function formatThousands(value: number): string {
  return new Intl.NumberFormat(THOUSANDS_LOCALE).format(value);
}

function countDigits(text: string): number {
  return text.replace(/\D/g, "").length;
}

type NumberInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange"> & {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
};

export function NumberInput({ value, onChange, ...props }: NumberInputProps) {
  const [text, setText] = React.useState(() => (value === undefined ? "" : formatThousands(value)));

  React.useEffect(() => {
    setText(value === undefined ? "" : formatThousands(value));
  }, [value]);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const caret = input.selectionStart ?? input.value.length;
    const digitsBeforeCaret = countDigits(input.value.slice(0, caret));

    const digits = input.value.replace(/\D/g, "");
    const numericValue = digits ? Number(digits) : undefined;
    const formatted = numericValue !== undefined ? formatThousands(numericValue) : "";

    let caretPos = formatted.length;
    if (digitsBeforeCaret === 0) {
      caretPos = 0;
    } else {
      let seen = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (/\d/.test(formatted[i])) {
          seen++;
          if (seen === digitsBeforeCaret) {
            caretPos = i + 1;
            break;
          }
        }
      }
    }

    input.value = formatted;
    input.setSelectionRange(caretPos, caretPos);

    setText(formatted);
    onChange(numericValue);
  }

  return <Input type="text" inputMode="numeric" value={text} onChange={handleChange} {...props} />;
}
