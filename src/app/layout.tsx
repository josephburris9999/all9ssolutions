import type {Metadata} from 'next';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Toaster } from '@/components/ui/toaster';
import Script from 'next/script';

const siteUrl = 'https://all9ssolutions.com';
const logoPath = '/images/all9s-logo.png';
const logoUrl = `${siteUrl}${logoPath}`;
const siteTitle = 'all9s Solutions LLC | Software Development & Technology Consulting';
const siteDescription =
  'Custom software development, web applications, database solutions, and technology consulting services.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  icons: {
    icon: [
      {
        url: logoPath,
        type: 'image/png',
      },
    ],
    shortcut: logoPath,
    apple: logoPath,
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: logoUrl,
      },
    ],
    url: siteUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: [logoUrl],
  },
  other: {
    'msapplication-TileImage': logoPath,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'all9s Solutions LLC',
  url: siteUrl,
  logo: logoUrl,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <Script
          id="organization-json-ld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        {gaMeasurementId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-gtag" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', { page_path: window.location.pathname });
              `}
            </Script>
          </>
        ) : null}
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <Navbar />
        <div className="flex min-h-screen flex-col">
          <div className="flex-1">{children}</div>
          <Footer />
        </div>
        {gaMeasurementId ? (
          <noscript>
            <div
              dangerouslySetInnerHTML={{
                __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${gaMeasurementId}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
              }}
            />
          </noscript>
        ) : null}
        <Toaster />
      </body>
    </html>
  );
}
