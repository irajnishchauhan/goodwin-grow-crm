export interface ServicePackage {
  id: string;
  name: string;
  category: "CORE_RETAINER" | "SPECIALIZED_RETAINER" | "DEVELOPMENT" | "ENTERPRISE";
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
// 1. Standardized 5 Core Retainer Packages + 5 New Demand-Driven Retainers
// ---------------------------------------------------------------------------
export const SERVICE_PACKAGES: ServicePackage[] = [
  // --- 5 STANDARDIZED EXISTING PACKAGES ---
  {
    id: "starter-presence",
    name: "Starter Digital Presence & Local Leads",
    category: "CORE_RETAINER",
    price: 25000,
    cadence: "per month",
    defaultPostsPlanned: 8,
    estimatedDeliveryCost: 8500,
    targetGrossMarginPercent: 66.0,
    contractTerms: {
      minCommitmentMonths: 3,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "3-Month Minimum Commitment • 30-Day Written Notice • Billed Monthly in Advance",
    },
    deliverables: [
      "8 Social Media Posts & Custom Creatives",
      "Google Business Profile (GBP) Local SEO Ranking",
      "Monthly Customer Review Management & Citation Updates",
      "Dedicated Account Executive & WhatsApp Support Group",
    ],
    description: "Designed for local businesses, clinics, and retail stores establishing consistent local footfall and social authority.",
  },
  {
    id: "growth-retainer",
    name: "Growth Retainer (Social + Local SEO)",
    category: "CORE_RETAINER",
    price: 50000,
    cadence: "per month",
    defaultPostsPlanned: 12,
    estimatedDeliveryCost: 15000,
    targetGrossMarginPercent: 70.0,
    isPopular: true,
    contractTerms: {
      minCommitmentMonths: 6,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "6-Month Minimum Commitment • 30-Day Written Notice • Quarterly Strategic Review",
    },
    deliverables: [
      "12 High-Impact Instagram/FB Reels & Carousels",
      "Complete Local SEO Keyword Optimization (Target Top 3 Google Map Pack)",
      "Meta Lead Ads WhatsApp Funnel Setup & Basic Optimization",
      "Bi-weekly Strategy & Deliverables Review Call",
      "Dedicated Account Manager & Graphic Designer Pod",
    ],
    description: "Ideal for fast-scaling local service businesses, auto care spas, salons, and regional retailers.",
  },
  {
    id: "enterprise-creative-ads",
    name: "Enterprise Creative & Meta Ads Retainer",
    category: "CORE_RETAINER",
    price: 100000,
    cadence: "per month",
    defaultPostsPlanned: 20,
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
      "20 High-Converting Brand Assets, 4K Video Ads & Product Shoots",
      "End-to-End Meta Ads Funnel (Instant Forms, Landing Pages & WhatsApp)",
      "Custom Creative Review & Approval Dashboard (Unlimited Revisions)",
      "Dedicated Creative Director, Senior Copywriter & Paid Media Buyer",
      "Monthly Competitor Benchmarking & Creative Velocity Report",
    ],
    description: "Full creative pod with senior visualizers, copywriters, and paid media campaign management.",
  },
  {
    id: "hyper-growth-performance",
    name: "Goodwin Hyper-Growth Performance Retainer",
    category: "CORE_RETAINER",
    price: 280000,
    cadence: "per month",
    defaultPostsPlanned: 25,
    estimatedDeliveryCost: 65000,
    targetGrossMarginPercent: 76.8,
    contractTerms: {
      minCommitmentMonths: 6,
      noticePeriodDays: 45,
      billingFrequency: "MONTHLY",
      paymentDueDay: 1,
      summary: "6-Month Agreement • Monthly ROAS True-Up • Dedicated Multi-Channel Performance Pod",
    },
    deliverables: [
      "25+ Dynamic Video Ad Variations & High-Converting Landing Pages",
      "Google Search, Performance Max, YouTube & Meta Multi-Channel Media Buying",
      "Server-Side Conversions API (CAPI) & ROAS Optimization",
      "Guaranteed 3.5x+ ROAS Framework for E-commerce & Direct Response",
      "Real-time Looker Studio Executive Dashboard & Weekly Sprints",
    ],
    description: "ROI-driven multi-channel media buying across Meta, Google Ads, YouTube, and programmatic networks.",
  },
  {
    id: "corporate-360-vernacular",
    name: "360° Corporate Brand Experience & Vernacular Engine",
    category: "CORE_RETAINER",
    price: 450000,
    cadence: "per month",
    defaultPostsPlanned: 30,
    estimatedDeliveryCost: 95000,
    targetGrossMarginPercent: 78.9,
    contractTerms: {
      minCommitmentMonths: 12,
      noticePeriodDays: 60,
      billingFrequency: "QUARTERLY",
      paymentDueDay: 1,
      summary: "12-Month Annual Enterprise Master Services Agreement (MSA) • 5-Specialist Pod • SLA Guarantee",
    },
    deliverables: [
      "30+ Multi-Format Content Assets (Reels, Long-Form Thought Leadership, Tech Blogs)",
      "Regional Vernacular Influencers & Localization (Hindi, Tamil, Marathi)",
      "24/7 Social Listening & Crisis Online Reputation Management (ORM)",
      "Executive On-Site Strategy Workshops & C-Suite Performance Reviews",
      "Full IP Handover of All Creative Raw Footage and Vector Files",
    ],
    description: "Enterprise tier for national brands, fintechs, and venture-backed startups scaling across Tier 1 to Tier 3 India.",
  },

  // --- 5 NEW DEMAND-DRIVEN SERVICE PACKAGES ---
  {
    id: "seo-organic-growth",
    name: "SEO & Organic Growth Retainer",
    category: "SPECIALIZED_RETAINER",
    price: 35000,
    cadence: "per month",
    defaultPostsPlanned: 4,
    estimatedDeliveryCost: 10500,
    targetGrossMarginPercent: 70.0,
    contractTerms: {
      minCommitmentMonths: 6,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "6-Month Minimum Commitment (SEO Indexation Ramp-up) • Monthly Technical Audit",
    },
    deliverables: [
      "In-depth Technical SEO Audit, Core Web Vitals & Schema Markup Remediation",
      "4 Pillar SEO Blog Articles & Keyword Gap Content Generation/Month",
      "High-Authority Backlink Acquisition & Digital PR Outreach (4 DA 40+ Links/Mo)",
      "Google Search Console & Rank Tracking Dashboard (Top 50 Focus Keywords)",
      "Monthly Organic Traffic, Keyword Movements & Conversion Report",
    ],
    description: "Dominant organic search ranking for brands seeking long-term compounding search traffic without constant ad spend.",
  },
  {
    id: "performance-ads-only",
    name: "Performance Marketing — Ads Management Only",
    category: "SPECIALIZED_RETAINER",
    price: 45000,
    cadence: "per month",
    defaultPostsPlanned: 0,
    estimatedDeliveryCost: 12000,
    targetGrossMarginPercent: 73.3,
    contractTerms: {
      minCommitmentMonths: 3,
      noticePeriodDays: 15,
      billingFrequency: "MONTHLY",
      paymentDueDay: 1,
      summary: "3-Month Commitment • Ad Spend Funded Directly by Client Card • 15-Day Renewal Notice",
    },
    deliverables: [
      "Meta Ads & Google Ads Account Architecture Setup & Daily Media Buying",
      "Continuous A/B Audience Segmentation & Creative Testing Matrix",
      "Conversion Tracking Verification (GA4, Meta Pixel, GTM, Server-side CAPI)",
      "Weekly ROAS Optimization & Cost-Per-Lead (CPL) Minimization",
      "Ad Spend Scaling Strategy (from ₹50K to ₹10L+ monthly ad budgets)",
    ],
    description: "Pure performance media buying for clients who supply their own creative assets and require surgical ad spend optimization.",
  },
  {
    id: "social-media-only",
    name: "Social Media Management Only",
    category: "SPECIALIZED_RETAINER",
    price: 30000,
    cadence: "per month",
    defaultPostsPlanned: 16,
    estimatedDeliveryCost: 9000,
    targetGrossMarginPercent: 70.0,
    contractTerms: {
      minCommitmentMonths: 3,
      noticePeriodDays: 30,
      billingFrequency: "MONTHLY",
      paymentDueDay: 5,
      summary: "3-Month Commitment • Monthly Content Calendar Approval by 25th • 30-Day Notice",
    },
    deliverables: [
      "16 Static & Carousel Posts + 8 Engaging Interactive Stories Per Month",
      "Active Daily Community Management & DM Response Framework",
      "Trending Audio, Trend Hijacking & Hashtag Cluster Optimization",
      "Monthly Follower Growth, Profile Impressions & Engagement Analytics Report",
      "Covers Instagram, LinkedIn, Facebook, and X (Twitter)",
    ],
    description: "Dedicated organic social media voice and visual aesthetics for consumer brands and founders.",
  },
  {
    id: "website-design-dev",
    name: "Website Design & Development",
    category: "DEVELOPMENT",
    price: 75000,
    cadence: "one-time / project",
    defaultPostsPlanned: 0,
    estimatedDeliveryCost: 22000,
    targetGrossMarginPercent: 70.7,
    contractTerms: {
      minCommitmentMonths: 1,
      noticePeriodDays: 14,
      billingFrequency: "MILESTONE",
      paymentDueDay: 1,
      summary: "Milestone Billing (50% Advance / 25% Design Approval / 25% Final Launch) • 30 Days Free Maintenance",
    },
    deliverables: [
      "Custom UI/UX High-Fidelity Prototype (Figma) Tailored to Brand Identity",
      "Modern Responsive Web Development (Next.js / Tailwind or Premium WordPress)",
      "On-Page Technical SEO, Fast Loading Score (90+ Google Lighthouse), & Schema",
      "Lead Capture Forms, WhatsApp Click-to-Chat & CRM Webhook Integration",
      "Complete Source Code Handover, Admin Training Video & 30 Days Post-Launch Bug Warranty",
    ],
    description: "High-conversion, lightning-fast digital storefronts and marketing websites built for maximum lead generation.",
  },
  {
    id: "custom-enterprise-retainer",
    name: "Custom Enterprise Retainer",
    category: "ENTERPRISE",
    price: 150000,
    cadence: "custom / month",
    defaultPostsPlanned: 20,
    estimatedDeliveryCost: 35000,
    targetGrossMarginPercent: 76.7,
    contractTerms: {
      minCommitmentMonths: 6,
      noticePeriodDays: 60,
      billingFrequency: "MONTHLY",
      paymentDueDay: 1,
      summary: "Bespoke Master Services Agreement (MSA) • Custom Statement of Work (SOW) • Flexible Terms",
    },
    deliverables: [
      "Bespoke Omnichannel Marketing Mix Engineered to Exact Brand OKRs",
      "Dedicated Hybrid Pod (Creative Director, Copywriter, 2 Designers, Media Buyer)",
      "Custom Integrations (CRM, WhatsApp API, ERP, Custom Analytics)",
      "Quarterly On-Site Executive Strategy Sessions & Quarterly Business Reviews (QBR)",
      "Strict SLA Guarantees with Dedicated Enterprise Relationship Lead",
    ],
    description: "Tailor-made solution with customizable pricing, dedicated pods, and flexible scope for unique enterprise requirements.",
  },
];

