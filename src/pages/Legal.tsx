import { Link } from "react-router-dom";

const IMG = "/website-images";

type LegalPageProps = {
  title: string;
  updated: string;
  children: React.ReactNode;
};

function LegalLayout({ title, updated, children }: LegalPageProps) {
  return (
    <div className="min-h-full bg-[#f7f3ec] text-[rgba(10,8,7,0.88)]">
      <header className="border-b border-black/5 bg-[#f7f3ec]/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-[min(960px,calc(100%-32px))] items-center justify-between">
          <Link to="/" className="inline-flex">
            <img src={`${IMG}/logo.png`} alt="Dinevoro" className="h-7 w-auto" />
          </Link>
          <Link to="/login" className="text-sm font-semibold text-[rgba(214,163,81,1)] hover:underline">
            Back to signup
          </Link>
        </div>
      </header>

      <main className="mx-auto w-[min(800px,calc(100%-32px))] py-12">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[rgba(214,163,81,1)]">Legal</p>
        <h1
          className="mt-2 font-['National_Park',Georgia,serif] text-4xl font-normal uppercase tracking-tight text-[rgba(10,8,7,1)]"
        >
          {title}
        </h1>
        <p className="mt-2 text-sm text-black/50">Last updated: {updated}</p>
        <div className="mt-8 space-y-5 text-sm leading-7 text-black/70 [&_h2]:mt-8 [&_h2]:font-semibold [&_h2]:text-black/90 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </main>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalLayout title="Terms of Service" updated="6 September 2026">
      <p>
        These Terms of Service (“Terms”) govern your access to and use of Dinevoro, the restaurant
        operating system provided by Megaviz Technologies (“we”, “us”, or “our”). By creating an
        account or using the service, you agree to these Terms.
      </p>

      <h2>1. Accounts &amp; eligibility</h2>
      <p>
        You must provide accurate account information and keep your credentials secure. You are
        responsible for activity under your account, including staff users you invite.
      </p>

      <h2>2. Free trial</h2>
      <p>
        New accounts may receive a free trial period. During the trial you get access to selected
        modules. We may modify or end trials at any time. After the trial, continued use requires a
        paid subscription for the modules you keep.
      </p>

      <h2>3. Subscriptions &amp; billing</h2>
      <ul>
        <li>Pricing is modular — you pay only for enabled modules.</li>
        <li>Fees are billed in advance on a monthly basis unless otherwise agreed.</li>
        <li>You can add or remove modules; changes apply on the next billing cycle.</li>
        <li>Taxes may apply based on your location and business registration.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>
        You agree not to misuse the service, attempt unauthorized access, reverse engineer the
        platform, or use Dinevoro for unlawful activity. We may suspend accounts that violate these
        Terms.
      </p>

      <h2>5. Your data</h2>
      <p>
        You retain ownership of restaurant, menu, order, and customer data you upload. You grant us
        a limited license to process that data solely to operate and improve the service. See our{" "}
        <Link to="/privacy" className="font-semibold text-[rgba(214,163,81,1)] hover:underline">
          Privacy Policy
        </Link>{" "}
        for details.
      </p>

      <h2>6. Service availability</h2>
      <p>
        We aim for high availability but do not guarantee uninterrupted service. Core POS flows may
        queue locally during connectivity issues and sync when online again.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Dinevoro and Megaviz Technologies are not liable for
        indirect, incidental, or consequential damages arising from use of the service.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update these Terms. Material changes will be communicated via email or in-product
        notice. Continued use after changes means you accept the updated Terms.
      </p>

      <h2>9. Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:legal@dinevoro.com" className="font-semibold text-[rgba(214,163,81,1)] hover:underline">
          legal@dinevoro.com
        </a>
        .
      </p>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" updated="6 September 2026">
      <p>
        This Privacy Policy explains how Megaviz Technologies (“we”, “us”) collects, uses, and
        protects personal data when you use Dinevoro.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> name, email, phone, restaurant details, and login credentials.
        </li>
        <li>
          <strong>Business data:</strong> menus, orders, inventory, staff, billing, and customer CRM
          records you enter into the product.
        </li>
        <li>
          <strong>Usage data:</strong> device/browser information, IP address, and product analytics
          to improve reliability and features.
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, operate, and secure the Dinevoro platform</li>
        <li>Process subscriptions, invoices, and support requests</li>
        <li>Power AI features such as demand forecasting and campaign suggestions</li>
        <li>Send product updates and important service notices</li>
      </ul>

      <h2>3. Sharing</h2>
      <p>
        We do not sell your restaurant or customer data. We may share data with trusted processors
        (hosting, email, payments) under confidentiality agreements, or when required by law.
      </p>

      <h2>4. Data security</h2>
      <p>
        Data is encrypted in transit and at rest. Access is role-based within your team. No method of
        transmission is 100% secure, but we follow industry-standard safeguards.
      </p>

      <h2>5. Retention</h2>
      <p>
        We retain account and business data while your subscription is active and for a reasonable
        period afterward for legal, tax, and backup purposes, unless you request earlier deletion.
      </p>

      <h2>6. Your rights</h2>
      <p>
        Depending on applicable law, you may request access, correction, export, or deletion of your
        personal data. Contact us to exercise these rights.
      </p>

      <h2>7. Cookies</h2>
      <p>
        We use essential cookies for authentication and session security, and limited analytics
        cookies to understand product usage. You can control non-essential cookies in your browser.
      </p>

      <h2>8. Contact</h2>
      <p>
        Privacy questions? Email{" "}
        <a href="mailto:privacy@dinevoro.com" className="font-semibold text-[rgba(214,163,81,1)] hover:underline">
          privacy@dinevoro.com
        </a>
        .
      </p>
    </LegalLayout>
  );
}
