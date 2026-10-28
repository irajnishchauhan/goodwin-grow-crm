export interface ServicePackage {
  id: string;
  name: string;
  category: "CORE_RETAINER" | "SPECIALIZED_RETAINER" | "DEVELOPMENT" | "ENTERPRISE";
  tier?: "BASIC" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
  price: number;
  cadence: string;
  defaultPostsPlanned: number;
  estimatedDeliveryCost: number;
  targetGrossMarginPercent: number;
  contractTerms: {
    minCommitmentMonths: number;
    noticePeriodDays: number;
    billingFrequency: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "MILESTONE";
    paymentDueDay: number;
    summary: string;
  };
  deliverables: string[];
  description: string;
  isPopular?: boolean;
}

export interface AddOnService {
  id: string;
  name: string;
  price: number;
  pricingType: "ONE_TIME" | "MONTHLY_RECURRING";
  description: string;
  deliverablesSummary: string;
}

// ---------------------------------------------------------------------------
// 1. Standardized Retainer Packages: Basic, Standard, Premium & Specialized
// ---------------------------------------------------------------------------
export const SERVICE_PACKAGES: ServicePackage[] = [
  // --- 1. BASIC PLAN (AFFORDABLE ENTRY POINT) ---
  {
    id: "basic-plan",
    name: "Basic — Digital Foundation & Local Leads",
    category: "CORE_RETAINER",
    tier: "BASIC",
    price: 18000,
    cadence: "per month",
    defaultPostsPlanned: 6,
    estimatedDeliveryCost: 6000,
    targetGrossMarginPercent: 66.7,
    contractTerms: {
      minCommitmentMonths: 3,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "3-Month Minimum Commitment • 30-Day Written Notice • Billed Monthly in Advance",
    },
    deliverables: [
      "6 Branded Social Creatives & Feeds per Month",
      "Google Business Profile (GBP) Local SEO Ranking & Map Optimization",
      "Monthly Customer Review Monitoring & Citation Updates",
      "Dedicated WhatsApp Support Group & Monthly Performance Summary",
    ],
    description: "Affordable entry-level package designed for local retail stores, clinics, solo practitioners, and emerging startups.",
  },

  // --- 2. STANDARD PLAN (GROWTH RETAINER - MOST POPULAR) ---
  {
    id: "standard-plan",
    name: "Standard — Growth Retainer (Social + Ads + SEO)",
    category: "CORE_RETAINER",
    tier: "STANDARD",
    price: 45000,
    cadence: "per month",
    defaultPostsPlanned: 12,
    estimatedDeliveryCost: 13500,
    targetGrossMarginPercent: 70.0,
    isPopular: true,
    contractTerms: {
      minCommitmentMonths: 6,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "6-Month Minimum Commitment • 30-Day Written Notice • Bi-Weekly Pod Review",
    },
    deliverables: [
      "12 High-Impact Creatives + 2 Viral Video Reels",
      "Local SEO & Top 3 Google Map Pack Optimization",
      "Meta Ads Management (up to ₹75k monthly ad spend)",
      "Bi-Weekly Strategy & Deliverables Review Sync",
      "Dedicated Account Manager & Graphic Designer Pod",
    ],
    description: "Our flagship growth engine for fast-scaling local service businesses, coaching academies, legal chambers, and regional retailers.",
  },

  // --- 3. PREMIUM PLAN (OMNICHANNEL HYPER-GROWTH) ---
  {
    id: "premium-plan",
    name: "Premium — Omnichannel Hyper-Growth & Performance",
    category: "CORE_RETAINER",
    tier: "PREMIUM",
    price: 100000,
    cadence: "per month",
    defaultPostsPlanned: 24,
    estimatedDeliveryCost: 28000,
    targetGrossMarginPercent: 72.0,
    contractTerms: {
      minCommitmentMonths: 6,
      noticePeriodDays: 45,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "6-Month Commitment • Bi-Weekly Creative Sprints • 45-Day Cancellation Terms",
    },
    deliverables: [
      "24 High-Converting Brand Creatives & 6 Edited 4K Video Reels",
      "Full Meta Ads + Google Search & Shopping Ads Management",
      "Technical On-Page & Off-Page SEO with 4 High-Authority Articles",
      "Custom Creative Review & Approval Dashboard (Unlimited Revisions)",
      "Full Dedicated Pod (Lead AM, Senior Visualizer, Copywriter, Media Buyer)",
    ],
    description: "Complete creative and paid growth engine for established brands, multi-location healthcare centers, and scaling D2C brands.",
  },

  // --- 4. CUSTOM ENTERPRISE RETAINER ---
  {
    id: "custom-enterprise",
    name: "Custom Enterprise — 360° Corporate Brand Retainer",
    category: "ENTERPRISE",
    tier: "ENTERPRISE",
    price: 250000,
    cadence: "per month",
    defaultPostsPlanned: 35,
    estimatedDeliveryCost: 60000,
    targetGrossMarginPercent: 76.0,
    contractTerms: {
      minCommitmentMonths: 12,
      noticePeriodDays: 60,
      billingFrequency: "QUARTERLY",
      paymentDueDay: 1,
      summary: "12-Month Master Services Agreement • Executive Steering Committee • 60-Day Terms",
    },
    deliverables: [
      "35+ Omnichannel Assets, Corporate Films & On-Site Video Shoots",
      "Regional Multi-Lingual Vernacular Creative Localization",
      "Enterprise Multi-Channel Paid Media (Meta, Google, LinkedIn & YouTube)",
      "24/7 Crisis PR, Brand Reputation & Social Listening",
      "Dedicated Growth Pod & Weekly Director-Level Strategic Review",
    ],
    description: "Enterprise governance, multi-regional campaigns, and corporate branding for large corporations, manufacturing leaders, and hospital networks.",
  },

  // --- 5. PERFORMANCE MARKETING — ADS ONLY ---
  {
    id: "performance-ads-only",
    name: "Performance Marketing — Ads Management Only",
    category: "SPECIALIZED_RETAINER",
    price: 35000,
    cadence: "per month",
    defaultPostsPlanned: 4,
    estimatedDeliveryCost: 10000,
    targetGrossMarginPercent: 71.4,
    contractTerms: {
      minCommitmentMonths: 3,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "3-Month Minimum Commitment • Daily ROAS Tracking • 30-Day Notice",
    },
    deliverables: [
      "Full Funnel Meta (Facebook/Instagram) & Google Ads Campaign Architecture",
      "Conversion Tracking, Meta Pixel & Server-Side CAPI Implementation",
      "Weekly Ad Creative A/B Testing & Audience Segmentation",
      "Live Databox / Looker Studio ROAS Dashboard",
      "Dedicated Senior Media Buyer",
    ],
    description: "Dedicated ad spend scaling service for clients who have existing creative assets but need specialized media buying and ROAS optimization.",
  },

  // --- 6. SEO & ORGANIC GROWTH RETAINER ---
  {
    id: "seo-organic-growth",
    name: "SEO & Organic Growth Retainer",
    category: "SPECIALIZED_RETAINER",
    price: 30000,
    cadence: "per month",
    defaultPostsPlanned: 4,
    estimatedDeliveryCost: 9000,
    targetGrossMarginPercent: 70.0,
    contractTerms: {
      minCommitmentMonths: 6,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "6-Month Minimum Commitment (Organic SEO Cycle) • 30-Day Notice",
    },
    deliverables: [
      "Comprehensive Technical SEO Audit & Core Web Vitals Fixes",
      "Keyword Research & Search Intent Mapping (25 Priority Keywords)",
      "4 High-Intent SEO Articles / Month (1,200+ Words with Schema Markup)",
      "High-Authority Backlink Acquisition (5 Contextual Backlinks/Month)",
      "Monthly Keyword Ranking & Google Search Console Traffic Report",
    ],
    description: "Long-term organic authority and search visibility package to drive sustainable search traffic without ongoing ad spend.",
  },

  // --- 7. SOCIAL MEDIA MANAGEMENT ONLY ---
  {
    id: "social-media-only",
    name: "Social Media Management Only",
    category: "SPECIALIZED_RETAINER",
    price: 25000,
    cadence: "per month",
    defaultPostsPlanned: 12,
    estimatedDeliveryCost: 7500,
    targetGrossMarginPercent: 70.0,
    contractTerms: {
      minCommitmentMonths: 3,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "3-Month Minimum Commitment • 30-Day Written Notice",
    },
    deliverables: [
      "12 Organic Social Posts (Carousels, Statics & 2 Reels)",
      "Captions, Hashtag Research & Aesthetic Grid Planning",
      "Story Highlights, Bio Optimization & Community Engagement",
      "Social Listening & Direct Message Response Protocol",
    ],
    description: "Organic community building and creative content for brands focusing purely on organic Instagram, LinkedIn, and Facebook presence.",
  },

  // --- 8. WEBSITE DESIGN & DEVELOPMENT ---
  {
    id: "website-design-dev",
    name: "Website Design & Development",
    category: "DEVELOPMENT",
    price: 65000,
    cadence: "one-time",
    defaultPostsPlanned: 0,
    estimatedDeliveryCost: 19000,
    targetGrossMarginPercent: 70.8,
    contractTerms: {
      minCommitmentMonths: 1,
      noticePeriodDays: 15,
      billingFrequency: "MILESTONE",
      paymentDueDay: 1,
      summary: "50% Advance • 30% Design Approval • 20% Launch • 30-Day Free Post-Launch Support",
    },
    deliverables: [
      "Modern, Responsive 6-8 Page Website Built on Next.js or WordPress",
      "Mobile-First UI/UX Design with Dark/Light Palette & Micro-Animations",
      "On-Page Technical SEO, Schema Markup & Sub-Second Page Speeds",
      "WhatsApp Chatbot, Lead Capture Forms & CRM API Integration",
      "Domain Setup, SSL Certificate & 30-Day Post-Launch Technical Warranty",
    ],
    description: "High-converting corporate website and e-commerce storefront development tailored for modern conversions.",
  },
];

