import { createFileRoute } from "@tanstack/react-router";
import {
  resolveCustomerHandlesForUser,
  resolveDmHandlesForUser,
} from "@/integrations/dm/resolveHandles.server";

export const Route = createFileRoute("/api/dm/resolve-handles")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("Authorization");
        const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!token) {
          return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
        }

        let payloads: unknown[] = [];
        let customerIds: string[] = [];
        try {
          const body = (await request.json()) as {
            payloads?: unknown[];
            customerIds?: string[];
          };
          payloads = Array.isArray(body.payloads) ? body.payloads : [];
          customerIds = Array.isArray(body.customerIds) ? body.customerIds : [];
        } catch {
          return Response.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
        }

        try {
          const [fromPayloads, fromCustomers] = await Promise.all([
            payloads.length > 0 ? resolveDmHandlesForUser(token, payloads) : Promise.resolve({}),
            customerIds.length > 0
              ? resolveCustomerHandlesForUser(token, customerIds)
              : Promise.resolve({}),
          ]);
          const handles = { ...fromPayloads, ...fromCustomers };
          return Response.json({ ok: true, handles });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          return Response.json({ ok: false, message }, { status: 500 });
        }
      },
    },
  },
});
