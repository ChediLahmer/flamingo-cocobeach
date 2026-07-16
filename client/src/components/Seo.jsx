import { useEffect } from "react";
import { useLanguage } from "../i18n/LanguageContext";

function upsertMeta(attr, key, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertJsonLd(id, data) {
  let el = document.getElementById(id);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * Per-page SEO. Updates the document title, meta description, social cards
 * and (on the home page) LocalBusiness structured data from site config.
 */
export default function Seo({ config = {}, title, description, path = "" }) {
  const { lang, localizedValue } = useLanguage();

  useEffect(() => {
    const siteName = localizedValue(config.name) || "Flamingo Coco Beach";
    const baseTitle = localizedValue(config.seo_title) || siteName;
    const fullTitle = title ? `${title} · ${siteName}` : baseTitle;
    const desc =
      description ||
      localizedValue(config.seo_description) ||
      localizedValue(config.tagline) ||
      "";
    const image =
      config.og_image ||
      config.hero_poster_url ||
      (typeof window !== "undefined"
        ? `${window.location.origin}/og-image.jpg`
        : "");
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${path || window.location.pathname}`
        : "";

    document.title = fullTitle;
    document.documentElement.lang = lang;

    upsertMeta("name", "description", desc);
    if (config.seo_keywords)
      upsertMeta("name", "keywords", config.seo_keywords);

    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:site_name", siteName);
    if (url) upsertMeta("property", "og:url", url);
    if (image) upsertMeta("property", "og:image", image);

    upsertMeta(
      "name",
      "twitter:card",
      image ? "summary_large_image" : "summary",
    );
    upsertMeta("name", "twitter:title", fullTitle);
    upsertMeta("name", "twitter:description", desc);
    if (image) upsertMeta("name", "twitter:image", image);

    // Canonical
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (url) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", url);
    }

    // Structured data only on the home page.
    if (
      path === "/" ||
      (typeof window !== "undefined" && window.location.pathname === "/")
    ) {
      const geo =
        config.lat && config.lng
          ? {
              "@type": "GeoCoordinates",
              latitude: config.lat,
              longitude: config.lng,
            }
          : undefined;
      upsertJsonLd("ld-business", {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: siteName,
        description: desc,
        servesCuisine: "Tropical, Beach Bar",
        image: image || undefined,
        url: url || undefined,
        telephone: config.phone || undefined,
        email: config.email || undefined,
        address: localizedValue(config.address)
          ? {
              "@type": "PostalAddress",
              streetAddress: localizedValue(config.address),
            }
          : undefined,
        geo,
        sameAs: [config.instagram, config.facebook, config.tiktok].filter(
          Boolean,
        ),
        openingHours: localizedValue(config.hours) || undefined,
      });
    } else {
      upsertJsonLd("ld-business", null);
    }
  }, [config, title, description, path, lang, localizedValue]);

  return null;
}