// ---------------------------------------------------------------------------
// 2. Standardized Optional Add-On Services Catalog
// ---------------------------------------------------------------------------
export const ADD_ON_SERVICES: AddOnService[] = [
  {
    id: "whatsapp-crm-automation",
    name: "WhatsApp CRM & Chatbot Automation Setup",
    price: 15000,
    pricingType: "ONE_TIME",
    description: "Official WhatsApp Cloud API verification, green tick assistance, and interactive lead routing bot.",
    deliverablesSummary: "Green Tick Application • 5 Automated Chat Flow Templates • Team Inbox Integration",
  },
  {
    id: "extra-reels-shoot-day",
    name: "Extra Reels & On-Site Product Shoot Day",
    price: 20000,
    pricingType: "ONE_TIME",
    description: "Dedicated on-site videographer with 4K cinema gear, audio kits, and lighting for 1 full day.",
    deliverablesSummary: "1 Full Day On-Site Shoot • Raw B-Roll Footage Archive • 8 Edited Cinematic Reels",
  },
  {
    id: "vernacular-localization",
    name: "Regional Vernacular Localization",
    price: 12000,
    pricingType: "MONTHLY_RECURRING",
    description: "Adaptation of monthly creatives, copy, and voiceovers into Hindi, Rajasthani, or regional dialects.",
    deliverablesSummary: "Bilingual Creatives • Regional Copywriting • Vernacular Audio Dubbing",
  },
  {
    id: "influencer-seeding-pack",
    name: "Influencer Seeding & Whitelisting Setup",
    price: 25000,
    pricingType: "ONE_TIME",
    description: "Outreach, contract negotiation, and Meta ad account access granting for 5 micro/nano creators.",
    deliverablesSummary: "5 Vetted Creators • Product Gifting Management • Creator Ads Whitelisting",
  },
  {
    id: "landing-page-sprint",
    name: "Custom High-Converting Landing Page",
    price: 18000,
    pricingType: "ONE_TIME",
    description: "Dedicated single-page sales funnel built for paid campaigns with A/B testing setup.",
    deliverablesSummary: "1 Custom High-Speed Page • Copywriting • Heatmap & Pixel Attribution",
  },
  {
    id: "crisis-pr-monitoring",
    name: "Crisis PR & 24/7 Social Listening",
    price: 30000,
    pricingType: "MONTHLY_RECURRING",
    description: "Continuous brand sentiment monitoring, negative review suppression, and crisis response escalation.",
    deliverablesSummary: "24/7 Keyword Alerts • Escalation Playbook • Review Remediation SOP",
  },
];

