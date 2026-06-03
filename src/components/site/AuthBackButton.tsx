import { useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Go to previous page in history, or home when opened directly. */
export function AuthBackButton() {
  const router = useRouter();

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
      return;
    }
    void router.navigate({ to: "/" });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className="-ml-2 mb-4 gap-1.5 text-muted-foreground hover:text-foreground"
      aria-label="Go back"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </Button>
  );
}
