export interface MarketCatalogItem {
  name: string;
  sku: string;
  description: string;
  unitPrice: number;
  currency: string;
  category: "FREE_LEAD_MAGNET" | "ONE_TIME_SETUP" | "MONTHLY_RETAINER" | "ENTERPRISE";
  pricingType: "FREE" | "PAID";
}

export const GOODWIN_GROW_AI_CATALOG: MarketCatalogItem[] = [
  // ==========================================
  // FREE / COMPLIMENTARY SERVICES (₹0)
  // Market-standard lead magnets to acquire enterprise & mid-market clients
  // ==========================================
  {
    name: "Free AI Website & SEO Performance Audit",
    sku: "GGA-FREE-SEO",
    description: "Comprehensive 25-point audit of search engine crawlability, Core Web Vitals, organic keyword ranking gaps, and schema markup.",
    unitPrice: 0,
    currency: "INR",
    category: "FREE_LEAD_MAGNET",
    pricingType: "FREE",
  },
  {
    name: "Free Meta & Google Ads Health Check & CAC Benchmark",
    sku: "GGA-FREE-ADS",
    description: "Account health diagnosis measuring ROAS leakage, cost-per-acquisition (CAC) benchmarks against industry peers, and creative fatigue.",
    unitPrice: 0,
    currency: "INR",
    category: "FREE_LEAD_MAGNET",
    pricingType: "FREE",
  },
  {
    name: "Free MarTech Funnel & CRO Conversion Drop-Off Diagnosis",
    sku: "GGA-FREE-CRO",
    description: "Heatmap evaluation, conversion drop-off analysis, pixel tracking verification, and mobile user checkout bottleneck identification.",
    unitPrice: 0,
    currency: "INR",
    category: "FREE_LEAD_MAGNET",
    pricingType: "FREE",
  },
  {
    name: "Free Competitor Creative Intelligence & Hook Benchmark",
    sku: "GGA-FREE-COMPETITOR",
    description: "Deep dive into top 5 industry competitors' top-performing creatives, ad copy frameworks, offers, and visual positioning.",
    unitPrice: 0,
    currency: "INR",
    category: "FREE_LEAD_MAGNET",
    pricingType: "FREE",
  },
  {
    name: "Free 30-Minute AI Growth Architecture Consultation",
    sku: "GGA-FREE-CONSULT",
    description: "Executive 1-on-1 strategy session with Agency Director Aarav Singhania to model customer acquisition economics & 90-day scale roadmap.",
    unitPrice: 0,
    currency: "INR",
    category: "FREE_LEAD_MAGNET",
    pricingType: "FREE",
  },

  // ==========================================
  // MODULAR ONE-TIME IMPLEMENTATIONS (PAID)
  // Entry & core implementation packages
  // ==========================================
  {
    name: "AI Lead Scraping & Automated Outbound Engine Setup",
    sku: "GGA-AI-AUTO",
    description: "Automated B2B lead enrichment pipeline, AI email warmup sequencing, CRM integration, and multichannel sales outreach.",
    unitPrice: 25000,
    currency: "INR",
    category: "ONE_TIME_SETUP",
    pricingType: "PAID",
  },
  {
    name: "WhatsApp Business API & Autonomous Drip Journey Integration",
    sku: "GGA-WA-BOT",
    description: "Official Meta Cloud WhatsApp API setup with verified green tick submission, automated customer nurture drips, and CRM live sync.",
    unitPrice: 20000,
    currency: "INR",
    category: "ONE_TIME_SETUP",
    pricingType: "PAID",
  },
  {
    name: "High-Converting Next.js Landing Page & Funnel Engineering",
    sku: "GGA-FUNNEL-CRO",
    description: "Sub-second load speed, mobile-first CRO landing page with Razorpay/Stripe checkout, GA4 event tracking, and A/B test variations.",
    unitPrice: 35000,
    currency: "INR",
    category: "ONE_TIME_SETUP",
    pricingType: "PAID",
  },
  {
    name: "Brand Identity, Typography & Reusable Social Creative Kit",
    sku: "GGA-BRAND-KIT",
    description: "Brand guidelines, design tokens, typography scale, vector master assets, and 30 editable Canva/Figma high-converting templates.",
    unitPrice: 30000,
    currency: "INR",
    category: "ONE_TIME_SETUP",
    pricingType: "PAID",
  },

  // ==========================================
  // MONTHLY RECURRING GROWTH RETAINERS (PAID)
  // Ongoing multi-channel growth management
  // ==========================================
  {
    name: "Social Media Engine: 12 Creatives + 4 Video Reels Retainer",
    sku: "GGA-RETAINER-STARTER",
    description: "Monthly content calendar, 12 graphic creatives, 4 short-form video reels/shorts, copywriting, scheduling, and community engagement.",
    unitPrice: 45000,
    currency: "INR",
    category: "MONTHLY_RETAINER",
    pricingType: "PAID",
  },
  {
    name: "Performance Marketing: Meta & Google Ads Media Buying Retainer",
    sku: "GGA-RETAINER-ADS",
    description: "Active campaign management across Meta (FB/IG) and Google Ads, audience testing, negative keyword optimization, and weekly ROAS reporting.",
    unitPrice: 75000,
    currency: "INR",
    category: "MONTHLY_RETAINER",
    pricingType: "PAID",
  },
  {
    name: "Omnichannel Growth Retainer (Paid Ads + SEO + Creative Production)",
    sku: "GGA-RETAINER-OMNI",
    description: "Complete full-funnel growth service: performance ad management, technical on-page SEO, 16 monthly custom creatives, and bi-weekly sprint reviews.",
    unitPrice: 125000,
    currency: "INR",
    category: "MONTHLY_RETAINER",
    pricingType: "PAID",
  },
  {
    name: "Enterprise Hyper-Growth & Media Buying Retainer (₹10L+ Ad Spend)",
    sku: "GGA-PERF-MKTG",
    description: "Dedicated media buying team for scale-up brands managing ₹10L+ monthly spends, algorithmic bid management, conversion API (CAPI), and fractional CMO advisory.",
    unitPrice: 280000,
    currency: "INR",
    category: "ENTERPRISE",
    pricingType: "PAID",
  },
  {
    name: "Enterprise AI Autonomous Agent & MarTech Conversational Retainer",
    sku: "GGA-AI-AGENT-MARTECH",
    description: "Deployment of custom LLM customer support & sales agents, voice triage automation, webhook ERP synchronization, and ongoing prompt fine-tuning.",
    unitPrice: 350000,
    currency: "INR",
    category: "ENTERPRISE",
    pricingType: "PAID",
  },
  {
    name: "Enterprise Digital Transformation & Brand Social Listening",
    sku: "GGA-ENT-STRATEGY",
    description: "Real-time sentiment monitoring, crisis mitigation, digital footprint modernization, and executive leadership personal branding.",
    unitPrice: 375000,
    currency: "INR",
    category: "ENTERPRISE",
    pricingType: "PAID",
  },
  {
    name: "Bharat Vernacular & Regional Influencer Creator Engine",
    sku: "GGA-VERNACULAR-INF",
    description: "Influencer marketing across 6 Indian regional languages, contract management, creator brief orchestration, and localized conversion tracking.",
    unitPrice: 550000,
    currency: "INR",
    category: "ENTERPRISE",
    pricingType: "PAID",
  },
  {
    name: "Custom MarTech Architecture & Enterprise Web Engineering",
    sku: "GGA-TECH-MARTECH",
    description: "Full-stack enterprise application engineering, cloud microservices architecture, CRM bidirectional sync, and custom client portal development.",
    unitPrice: 750000,
    currency: "INR",
    category: "ENTERPRISE",
    pricingType: "PAID",
  },
];