// ---------------------------------------------------------------------------
// 3. Standardized Invoicing Catalog for Dropdowns & Quick Invoicing
// ---------------------------------------------------------------------------
export interface InvoiceCatalogItem {
  id: string;
  name: string;
  category: string;
  defaultPrice: number;
  cadence: string;
  defaultDescription: string;
}

export const INVOICE_CATALOG_ITEMS: InvoiceCatalogItem[] = [
  ...SERVICE_PACKAGES.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    category: pkg.category === "CORE_RETAINER" ? "Core Retainer" : pkg.category === "SPECIALIZED_RETAINER" ? "Specialized Service" : "Development",
    defaultPrice: pkg.price,
    cadence: pkg.cadence,
    defaultDescription: `${pkg.name} — ${pkg.deliverables.slice(0, 3).join("; ")}.`,
  })),
  ...ADD_ON_SERVICES.map((addon) => ({
    id: addon.id,
    name: addon.name,
    category: "Add-On Service",
    defaultPrice: addon.price,
    cadence: addon.pricingType === "MONTHLY_RECURRING" ? "per month" : "one-time",
    defaultDescription: `${addon.name} — ${addon.deliverablesSummary}`,
  })),
  {
    id: "custom-agency-deliverable",
    name: "Custom Agency Deliverable / Retainer",
    category: "Custom",
    defaultPrice: 25000,
    cadence: "flexible",
    defaultDescription: "Custom strategic marketing consultation and creative production deliverable.",
  },
];

