export const SITE_URL = "https://ipanstore.my.id";
export const SITE_NAME = "IPAN STORE";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

export interface FaqItem {
  q: string;
  a: string;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

const LOCAL_BUSINESS = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "@id": `${SITE_URL}/#business`,
  name: SITE_NAME,
  url: SITE_URL,
  image: DEFAULT_OG_IMAGE,
  logo: DEFAULT_OG_IMAGE,
  description:
    "Jasa optimasi PC gaming, tweaking Windows, dan boost FPS Free Fire di Indonesia. Pengerjaan 100% remote via UltraViewer.",
  priceRange: "Rp 20.000 - Rp 150.000",
  areaServed: {
    "@type": "Country",
    name: "Indonesia",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer service",
    availableLanguage: ["Indonesian"],
    url: `${SITE_URL}/kontak`,
  },
};

const WEBSITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "id-ID",
  publisher: { "@id": `${SITE_URL}/#business` },
};

export function localBusinessJsonLd() {
  return LOCAL_BUSINESS;
}

export function websiteJsonLd() {
  return WEBSITE;
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function serviceJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  price?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: `${SITE_URL}${opts.path}`,
    provider: { "@id": `${SITE_URL}/#business` },
    areaServed: {
      "@type": "Country",
      name: "Indonesia",
    },
    ...(opts.price
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "IDR",
            price: opts.price,
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}
