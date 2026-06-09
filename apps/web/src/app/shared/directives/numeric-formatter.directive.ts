import { Directive, ElementRef, HostListener, Provider, forwardRef, inject } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export const NUMERIC_FORMATTER_VALUE_ACCESSOR: Provider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => NumericFormatterDirective),
  multi: true,
};

@Directive({
  selector: '[appNumericFormatter]',
  standalone: true,
  providers: [NUMERIC_FORMATTER_VALUE_ACCESSOR],
  host: {
    'type': 'text',
    'inputmode': 'decimal',
  },
})
export class NumericFormatterDirective implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLInputElement>);
  private previousValue = '';

  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const inputEl = this.el.nativeElement;
    const rawValue = inputEl.value;
    const selectionStart = inputEl.selectionStart;

    const inputEvent = event as InputEvent;
    const isDeletion = (inputEvent.inputType && inputEvent.inputType.startsWith('delete'))
      || (inputEvent.inputType === undefined && rawValue.length < this.previousValue.length);

    // 1. Format the value
    const formattedValue = this.formatNumberWithDots(rawValue, isDeletion);

    // 2. Set formatted value on input
    inputEl.value = formattedValue;
    this.previousValue = formattedValue;

    // 3. Restore cursor position
    if (selectionStart !== null) {
      let contentCharCount = 0;
      for (let i = 0; i < selectionStart; i++) {
        const char = rawValue[i];
        if (/\d/.test(char) || char === ',') {
          contentCharCount++;
        }
      }

      let formattedIndex = 0;
      let currentContentCount = 0;
      while (formattedIndex < formattedValue.length && currentContentCount < contentCharCount) {
        const char = formattedValue[formattedIndex];
        if (/\d/.test(char) || char === ',') {
          currentContentCount++;
        }
        formattedIndex++;
      }

      inputEl.setSelectionRange(formattedIndex, formattedIndex);
    }

    // 4. Parse the formatted value to number and call onChange
    const parsedNumber = this.parseFormattedNumber(formattedValue);
    this.onChange(parsedNumber);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: number | string | null | undefined): void {
    const parsedCurrent = this.parseFormattedNumber(this.el.nativeElement.value);
    if (value === parsedCurrent && this.el.nativeElement.value !== '') {
      return;
    }
    const formatted = this.formatNumberWithDots(value);
    this.el.nativeElement.value = formatted;
    this.previousValue = formatted;
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }

  private formatNumberWithDots(val: number | string | null | undefined, isDeletion = false): string {
    if (val === null || val === undefined || val === '') return '';

    let str = '';
    if (typeof val === 'number') {
      str = val.toString().replace(/\./g, ',');
    } else {
      str = val;
    }

    // Convert trailing dot to comma
    if (str.endsWith('.')) {
      str = str.slice(0, -1) + ',';
    }

    // If there is a dot followed by 1 or 2 digits at the end and no comma, treat it as decimal
    // only if it's not a deletion event.
    if (!isDeletion) {
      const lastDotIndex = str.lastIndexOf('.');
      const commaIndex = str.indexOf(',');
      if (commaIndex === -1 && lastDotIndex !== -1) {
        const afterDot = str.substring(lastDotIndex + 1);
        if (/^\d{1,2}$/.test(afterDot)) {
          str = str.substring(0, lastDotIndex) + ',' + afterDot;
        }
      }
    }

    const parts = str.split(',');
    let integerPart = parts[0].replace(/\./g, '').replace(/\D/g, '');
    let decimalPart = parts.length > 1 ? parts[1].replace(/\D/g, '').substring(0, 2) : '';

    if (integerPart.length > 1 && integerPart.startsWith('0')) {
      integerPart = integerPart.replace(/^0+/, '');
      if (integerPart === '') {
        integerPart = '0';
      }
    }

    if (integerPart === '' && parts.length > 1) {
      integerPart = '0';
    }

    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    if (parts.length > 1) {
      return `${integerPart},${decimalPart}`;
    }
    return integerPart;
  }

  private parseFormattedNumber(val: string): number | null {
    if (!val) return null;
    let clean = val.replace(/\./g, '');
    clean = clean.replace(/,/g, '.');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? null : parsed;
  }
}
