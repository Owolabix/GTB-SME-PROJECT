import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Lynk Assistant" },
      {
        name: "description",
        content:
          "How Lynk Assistant collects, uses, and protects your data. Your rights under NDPR and GDPR, including account deletion.",
      },
    ],
  }),
  component: PrivacyPage,
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

function PrivacyPage() {
  const effectiveDate = "29 May 2026";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <header className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Legal</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">Effective date: {effectiveDate}</p>
        </header>

        <div className="space-y-10">
          <Section title="Who we are">
            <p>
              Lynk Assistant (&quot;Lynk&quot;, &quot;we&quot;, &quot;us&quot;) is an Instagram DM automation
              product for GTCO SME merchants. It helps you reply to comments and direct messages using
              keyword automations and an AI assistant. This policy describes how we handle personal data
              when you use the Lynk web application and related services.
            </p>
          </Section>

          <Section title="Data we collect">
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-foreground">Account data</strong> — email address,
                password (stored hashed by our auth provider), and optional display name.
              </li>
              <li>
                <strong className="font-medium text-foreground">Store profile</strong> — store name,
                address, currency, availability hours, FAQs, and optional notes you provide for the AI
                assistant.
              </li>
              <li>
                <strong className="font-medium text-foreground">Instagram connection</strong> — account
                identifiers and access tokens required to read and send messages on your behalf via Meta&apos;s
                APIs.
              </li>
              <li>
                <strong className="font-medium text-foreground">Automation &amp; activity data</strong> —
                keywords, reply templates, DM/comment event metadata, delivery status, and AI session
                context needed to operate the service.
              </li>
              <li>
                <strong className="font-medium text-foreground">Technical data</strong> — logs, device/browser
                type, and IP address where needed for security and reliability.
              </li>
            </ul>
          </Section>

          <Section title="How we use your data">
            <p>We use personal data to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Provide, secure, and improve Lynk Assistant</li>
              <li>Connect and operate your Instagram automations and AI replies</li>
              <li>Sync product catalogue context from AISLE where configured</li>
              <li>Support you and comply with legal obligations</li>
            </ul>
            <p>
              We do not sell your personal data. Processing is based on performing our contract with you,
              legitimate interests in running a secure service, and — where applicable — your consent
              (for example when connecting Instagram).
            </p>
          </Section>

          <Section title="Sharing &amp; processors">
            <p>We share data only as needed to operate Lynk:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-foreground">Supabase</strong> — authentication and
                database hosting
              </li>
              <li>
                <strong className="font-medium text-foreground">Meta / Instagram</strong> — messaging and
                account connection
              </li>
              <li>
                <strong className="font-medium text-foreground">AISLE</strong> — product catalogue when
                linked to your storefront
              </li>
              <li>
                <strong className="font-medium text-foreground">AI provider</strong> — unmatched DM replies
                via our CX-Assistant service (merchant context you configure; not used to train public
                models for unrelated purposes)
              </li>
            </ul>
            <p>
              Messages already delivered on Instagram remain subject to Meta&apos;s privacy policies.
            </p>
          </Section>

          <Section title="Retention">
            <p>
              We keep your data while your account is active. When you delete your account in Settings
              (under your Lynk dashboard), we erase your profile, store data, automations, Instagram
              tokens, and related activity from Lynk systems without undue delay.
            </p>
            <p>
              We may retain a <strong className="font-medium text-foreground">minimal deletion audit record</strong>{" "}
              containing only the date and time of erasure — no email, name, or user identifier — to demonstrate
              that deletion was performed. Backups, if any, are purged on our normal rotation schedule.
            </p>
          </Section>

          <Section title="Your rights (NDPR &amp; GDPR)">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>Access, correct, or delete your personal data</li>
              <li>Restrict or object to certain processing</li>
              <li>Data portability where applicable</li>
              <li>Withdraw consent where processing is consent-based</li>
              <li>Lodge a complaint with your data protection authority</li>
            </ul>
            <p>
              The fastest way to delete your data is self-service account deletion in Settings. For other
              requests, contact your GTCO SME relationship manager or Lynk support channel provided with
              your deployment.
            </p>
          </Section>

          <Section title="Security">
            <p>
              We use industry-standard measures including encrypted transport (HTTPS), authenticated access,
              row-level security on merchant data, and server-side secrets for integrations. No method of
              transmission or storage is 100% secure; we work to protect your data proportionate to the risk.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              We may update this policy from time to time. We will post the revised version on this page and
              update the effective date. Continued use after changes constitutes acceptance where permitted by
              law.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              Questions about this policy or your data? Reach out through your GTCO SME support contact or
              the Lynk administrator for your organisation.
            </p>
          </Section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
