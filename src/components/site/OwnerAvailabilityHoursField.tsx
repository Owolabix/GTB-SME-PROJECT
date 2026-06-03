import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  OWNER_AVAILABILITY_HOURS_HINT,
  OWNER_AVAILABILITY_HOURS_LABEL,
} from "@/lib/westAfricaCurrencies";

type OwnerAvailabilityHoursFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  /** Shorter label for narrow layouts (e.g. settings two-column). */
  compactLabel?: boolean;
};

const OWNER_AVAILABILITY_HOURS_LABEL_SHORT = "Escalation availability";

export function OwnerAvailabilityHoursField({
  id,
  value,
  onChange,
  disabled,
  required,
  compactLabel,
}: OwnerAvailabilityHoursFieldProps) {
  const label = compactLabel ? OWNER_AVAILABILITY_HOURS_LABEL_SHORT : OWNER_AVAILABILITY_HOURS_LABEL;

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="block text-sm font-medium leading-normal">
        {label}
        {required ? <span className="text-destructive">{"\u00a0*"}</span> : null}
      </Label>
      <Input
        id={id}
        required={required}
        disabled={disabled}
        placeholder="e.g. Mon–Sat 9am–6pm WAT"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        maxLength={100}
      />
      <p className="text-xs text-muted-foreground">{OWNER_AVAILABILITY_HOURS_HINT}</p>
    </div>
  );
}
