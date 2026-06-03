import { createFileRoute } from "@tanstack/react-router";
import { withApiCors } from "@/lib/apiCors";
import {
  loadOwnerFollowUpsForUser,
  markOwnerFollowUpDoneForUser,
} from "@/integrations/dm/ownerFollowUps.server";

function bearerToken(request: Request): string {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

export const Route = createFileRoute("/api/owner-follow-ups")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: withApiCors(request) }),

      GET: async ({ request }) => {
        const token = bearerToken(request);
        if (!token) {
          return Response.json(
            { ok: false, message: "Unauthorized" },
            { status: 401, headers: withApiCors(request) },
          );
        }

        try {
          const followUps = await loadOwnerFollowUpsForUser(token, { openOnly: true });
          return Response.json(
            { ok: true, followUps },
            { headers: withApiCors(request) },
          );
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return Response.json(
            { ok: false, message },
            { status: 500, headers: withApiCors(request) },
          );
        }
      },

      POST: async ({ request }) => {
        const token = bearerToken(request);
        if (!token) {
          return Response.json(
            { ok: false, message: "Unauthorized" },
            { status: 401, headers: withApiCors(request) },
          );
        }

        let id = "";
        try {
          const body = (await request.json()) as { id?: string };
          id = typeof body.id === "string" ? body.id.trim() : "";
        } catch {
          return Response.json(
            { ok: false, message: "Invalid JSON" },
            { status: 400, headers: withApiCors(request) },
          );
        }

        if (!id) {
          return Response.json(
            { ok: false, message: "Missing follow-up id" },
            { status: 400, headers: withApiCors(request) },
          );
        }

        try {
          await markOwnerFollowUpDoneForUser(token, id);
          return Response.json({ ok: true }, { headers: withApiCors(request) });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return Response.json(
            { ok: false, message },
            { status: 500, headers: withApiCors(request) },
          );
        }
      },
    },
  },
});
