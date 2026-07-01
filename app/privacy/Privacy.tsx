import Page from '~/components/Page';

export default function Privacy() {
  return (
    <Page data-testid="Privacy">
      <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-foreground-500 mb-8">Effective: July 2026</p>

      <p className="mb-8">
        ColorMeUp LAB ("we", "us") is a color palette design tool available at{' '}
        <strong>lab.colormeup.co</strong>. This policy describes what data we collect, how we use
        it, and your rights regarding that data.
      </p>

      <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>

      <div className="space-y-2 mb-8">
        <h3 className="text-lg font-semibold">Account Data</h3>
        <p>
          When you create an account, we collect your <strong>email address</strong> and{' '}
          <strong>name</strong> (optional). If you sign in with Google or GitHub, we also receive
          your <strong>profile avatar URL</strong> from the provider.
        </p>
        <p>
          Passwords are hashed server-side by Firebase Authentication and are never stored in plain
          text. We do not have access to your plain-text password.
        </p>

        <h3 className="text-lg font-semibold mt-4">Palette Data</h3>
        <p>
          When you save a palette, we store a <strong>palette name</strong>, the{' '}
          <strong>encoded palette URL</strong> (containing your color and scale settings), and
          whether you marked it as a favorite. Each saved palette is associated with your user ID.
        </p>

        <h3 className="text-lg font-semibold mt-4">Usage Analytics</h3>
        <p>
          We use <strong>PostHog</strong> for product analytics to understand how the app is used.
          We track page views and product events (e.g., login method used, palette saves, color
          edits). Analytics is configured to be <strong>cookieless</strong> — it uses in-memory
          persistence and stores nothing on your device.
        </p>
        <p>
          PostHog also records <strong>session replays</strong> of on-page interactions (input
          fields are masked by default), <strong>heatmaps</strong>, and{' '}
          <strong>web performance metrics</strong>. Your IP address is used to derive an approximate
          location and is not stored long-term. Requests are proxied through{' '}
          <strong>lab.colormeup.co/ingest</strong>, and data is processed by PostHog Cloud (US
          region).
        </p>

        <h3 className="text-lg font-semibold mt-4">Error Logs</h3>
        <p>
          We use <strong>Sentry</strong> for error tracking. When an error occurs, Sentry captures
          technical details about the error (stack trace, browser info). This data is used solely to
          diagnose and fix bugs.
        </p>

        <h3 className="text-lg font-semibold mt-4">Local Storage</h3>
        <p>
          We store your <strong>UI preferences</strong> (such as dark mode) in your browser's local
          storage. This data stays on your device and is not sent to our servers. Our analytics uses
          no device storage.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Cookies &amp; Consent</h2>

      <p className="mb-8">
        We do not use cookies or any device storage for analytics. Because no tracking cookies are
        set, we do not display a cookie consent banner. Our analytics processing relies on a
        legitimate interest in understanding and improving the service, using the minimal,
        privacy-preserving configuration described above.
      </p>

      <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>

      <div className="space-y-2 mb-8">
        <ul className="list-disc pl-6 space-y-1">
          <li>Authenticate your account and manage sessions</li>
          <li>Save and retrieve your palettes</li>
          <li>Display your profile avatar</li>
          <li>Understand how the app is used (product analytics and session replay)</li>
          <li>Identify and fix errors</li>
        </ul>
        <p className="mt-2">
          We do not sell your data. We do not use your data for advertising or profiling.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Third-Party Services</h2>

      <div className="space-y-2 mb-8">
        <ul className="list-disc pl-6 space-y-1">
          <li>
            <strong>Firebase (Google Cloud)</strong> — Authentication and database hosting (US
            region).{' '}
            <a
              className="underline"
              href="https://firebase.google.com/support/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Privacy Policy
            </a>
          </li>
          <li>
            <strong>Google OAuth</strong> — Sign-in provider. Shares your email, name, and avatar
            with us during authentication.{' '}
            <a
              className="underline"
              href="https://policies.google.com/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Privacy Policy
            </a>
          </li>
          <li>
            <strong>GitHub OAuth</strong> — Sign-in provider. Shares your email, name, and avatar
            with us during authentication.{' '}
            <a
              className="underline"
              href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"
              rel="noopener noreferrer"
              target="_blank"
            >
              Privacy Policy
            </a>
          </li>
          <li>
            <strong>PostHog</strong> — Product analytics, session replay, and heatmaps. Cookieless;
            US region.{' '}
            <a
              className="underline"
              href="https://posthog.com/privacy"
              rel="noopener noreferrer"
              target="_blank"
            >
              Privacy Policy
            </a>
          </li>
          <li>
            <strong>Sentry</strong> — Error tracking. Captures technical error data only.
          </li>
        </ul>
      </div>

      <h2 className="text-2xl font-bold mb-4">Data Storage and Security</h2>

      <div className="space-y-2 mb-8">
        <p>
          Your account and palette data is stored on Firebase (Google Cloud) servers. All
          communication between your browser and our services uses HTTPS encryption.
        </p>
        <p>
          Access to your saved palettes is restricted to your account through Firestore security
          rules.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Your Rights</h2>

      <div className="space-y-2 mb-8">
        <p>You can:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access and view your saved data through the app</li>
          <li>Delete individual palettes at any time</li>
          <li>Request deletion of your account and all associated data by contacting us</li>
        </ul>
      </div>

      <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>

      <p className="mb-8">
        This service is not directed at children under 13. We do not knowingly collect data from
        children under 13. If you believe a child has provided us with personal data, please contact
        us so we can remove it.
      </p>

      <h2 className="text-2xl font-bold mb-4">Changes to This Policy</h2>

      <p className="mb-8">
        We may update this policy from time to time. Changes will be reflected on this page with an
        updated effective date. Continued use of the service after changes constitutes acceptance of
        the updated policy.
      </p>

      <h2 className="text-2xl font-bold mb-4">Contact</h2>

      <p>
        For questions about this policy or to request data deletion, contact us at{' '}
        <a className="underline" href="mailto:contact@colormeup.co">
          contact@colormeup.co
        </a>
        .
      </p>
    </Page>
  );
}