// ---------------------------------------------------------------------------
// 4. Utility Functions
// ---------------------------------------------------------------------------
export function getPackageById(id: string): ServicePackage | undefined {
  return SERVICE_PACKAGES.find((p) => p.id === id);
}

export function getPackageByName(name?: string | null): ServicePackage | undefined {
  if (!name) return undefined;
  const lower = name.toLowerCase().trim();
  return SERVICE_PACKAGES.find(
    (p) =>
      p.name.toLowerCase() === lower ||
      p.id.toLowerCase() === lower ||
      lower.includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(lower)
  );
}

export function calculatePackageProfitability(
  monthlyRetainer: number,
  deliveryCost?: number | null
): {
  deliveryCost: number;
  netProfit: number;
  grossMarginPercent: number;
  profitRating: "HIGH" | "HEALTHY" | "MODERATE" | "LOW" | "UNDERPRICED";
} {
  const cost = deliveryCost !== undefined && deliveryCost !== null && Number(deliveryCost) > 0
    ? Number(deliveryCost)
    : Math.round(monthlyRetainer * 0.3); // default ~30% cost ratio if not explicitly specified

  const netProfit = monthlyRetainer - cost;
  const grossMarginPercent = monthlyRetainer > 0 ? Math.round((netProfit / monthlyRetainer) * 1000) / 10 : 0;

  let profitRating: "HIGH" | "HEALTHY" | "MODERATE" | "LOW" | "UNDERPRICED" = "HEALTHY";
  if (grossMarginPercent >= 75) profitRating = "HIGH";
  else if (grossMarginPercent >= 65) profitRating = "HEALTHY";
  else if (grossMarginPercent >= 50) profitRating = "MODERATE";
  else if (grossMarginPercent >= 30) profitRating = "LOW";
  else profitRating = "UNDERPRICED";

  return {
    deliveryCost: cost,
    netProfit,
    grossMarginPercent,
    profitRating,
  };
}
