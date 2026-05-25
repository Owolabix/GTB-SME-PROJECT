import { createFileRoute } from "@tanstack/react-router";
import {
  processInstagramWebhookPayload,
  verifyMetaWebhookSignature,
} from "@/integrations/instagram/webhook";

export const Route = createFileRoute("/api/public/webhooks/instagram")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
        if (!verifyToken) {
          return new Response("Webhook verify token is not configured", { status: 503 });
        }

        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === verifyToken && challenge) {
          return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
        }

        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const appSecret = process.env.META_APP_SECRET;
        if (!appSecret) {
          return new Response("Meta app secret is not configured", { status: 503 });
        }

        const rawBody = await request.text();
        const signature = request.headers.get("x-hub-signature-256");
        if (!verifyMetaWebhookSignature(rawBody, signature, appSecret)) {
          return new Response("Invalid signature", { status: 403 });
        }

        let payload: unknown;
        try {
          payload = JSON.parse(rawBody) as unknown;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        try {
          await processInstagramWebhookPayload(payload);
        } catch (e) {
          console.error("[instagram webhook]", e);
        }

        return new Response("EVENT_RECEIVED", { status: 200 });
      },
    },
  },
});
