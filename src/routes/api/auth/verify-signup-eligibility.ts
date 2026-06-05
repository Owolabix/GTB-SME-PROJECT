import { createFileRoute } from "@tanstack/react-router";
import { withApiCors } from "@/lib/apiCors";
import {
  gtcoSignupRequiresAccessCode,
  verifyGtcoSignupEligibility,
} from "@/integrations/auth/gtcoEligibility.server";

export const Route = createFileRoute("/api/auth/verify-signup-eligibility")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, { status: 204, headers: withApiCors(request) }),

      GET: async ({ request }) => {
        return Response.json(
          { requiresAccessCode: gtcoSignupRequiresAccessCode() },
          { headers: withApiCors(request) },
        );
      },

      POST: async ({ request }) => {
        let body: { email?: string; accessCode?: string; confirmedGtcoCustomer?: boolean };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json(
            { ok: false, message: "Invalid JSON" },
            { status: 400, headers: withApiCors(request) },
          );
        }

        const result = verifyGtcoSignupEligibility({
          email: body.email ?? "",
          accessCode: body.accessCode,
          confirmedGtcoCustomer: Boolean(body.confirmedGtcoCustomer),
        });

        return Response.json(result, {
          status: result.ok ? 200 : 403,
          headers: withApiCors(request),
        });
      },
    },
  },
});
