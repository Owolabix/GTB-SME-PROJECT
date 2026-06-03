import { createFileRoute } from "@tanstack/react-router";
import { withApiCors } from "@/lib/apiCors";
import { deleteAccountForUser } from "@/integrations/account/deleteAccount.server";

export const Route = createFileRoute("/api/account/delete")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: withApiCors(request) }),

      POST: async ({ request }) => {
        const auth = request.headers.get("Authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token) {
          return Response.json(
            { ok: false, message: "Unauthorized" },
            { status: 401, headers: withApiCors(request) },
          );
        }

        let body: { confirmEmail?: string; password?: string };
        try {
          body = (await request.json()) as { confirmEmail?: string; password?: string };
        } catch {
          return Response.json(
            { ok: false, message: "Invalid JSON" },
            { status: 400, headers: withApiCors(request) },
          );
        }

        try {
          const result = await deleteAccountForUser({
            accessToken: token,
            confirmEmail: body.confirmEmail ?? "",
            password: body.password ?? "",
          });
          return Response.json(result, {
            status: result.ok ? 200 : (result.status ?? 400),
            headers: withApiCors(request),
          });
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