// ---------------------------------------------------------------------------
// 2. Standardized Optional Add-on Services
// ---------------------------------------------------------------------------
export const ADD_ON_SERVICES: AddOnService[] = [
  {
    id: "addon-whatsapp-crm",
    name: "WhatsApp CRM & Chatbot Automation Setup",
    price: 15000,
    pricingType: "ONE_TIME",
    description: "Automated WhatsApp replies, catalog triggers, and instant lead notification workflows.",
    deliverablesSummary: "Meta WhatsApp Cloud API setup, 3 custom automated flow triggers, CRM lead webhook sync.",
  },
  {
    id: "addon-shoot-day",
    name: "Extra Reels & On-Site Product Shoot Day",
    price: 20000,
    pricingType: "ONE_TIME",
    description: "Full 1-day shoot with 4K camera gear, lighting setup, and director on client premises.",
    deliverablesSummary: "1 Full-day shoot (up to 8 hours), raw footage archive, 10 edited reel drafts.",
  },
  {
    id: "addon-vernacular-localization",
    name: "Regional Vernacular Localization",
    price: 12000,
    pricingType: "MONTHLY_RECURRING",
    description: "Adaptation of creatives and scripts into regional languages (Hindi, Tamil, Marathi, Telugu).",
    deliverablesSummary: "Translation & localized voiceovers for up to 12 creative assets per month.",
  },
  {
    id: "addon-influencer-whitelisting",
    name: "Influencer Seeding & Whitelisting Setup",
    price: 25000,
    pricingType: "ONE_TIME",
    description: "Coordination with niche micro-creators and Meta advertiser partnership whitelisting.",
    deliverablesSummary: "Shortlisting 10 creators, outreach negotiation, creator Meta ads access linking.",
  },
  {
    id: "addon-landing-page",
    name: "Custom High-Converting Landing Page",
    price: 18000,
    pricingType: "ONE_TIME",
    description: "Dedicated conversion-focused landing page for specific product or campaign launches.",
    deliverablesSummary: "Copywriting, responsive design, tracking pixels, speed optimization, and lead form.",
  },
  {
    id: "addon-crisis-orm",
    name: "Crisis PR & 24/7 Social Listening",
    price: 30000,
    pricingType: "MONTHLY_RECURRING",
    description: "Round-the-clock monitoring of brand mentions, sentiment tracking, and rapid response handling.",
    deliverablesSummary: "Social listening dashboard, negative review escalation SLA < 15 mins, weekly sentiment report.",
  },
];

// ---------------------------------------------------------------------------
// 3. Helper Functions
// ---------------------------------------------------------------------------
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
