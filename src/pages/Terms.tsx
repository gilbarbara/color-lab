import { useHead } from '@unhead/react';

import Page from '~/components/Page';

export default function Terms() {
  useHead({
    title: 'Terms of service — ColorMeUp LAB',
    meta: [
      {
        name: 'description',
        content:
          'Terms of service for ColorMeUp LAB — a free, open-source tool for creating and saving perceptual color palettes.',
      },
    ],
    link: [{ rel: 'canonical', href: 'https://lab.colormeup.co/terms' }],
  });

  return (
    <Page data-testid="Terms">
      <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
      <p className="text-foreground-500 mb-8">Effective: January 2026</p>

      <p className="mb-8">
        These terms govern your use of ColorMeUp LAB ("the Service"), a color palette design tool
        available at <strong>lab.colormeup.co</strong>, operated by ColorMeUp ("we", "us").
      </p>

      <h2 className="text-2xl font-bold mb-4">Acceptance of Terms</h2>

      <p className="mb-8">
        By accessing or using the Service, you agree to these terms. If you do not agree, do not use
        the Service.
      </p>

      <h2 className="text-2xl font-bold mb-4">Description of Service</h2>

      <p className="mb-8">
        ColorMeUp LAB is a free tool for creating and fine-tuning perceptual color scales. You can
        use it without an account. Creating an account allows you to save and manage palettes.
      </p>

      <h2 className="text-2xl font-bold mb-4">User Accounts</h2>

      <div className="space-y-2 mb-8">
        <p>
          You may create an account using email/password, Google, GitHub, or a magic link. You are
          responsible for maintaining the security of your account credentials.
        </p>
        <p>
          We reserve the right to suspend or terminate accounts that violate these terms or are used
          for abusive purposes.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">User Content</h2>

      <div className="space-y-2 mb-8">
        <p>
          You retain ownership of the palettes and color data you create. We do not claim any
          intellectual property rights over your content.
        </p>
        <p>
          By saving palettes to the Service, you grant us a limited license to store and serve that
          data back to you.
        </p>
        <p>
          Palette URLs are shareable and encode your palette settings directly. Anyone with the URL
          can view the palette.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Acceptable Use</h2>

      <div className="space-y-2 mb-8">
        <p>You agree not to:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Attempt to gain unauthorized access to the Service or its systems</li>
          <li>Use automated tools to scrape or overload the Service</li>
          <li>Interfere with other users' access to the Service</li>
          <li>Use the Service for any unlawful purpose</li>
        </ul>
      </div>

      <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>

      <div className="space-y-2 mb-8">
        <p>
          The Service's source code is open source and available at{' '}
          <a
            className="underline"
            href="https://github.com/gilbarbara/color-lab"
            rel="noopener noreferrer"
            target="_blank"
          >
            github.com/gilbarbara/color-lab
          </a>
          . The source code is subject to its own license terms.
        </p>
        <p>The ColorMeUp name and branding remain our property.</p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Disclaimers</h2>

      <div className="space-y-2 mb-8">
        <p>
          The Service is provided <strong>"as is"</strong> and <strong>"as available"</strong>,
          without warranties of any kind, express or implied.
        </p>
        <p>
          We do not guarantee that the Service will be uninterrupted, error-free, or available at
          all times. We may modify or discontinue features at any time.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>

      <p className="mb-8">
        To the maximum extent permitted by law, we are not liable for any indirect, incidental,
        special, or consequential damages arising from your use of the Service. This includes, but
        is not limited to, loss of data, loss of profits, or interruption of service.
      </p>

      <h2 className="text-2xl font-bold mb-4">Termination</h2>

      <div className="space-y-2 mb-8">
        <p>
          You may stop using the Service at any time. You can request deletion of your account and
          data by contacting us.
        </p>
        <p>
          We may suspend or terminate your access if you violate these terms, with or without
          notice.
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">Changes to These Terms</h2>

      <p className="mb-8">
        We may update these terms from time to time. Changes will be reflected on this page with an
        updated effective date. Continued use of the Service after changes constitutes acceptance of
        the updated terms.
      </p>

      <h2 className="text-2xl font-bold mb-4">Contact</h2>

      <p>
        For questions about these terms, contact us at{' '}
        <a className="underline" href="mailto:contact@colormeup.co">
          contact@colormeup.co
        </a>
        .
      </p>
    </Page>
  );
}
