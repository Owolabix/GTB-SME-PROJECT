import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { instagramMessageUrl } from "@/lib/instagramLinks";

export function OpenInInstagramButton({
  username,
  className,
}: {
  username: string | null | undefined;
  className?: string;
}) {
  const url = instagramMessageUrl(username);
  if (!url) return null;

  return (
    <Button asChild size="sm" variant="outline" className={className}>
      <a href={url} target="_blank" rel="noopener noreferrer">
        <Instagram className="mr-1 h-4 w-4" />
        Open in Instagram
      </a>
    </Button>
  );
}
