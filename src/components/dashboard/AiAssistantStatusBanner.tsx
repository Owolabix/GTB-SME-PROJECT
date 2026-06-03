import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Bot, Loader2, RefreshCw } from "lucide-react";

type AiAssistantStatusBannerProps = {
  loading: boolean;
  showOffline: boolean;
  onRefresh: () => void;
};

export function AiAssistantStatusBanner({
  loading,
  showOffline,
  onRefresh,
}: AiAssistantStatusBannerProps) {
  if (!loading && !showOffline) return null;

  if (loading) {
    return (
      <Alert className="border-border">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription>Checking AI assistant…</AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive" className="border-destructive/50">
      <Bot className="h-4 w-4" />
      <AlertTitle>AI replies temporarily unavailable</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Your keyword automations still work. Messages that need a smart reply from the assistant
          may wait until the service is back — try again in a few minutes.
        </p>
        <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={onRefresh}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Check again
        </Button>
      </AlertDescription>
    </Alert>
  );
}
