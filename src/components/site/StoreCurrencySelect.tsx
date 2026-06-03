import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WEST_AFRICA_CURRENCIES } from "@/lib/westAfricaCurrencies";

type StoreCurrencySelectProps = {
  id: string;
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
  required?: boolean;
};

export function StoreCurrencySelect({
  id,
  value,
  onChange,
  disabled,
  required,
}: StoreCurrencySelectProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onChange}
      disabled={disabled}
      required={required}
    >
      <SelectTrigger id={id} aria-required={required}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {WEST_AFRICA_CURRENCIES.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            {c.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
