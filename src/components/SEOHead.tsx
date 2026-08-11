import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";

interface SEOHeadProps {
  title: string;
  description: string;
  /** Override path canonical bila berbeda dari location.pathname (mis. trailing slash). */
  canonicalPath?: string;
  /** URL gambar Open Graph absolut. Default: logo site. */
  ogImage?: string;
  /** Satu atau beberapa objek JSON-LD yang akan di-inject sebagai <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const upsertMeta = (
  selector: string,
  attrs: Record<string, string>,
  content: string
) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/**
 * SEOHead — sinkronkan <title>, meta description, canonical, og, dan JSON-LD
 * untuk setiap route SPA. Canonical selalu absolut (SITE_URL + path) dan
 * hanya ada satu <link rel="canonical"> di dokumen.
 */
const SEOHead = ({ title, description, canonicalPath, ogImage, jsonLd }: SEOHeadProps) => {
  const location = useLocation();
  const path = canonicalPath ?? location.pathname;
  const canonicalUrl = `${SITE_URL}${path === "/" ? "/" : path.replace(/\/$/, "")}`;
  const image = ogImage ?? DEFAULT_OG_IMAGE;

  useEffect(() => {
    document.title = title;

    upsertMeta('meta[name="description"]', { name: "description" }, description);
    upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
    upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, canonicalUrl);
    upsertMeta('meta[property="og:image"]', { property: "og:image" }, image);
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, image);

    // Canonical tunggal, absolut, mengikuti route aktif.
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", canonicalUrl);

    // JSON-LD structured data.
    const injected: HTMLScriptElement[] = [];
    if (jsonLd) {
      const items = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      items.forEach((item, i) => {
        const el = document.createElement("script");
        el.type = "application/ld+json";
        el.dataset.seoHead = String(i);
        el.textContent = JSON.stringify(item);
        document.head.appendChild(el);
        injected.push(el);
      });
    }

    return () => {
      injected.forEach((el) => el.parentNode?.removeChild(el));
    };
  }, [title, description, canonicalUrl, image, jsonLd]);

  return null;
};

export default SEOHead;
