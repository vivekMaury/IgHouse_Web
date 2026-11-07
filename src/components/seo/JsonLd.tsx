/**
 * Reusable JSON-LD structured data component.
 *
 * Usage:
 *   <JsonLd schema={organizationSchema} />
 *   <JsonLd schema={[schema1, schema2]} />
 *
 * Each helper builds a validated schema object; the component serialises it
 * into a <script type="application/ld+json"> tag safe for SSR.
 */

import type { ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Core component                                                            */
/* -------------------------------------------------------------------------- */

type JsonLdSchema = Record<string, unknown>;

interface JsonLdProps {
  /** A single schema object or an array of schemas. */
  schema: JsonLdSchema | JsonLdSchema[];
}

/**
 * Renders one or more JSON-LD `<script>` blocks.
 * Accepts a single schema or an array; each gets its own tag for clarity
 * in Google Rich Results Test.
 */
export function JsonLd({ schema }: JsonLdProps): ReactNode {
  const schemas = Array.isArray(schema) ? schema : [schema];

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Schema helpers                                                            */
/* -------------------------------------------------------------------------- */

const SITE_URL = "https://iginbox.com";
const SITE_NAME = "IgInbox";

/* ---- Organization ---- */

export interface OrganizationOptions {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
  contactEmail?: string;
  foundingDate?: string;
}

export function organizationSchema(opts: OrganizationOptions = {}): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name ?? SITE_NAME,
    url: opts.url ?? SITE_URL,
    logo: opts.logo ?? `${SITE_URL}/favicon-512.png`,
    ...(opts.sameAs && { sameAs: opts.sameAs }),
    ...(opts.foundingDate && { foundingDate: opts.foundingDate }),
    ...(opts.contactEmail && {
      contactPoint: {
        "@type": "ContactPoint",
        email: opts.contactEmail,
        contactType: "customer support",
      },
    }),
  };
}

/* ---- SoftwareApplication ---- */

export interface PricingTier {
  name: string;
  price: string;
  priceCurrency?: string;
  billingPeriod?: string;
}

export interface SoftwareApplicationOptions {
  name?: string;
  description?: string;
  url?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: PricingTier[];
}

export function softwareApplicationSchema(
  opts: SoftwareApplicationOptions = {},
): JsonLdSchema {
  const offers = opts.offers?.map((tier) => ({
    "@type": "Offer",
    name: tier.name,
    price: tier.price,
    priceCurrency: tier.priceCurrency ?? "USD",
    ...(tier.billingPeriod && { billingPeriod: tier.billingPeriod }),
  }));

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name ?? SITE_NAME,
    applicationCategory: opts.applicationCategory ?? "BusinessApplication",
    operatingSystem: opts.operatingSystem ?? "Web",
    ...(opts.description && { description: opts.description }),
    url: opts.url ?? SITE_URL,
    ...(offers && { offers }),
  };
}

/* ---- FAQPage ---- */

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageSchema(faqs: FaqItem[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/* ---- BreadcrumbList ---- */

export interface Breadcrumb {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: Breadcrumb[]): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/* ---- WebPage (legal / trust pages) ---- */

export interface WebPageOptions {
  name: string;
  url: string;
  description?: string;
  lastReviewed?: string;
}

export function webPageSchema(opts: WebPageOptions): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    url: opts.url,
    ...(opts.description && { about: opts.description }),
    ...(opts.lastReviewed && { lastReviewed: opts.lastReviewed }),
  };
}

/* ---- Speakable (GEO) ---- */

export interface SpeakableOptions {
  url: string;
  cssSelectors: string[];
}

export function speakableSchema(opts: SpeakableOptions): JsonLdSchema {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: opts.url,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: opts.cssSelectors,
    },
  };
}
