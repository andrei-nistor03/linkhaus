import { localizeProjects } from "@/components/projects/projectsData";
import { localizeServiceClusters } from "@/components/services/servicesData";
import { LOCALES, localePath, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
} from "@/lib/site";

const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

// schema.org graph for one localized home page: the studio (with its service
// catalog), the website, the page itself and the showcased projects.
export function buildJsonLd(locale: Locale, dict: Dictionary) {
  const pageUrl = `${SITE_URL}${localePath(locale)}`;
  const pageId = `${pageUrl}#webpage`;
  const projects = localizeProjects(dict.projects.items);
  const clusters = localizeServiceClusters(dict.services.clusters);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": ORG_ID,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo.png`,
        image: `${SITE_URL}/logo.png`,
        description: dict.meta.description,
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        sameAs: SOCIAL_PROFILES,
        address: { "@type": "PostalAddress", addressCountry: "RO" },
        areaServed: "Worldwide",
        knowsLanguage: [...LOCALES],
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: dict.services.catalogName,
          itemListElement: clusters.map((cluster) => ({
            "@type": "OfferCatalog",
            name: cluster.title,
            itemListElement: cluster.items.map((item) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: item.title,
                description: item.description ?? item.detail,
                provider: { "@id": ORG_ID },
              },
            })),
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: SITE_URL,
        name: SITE_NAME,
        inLanguage: [...LOCALES],
        publisher: { "@id": ORG_ID },
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: pageUrl,
        name: dict.meta.title,
        description: dict.meta.description,
        inLanguage: locale,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": ORG_ID },
        hasPart: projects.map((p) => ({ "@id": `${pageUrl}#project-${p.index}` })),
      },
      ...projects.map((p) => ({
        "@type": "CreativeWork",
        "@id": `${pageUrl}#project-${p.index}`,
        name: p.title,
        description: p.description,
        keywords: p.tags.join(", "),
        dateCreated: p.year,
        inLanguage: locale,
        ...(p.thumbnail ? { image: `${SITE_URL}${p.thumbnail}` } : {}),
        creator: { "@id": ORG_ID },
      })),
    ],
  };
}
