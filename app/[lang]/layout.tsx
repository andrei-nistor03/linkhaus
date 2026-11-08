import type { Metadata, Viewport } from "next";
import { grotesk, mono, thunder } from "@/lib/fonts";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  DEFAULT_LOCALE,
  LANGUAGE_ALTERNATES,
  LOCALES,
  OG_LOCALE,
  isLocale,
  localePath,
  type Locale,
} from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import "../globals.css";

// This is the root layout: it lives under [lang] so <html lang> matches the
// page. middleware.ts maps `/` to the `en` segment and leaves `/ro` as is.
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

// middleware.ts only ever routes to a known locale; this is a safety net.
function resolveLocale(lang: string): Locale {
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

// Runs before first paint. In-app browsers resize the webview itself while
// scrolling (their toolbars collapse), so vh/svh/lvh all change mid-scroll:
// sections grow and shrink under ScrollTrigger, which ignores those mobile
// resizes on purpose, and the Services→Contact veil fires at the wrong spot.
// There, pin the units (see globals.css) to the height measured at load and
// only re-measure when the width changes (rotation).
const STABLE_VIEWPORT_SCRIPT = `(function(){try{
var ua=navigator.userAgent||"";
if(!/Instagram|FBAN|FBAV|FB_IAB|FBIOS|Snapchat|musical_ly|BytedanceWebview|TikTok|Line\\/|LinkedInApp|Pinterest|Twitter/i.test(ua))return;
var d=document.documentElement,w=0;
function set(){var h=window.innerHeight||d.clientHeight;if(!h)return;
var u=h/100+"px";d.style.setProperty("--vh",u);d.style.setProperty("--svh",u);d.style.setProperty("--lvh",u);w=window.innerWidth;}
d.setAttribute("data-inapp","");set();
window.addEventListener("resize",function(){if(!w||window.innerWidth!==w)set();});
}catch(e){}})();`;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

// og:image / twitter:image and the favicons come from the image files in
// the app folder (opengraph-image.png, twitter-image.png, icon.png, ...).
export async function generateMetadata({ params }: Pick<LayoutProps, "params">): Promise<Metadata> {
  const locale = resolveLocale((await params).lang);
  const { meta } = getDictionary(locale);
  const url = localePath(locale);

  return {
    metadataBase: new URL(SITE_URL),
    applicationName: SITE_NAME,
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: url,
      languages: LANGUAGE_ALTERNATES,
    },
    openGraph: {
      type: "website",
      url,
      siteName: SITE_NAME,
      title: meta.title,
      description: meta.description,
      locale: OG_LOCALE[locale],
      alternateLocale: LOCALES.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f3ee",
};

export default async function RootLayout({ children, params }: LayoutProps) {
  const locale = resolveLocale((await params).lang);
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${grotesk.variable} ${mono.variable} ${thunder.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: STABLE_VIEWPORT_SCRIPT }} />
      </head>
      <body>
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
