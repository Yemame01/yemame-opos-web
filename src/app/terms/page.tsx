import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Yemame OPOS",
  description:
    "The terms governing your use of Yemame OPOS and its activation licenses, including how to buy keys safely.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="23 June 2026">
      <p>
        These Terms of Service (&quot;Terms&quot;) govern your purchase and use of
        <strong> Yemame OPOS</strong> (&quot;the Software&quot;), the offline
        desktop point-of-sale application, and the activation licenses
        (&quot;Licenses&quot;) sold through this website. They form a legally
        binding agreement between you and YEMAME ENTERPRISE SOLUTIONS GROUP, the
        operator of Yemame OPOS (&quot;Yemame&quot;, &quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;). By creating an account, buying a
        License, or activating the Software, you confirm you are at least 18 years
        old and agree to these Terms. If you do not agree, do not use the Software.
      </p>

      <LegalSection heading="1. Buy activation keys ONLY from Yemame (important)">
        <p>
          Activation keys for Yemame OPOS are sold <strong>exclusively</strong> by
          Yemame, through this website (<em>opos.yemame.com</em>) or a channel we
          operate directly. We do <strong>not</strong> authorise any reseller,
          agent, marketplace, social-media seller, or other third party to sell,
          resell, sub-license, or distribute keys on our behalf.
        </p>
        <p>
          <strong>
            A key bought from anyone other than Yemame is not valid and will not
            activate the Software.
          </strong>{" "}
          Keys are bound to the email used to purchase them and are verified by our
          servers at activation. We cannot support, replace, refund, or honour any
          key obtained from a third party, and doing so is at your own risk —
          including the risk of fraud, malware, or loss of money.
        </p>
        <p>
          Reselling, sharing, sub-licensing, or transferring a key outside the
          mechanisms we provide is prohibited and may result in the affected
          License(s) being revoked without refund.
        </p>
      </LegalSection>

      <LegalSection heading="2. What a License grants">
        <p>
          Each License grants a limited, non-exclusive, non-transferable right to
          install and run the Software for a fixed number of{" "}
          <strong>activations</strong> (as stated on the package you buy). One
          activation is consumed each time the Software is activated on a device.
          Reinstalling on the <em>same</em> device does not normally consume an
          additional activation; a new device does.
        </p>
        <p>
          Licenses are sold per the package purchased and do not expire. Yemame may
          offer free updates at its discretion but does not guarantee them.
        </p>
      </LegalSection>

      <LegalSection heading="3. Activation & verification">
        <p>
          Activation requires a one-time online verification using the email you
          purchased with and your key. After activation, the Software runs offline.
          You are responsible for keeping your key and account credentials secure.
          Yemame is not liable for losses arising from a key you disclosed or that
          was obtained through a compromised account.
        </p>
      </LegalSection>

      <LegalSection heading="4. Payments & refunds">
        <p>
          Prices are shown at checkout and processed by our payment provider. All
          sales are final once a key has been issued and/or activated, except where
          required by law or expressly agreed by Yemame in writing. Chargebacks or
          payment reversals may result in the associated License(s) being revoked.
        </p>
      </LegalSection>

      <LegalSection heading="5. Acceptable use">
        <p>
          You agree not to reverse-engineer, tamper with, circumvent, or attempt to
          bypass the Software&apos;s licensing, activation, or security; not to use
          the Software unlawfully; and not to misrepresent your affiliation with
          Yemame. Violation may result in revocation of your License(s) without
          refund.
        </p>
      </LegalSection>

      <LegalSection heading="6. Your data">
        <p>
          Yemame OPOS stores your business data locally on your device. You are
          responsible for backing up your data using the in-app backup tools. See
          our <Link href="/privacy" className="text-teal-600">Privacy Policy</Link>{" "}
          for what limited information we process for accounts, purchases, and
          activation.
        </p>
      </LegalSection>

      <LegalSection heading="7. Disclaimers & liability">
        <p>
          The Software is provided &quot;as is&quot; without warranties of any kind
          to the fullest extent permitted by law. Yemame is not liable for indirect,
          incidental, or consequential damages, or for loss of data or profits. Our
          total liability for any claim relating to the Software or a License is
          limited to the amount you paid for the License in question.
        </p>
      </LegalSection>

      <LegalSection heading="8. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless Yemame and its owners,
          directors, employees, and agents from and against any claims, liabilities,
          damages, losses, and expenses (including reasonable legal fees) arising
          from your use of the Software, your breach of these Terms, your data, or
          your violation of any applicable law.
        </p>
      </LegalSection>

      <LegalSection heading="9. Force majeure">
        <p>
          We are not liable for any failure or delay caused by events beyond our
          reasonable control, including acts of God, natural disasters, epidemics,
          war or civil unrest, government action, power or internet outages, or
          failures of telecommunications, hosting, or payment providers.
        </p>
      </LegalSection>

      <LegalSection heading="10. Governing law & disputes">
        <p>
          These Terms, and any dispute or claim arising out of or in connection with
          them (including non-contractual disputes), are governed by the laws of the
          Republic of Ghana, and you submit to the exclusive jurisdiction of the
          courts of Ghana. Before commencing any formal proceedings, you agree to
          contact us first and attempt in good faith to resolve the matter
          informally, allowing at least thirty (30) days for a response. Any claim
          must be brought within one (1) year of the event giving rise to it, to the
          fullest extent permitted by law.
        </p>
      </LegalSection>

      <LegalSection heading="11. General">
        <p>
          These Terms, together with our{" "}
          <Link href="/privacy" className="text-teal-600">Privacy Policy</Link>,
          are the entire agreement between you and Yemame regarding the Software and
          supersede any prior agreements. If any provision is held unenforceable, the
          remaining provisions stay in effect. Our failure to enforce any right is
          not a waiver of it. You may not assign these Terms without our consent; we
          may assign them in connection with a merger, acquisition, or sale of
          assets. Provisions that by their nature should survive termination
          (including licensing restrictions, disclaimers, liability limits,
          indemnification, and governing law) survive.
        </p>
      </LegalSection>

      <LegalSection heading="12. Changes & contact">
        <p>
          We may update these Terms from time to time; continued use after an update
          constitutes acceptance. Questions? Email{" "}
          <a href="mailto:support@yemame.com" className="text-teal-600">
            support@yemame.com
          </a>{" "}
          or contact us on WhatsApp at{" "}
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
