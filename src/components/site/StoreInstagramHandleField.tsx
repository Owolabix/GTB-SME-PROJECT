import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StoreInstagramHandleFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  connectedHandle: string | null;
  required?: boolean;
  /** When false, field is read-only (settings view mode). */
  editable?: boolean;
};

export function StoreInstagramHandleField({
  id,
  value,
  onChange,
  connectedHandle,
  required,
  editable = true,
}: StoreInstagramHandleFieldProps) {
  const synced = Boolean(connectedHandle);
  const displayValue = synced ? connectedHandle! : value;
  const locked = !editable || synced;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>
        Instagram handle{" "}
        {required && !synced && editable && <span className="text-destructive">*</span>}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          @
        </span>
        <Input
          id={id}
          className="pl-7"
          required={required && !synced && editable}
          readOnly={locked}
          disabled={locked}
          placeholder="your_store"
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          maxLength={100}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {synced
          ? "Synced from your connected Instagram account under Integrations."
          : "Connect Instagram under Integrations to sync this automatically, or enter your handle manually."}
      </p>
    </div>
  );
}
