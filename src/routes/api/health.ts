import { createFileRoute } from "@tanstack/react-router";
import { withApiCors } from "@/lib/apiCors";
import { getLynkSystemStatus } from "@/lib/lynkStatus";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: withApiCors(request) }),

      GET: async ({ request }) => {
        const status = await getLynkSystemStatus();
        return Response.json(status, {
          status: status.ready ? 200 : 503,
          headers: {
            "Cache-Control": "no-store",
            ...withApiCors(request),
          },
        });
      },
    },
  },
});
