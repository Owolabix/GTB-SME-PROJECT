import { createFileRoute } from "@tanstack/react-router";
import { withApiCors } from "@/lib/apiCors";
import { loadAisleCatalogueForUser } from "@/integrations/aisle/storefrontCatalogue.server";

function bearerToken(request: Request): string {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : "";
}

export const Route = createFileRoute("/api/storefront/catalogue")({
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
          const catalogue = await loadAisleCatalogueForUser(token);
          return Response.json({ ok: true, catalogue }, { headers: withApiCors(request) });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          const status = message.includes("not configured") ? 503 : 500;
          return Response.json(
            { ok: false, message },
            { status, headers: withApiCors(request) },
          );
        }
      },
    },
  },
});
