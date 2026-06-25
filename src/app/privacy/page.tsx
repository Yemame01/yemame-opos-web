import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Yemame OPOS",
  description:
    "How Yemame handles the limited information used for your OPOS account, purchases, and license activation.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="23 June 2026">
      <p>
        This Privacy Policy explains what information YEMAME ENTERPRISE SOLUTIONS
        GROUP (&ldquo;Yemame&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) processes
        in connection with <strong>Yemame OPOS</strong> — the account you create
        on this website, your purchases, and license activation. We are the data
        controller for that information. Yemame OPOS is an{" "}
        <strong>offline</strong> application: your business data (sales, products,
        customers, etc.) stays on your own device and is never sent to us.
      </p>

      <LegalSection heading="What we collect">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Account:</strong> your name and email address when you sign up
            to buy and manage licenses.
          </li>
          <li>
            <strong>Purchases:</strong> payment references and amounts (processed by
            our payment provider — we do not store your card details).
          </li>
          <li>
            <strong>Licenses &amp; activation:</strong> your license keys, the email
            used to buy them, and a privacy-preserving device fingerprint (a hash —
            not your raw hardware ID) plus the app version and platform at
            activation, used to enforce activation limits and provide support.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="What stays on your device (and never reaches us)">
        <p>
          All POS data — products, inventory, sales, receipts, customers, staff
          PINs, and reports — is stored locally in Yemame OPOS and is{" "}
          <strong>not</strong> transmitted to Yemame. Backups you create are saved
          wherever you choose. Keep them safe; we cannot recover local data for you.
        </p>
      </LegalSection>

      <LegalSection heading="How we use information">
        <p>
          We use the limited information above to operate your account, process
          purchases, issue and verify licenses, prevent fraud and abuse, and provide
          support. We do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection heading="Service providers">
        <p>
          We use trusted third-party providers to run the service — including
          secure cloud infrastructure providers (for account hosting,
          authentication, and storage) and a PCI-DSS compliant payment processor.
          These providers act on our behalf under contractual confidentiality and
          data-protection obligations, and process data only to provide their
          services to us. We do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection heading="Retention & your rights">
        <p>
          We keep account, purchase, and license records as long as needed to
          provide the service and meet legal/accounting obligations. You may request
          access to or deletion of your account information by contacting us — note
          that deleting account/license records may disable activation of your
          purchased licenses.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes to
          the service or applicable law. The &ldquo;Last updated&rdquo; date above
          shows when it last changed. Your continued use of Yemame OPOS after an
          update takes effect constitutes acceptance of the revised policy.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          For privacy questions, email{" "}
          <a href="mailto:support@yemame.com" className="text-teal-600">
            support@yemame.com
          </a>{" "}
          or reach us on WhatsApp at{" "}
          <a href="https://wa.me/233559760063" className="text-teal-600">
            +233 55 976 0063
          </a>
          .
        </p>
        <p className="mt-3 text-sm text-ink/50">
          Yemame OPOS is operated by YEMAME ENTERPRISE SOLUTIONS GROUP, Accra, Ghana.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
