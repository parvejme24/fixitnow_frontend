import type { Metadata } from "next"

import LegalPage, {
  LegalSection,
} from "@/app/components/Shared/LegalPage/LegalPage"

export const metadata: Metadata = {
  title: "Terms & Conditions — FixItNow",
  description: "Terms and conditions for using FixItNow booking services.",
}

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="3 August 2026"
    >
      <LegalSection title="1. About FixItNow">
        <p>
          FixItNow is a booking platform that connects customers in Dhaka with
          verified home-service technicians for fixed time slots. By creating an
          account or placing a booking, you agree to these terms.
        </p>
      </LegalSection>

      <LegalSection title="2. Accounts">
        <p>
          You must provide accurate registration details and keep your login
          credentials secure. You are responsible for activity under your
          account. FixItNow may suspend accounts that misuse the platform,
          submit false information, or abuse technicians or customers.
        </p>
      </LegalSection>

      <LegalSection title="3. Bookings and slots">
        <p>
          Service prices shown are starting prices for the listed job type.
          Booking a slot requests the technician&apos;s time; confirmation
          depends on technician acceptance. Declined or cancelled bookings that
          were never paid do not create a charge.
        </p>
      </LegalSection>

      <LegalSection title="4. Payments">
        <p>
          Payment is collected after a booking is accepted, through supported
          methods on the platform. Completed jobs remain subject to the booking
          status and any refund rules applied by FixItNow support.
        </p>
      </LegalSection>

      <LegalSection title="5. Technician services">
        <p>
          Technicians provide the on-site work. FixItNow verifies profiles and
          coordinates booking flow, but does not employ every technician as
          permanent staff unless stated otherwise. Disputes about work quality
          should be raised promptly through your booking or support channels.
        </p>
      </LegalSection>

      <LegalSection title="6. Cancellations">
        <p>
          Customers and technicians should cancel as early as possible when a
          slot cannot be kept. Repeated late cancellations or no-shows may
          affect account standing.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>
          Do not use FixItNow for unlawful work, harassment, fraud, or
          circumventing payments outside the platform for jobs arranged here.
        </p>
      </LegalSection>

      <LegalSection title="8. Changes">
        <p>
          We may update these terms as the product evolves. Continued use after
          an update means you accept the revised terms. The date at the top of
          this page shows the latest revision.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
