import { createFileRoute } from "@tanstack/react-router";
import { pickUpSkippedDmForUser } from "@/integrations/dm/pickUpDm.server";

export const Route = createFileRoute("/api/dm/pick-up")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("Authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token) {
          return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
        }

        let eventId: string;
        try {
          const body = (await request.json()) as { eventId?: string };
          eventId = body.eventId ?? "";
        } catch {
          return Response.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
        }

        if (!eventId) {
          return Response.json({ ok: false, message: "eventId is required" }, { status: 400 });
        }

        try {
          const result = await pickUpSkippedDmForUser(token, eventId);
          return Response.json(result, { status: result.ok ? 200 : 400 });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, message }, { status: 500 });
        }
      },
    },
  },
});
