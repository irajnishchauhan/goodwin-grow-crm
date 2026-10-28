import { PrismaClient, ClientStatus, InvoiceStatus } from "@prisma/client";
import { SERVICE_PACKAGES, ADD_ON_SERVICES } from "../src/lib/agency/packages";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Seeding Enhanced Agency Clients with Standardized Packages, Contracts, and Confidential Notes...");

  const tenant = await prisma.tenant.findUnique({
    where: { code: "goodwin-grow-ai" },
    include: {
      memberships: {
        include: { user: true },
      },
    },
  });

  if (!tenant) {
    throw new Error("Tenant goodwin-grow-ai not found.");
  }

  const tenantId = tenant.id;

  // Genuine team members
  const ansh = tenant.memberships.find((m) => m.user.email === "goodwingrow.ansh@gmail.com")?.user;
  const sameer = tenant.memberships.find((m) => m.user.email === "sameer@goodwingrowai.com")?.user;
  const kunal = tenant.memberships.find((m) => m.user.email === "kunalgoodwingrow@gmail.com")?.user;
  const aayan = tenant.memberships.find((m) => m.user.email === "aayan@goodwingrowai.com")?.user;
  const superadmin = tenant.memberships.find((m) => m.user.email === "superadmin@goodwingrowai.com")?.user;

  const defaultAdmin = superadmin || ansh;
  if (!defaultAdmin) {
    throw new Error("No admin user found to author notes.");
  }

  const now = new Date();

  // 1. Clean existing agency clients safely
  const existingClients = await prisma.agencyClient.findMany({ where: { tenantId } });
  for (const c of existingClients) {
    await prisma.agencyClientNote.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.agencyInvoice.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.agencyExpense.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.agencyTask.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.agencyProject.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.contentPost.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.creativeAsset.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.adCampaign.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.seoTracker.deleteMany({ where: { clientId: c.id } }).catch(() => {});
    await prisma.agencyClient.delete({ where: { id: c.id } }).catch(() => {});
  }

  console.log("Cleared old records for clean seed.");

  // 2. Client specifications
  const clientSeedList = [
    {
      name: "Sapna Washing Point",
      brandName: "Sapna Detailing & Car Spa",
      industry: "Automotive Detailing & Car Care",
      website: "https://sapnawashing.in",
      phone: "+91 98930 11223",
      email: "contact@sapnawashing.in",
      city: "Indore",
      state: "Madhya Pradesh",
      activePackage: "Growth Retainer (Social + Local SEO)",
      monthlyRetainer: 50000.0,
      estimatedDeliveryCost: 15000.0,
      billingCycle: "MONTHLY",
      packageStatus: "ACTIVE",
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 12,
      postsCompleted: 9,
      accountManagerId: ansh?.id || defaultAdmin.id,
      accountManagerName: "Ansh Chourasiya",
      contractStartDate: new Date("2026-01-01"),
      contractRenewalDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // Renews in 21 days!
      contractEndDate: new Date("2026-12-31"),
      addOnServices: [
        {
          id: "addon-whatsapp-crm",
          name: "WhatsApp CRM & Chatbot Automation Setup",
          price: 15000,
        },
      ],
      brandGuidelines: "Deep Navy (#0F172A) & Cyan (#06B6D4). Font: Montserrat. Focus on ceramic coating, customer before/after video reels.",
      notes: [
        {
          title: "Initial Client Onboarding & Requirements Specification",
          category: "REQUIREMENT",
          isConfidential: true,
          content: "Client requires 12 Instagram Reels per month focused on high-end luxury car foam washing and ceramic coatings in Indore. Target 50+ inbound customer WhatsApp queries weekly with Google Business Profile local rank 1 in Vijay Nagar area.",
        },
        {
          title: "Quarterly Strategy Review & Ad Spend Reallocation",
          category: "STRATEGY",
          isConfidential: true,
          content: "Shifting 30% of paid ad budget to Instagram Reel Boosts targeting vehicle owners within a 7km radius. Local SEO citations updated on Justdial and Sulekha.",
        },
        {
          title: "Monthly Progress Sync with Owner Mr. Rajesh",
          category: "MEETING_NOTE",
          isConfidential: true,
          content: "Meeting held on 18th Oct. Client very pleased with 28% increase in weekend detailing footfall. Requested additional weekend shoot for festival ceramic packages.",
        },
        {
          title: "Renewal Discussion & Add-on Upsell Follow-up",
          category: "FOLLOW_UP",
          isConfidential: true,
          content: "Contract renewal due in 21 days. Pitch the Vernacular Video add-on (+₹12,000/mo) and extend contract by 12 months with a 5% prepayment incentive.",
        },
      ],
    },
    {
      name: "Maa Amba Foam & Furnishing",
      brandName: "Amba Living & Luxury Mattresses",
      industry: "Home Decor & Furniture Retail",
      website: "https://maaambafurnishing.com",
      phone: "+91 98260 44556",
      email: "care@maaambafurnishing.com",
      city: "Bhopal",
      state: "Madhya Pradesh",
      activePackage: "Enterprise Creative & Meta Ads Retainer",
      monthlyRetainer: 100000.0,
      estimatedDeliveryCost: 28000.0,
      billingCycle: "MONTHLY",
      packageStatus: "ACTIVE",
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 20,
      postsCompleted: 15,
      accountManagerId: sameer?.id || defaultAdmin.id,
      accountManagerName: "Sameer Meena",
      contractStartDate: new Date("2026-02-01"),
      contractRenewalDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000),
      contractEndDate: new Date("2027-01-31"),
      addOnServices: [
        {
          id: "addon-shoot-day",
          name: "Extra Reels & On-Site Product Shoot Day",
          price: 20000,
        },
      ],
      brandGuidelines: "Warm Terracotta (#C2410C) and Champagne Beige (#F5F5F4). Typography: Playfair Display. Orthopaedic mattresses and luxury recliners.",
      notes: [
        {
          title: "Festive Wedding Trousseau Campaign Brief",
          category: "REQUIREMENT",
          isConfidential: true,
          content: "Client requested dedicated 20-asset creative set for upcoming wedding season. Emphasize customized teakwood beds, orthopaedic zero-gravity mattresses, and interior consultation.",
        },
        {
          title: "Creative Pod Strategy & Meta Conversion API Review",
          category: "STRATEGY",
          isConfidential: true,
          content: "Meta Ads ROAS achieved 4.2x in Bhopal-Indore belt. Recommended setting up automated WhatsApp catalog checkout to capture leads immediately after 8 PM store closure.",
        },
        {
          title: "Follow-up: Showroom Video Shoot Confirmation",
          category: "FOLLOW_UP",
          isConfidential: true,
          content: "Confirmed 4K camera crew visit for Saturday morning 10 AM. Client has prepped the bridal bedroom mock-up setup.",
        },
      ],
    },
    {
      name: "ZestPure Omnichannel D2C Nutrition",
      brandName: "ZestPure Wellness",
      industry: "D2C Health, Supplements & FMCG",
      website: "https://zestpurewellness.in",
      phone: "+91 98111 55667",
      email: "partnerships@zestpurewellness.in",
      city: "Mumbai",
      state: "Maharashtra",
      activePackage: "Goodwin Hyper-Growth Performance Retainer",
      monthlyRetainer: 280000.0,
      estimatedDeliveryCost: 65000.0,
      billingCycle: "MONTHLY",
      packageStatus: "ACTIVE",
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 25,
      postsCompleted: 21,
      accountManagerId: kunal?.id || defaultAdmin.id,
      accountManagerName: "Kunal Sen",
      contractStartDate: new Date("2025-10-01"),
      contractRenewalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Renews in 14 days!
      contractEndDate: new Date("2026-10-31"),
      addOnServices: [
        {
          id: "addon-influencer-whitelisting",
          name: "Influencer Seeding & Whitelisting Setup",
          price: 25000,
        },
        {
          id: "addon-landing-page",
          name: "Custom High-Converting Landing Page",
          price: 18000,
        },
      ],
      brandGuidelines: "Emerald Vitality (#059669) & Solar Yellow (#FBBF24). Modern Sans font. Science-backed clean plant protein.",
      notes: [
        {
          title: "Performance Retainer Renewal Terms & Q4 ROAS Review",
          category: "IMPORTANT_INFO",
          isConfidential: true,
          content: "Contract renews in 14 days. Current blended ROAS across Google PMax and Meta is 3.85x against target 3.5x. Founder Ananya is requesting a proposal to expand media buying into UAE / GCC markets.",
        },
        {
          title: "Influencer Whitelisting Scaling Roadmap",
          category: "STRATEGY",
          isConfidential: true,
          content: "Whitelisted 5 fitness creators with dark posting on Instagram. Cost per acquisition decreased by 22% compared to standard brand handle ads.",
        },
      ],
    },
    {
      name: "Horizon Ortho & Spine Clinic",
      brandName: "Horizon Spine Care",
      industry: "Healthcare & Specialized Clinics",
      website: "https://horizonspinecare.com",
      phone: "+91 97722 33445",
      email: "director@horizonspinecare.com",
      city: "Jaipur",
      state: "Rajasthan",
      activePackage: "SEO & Organic Growth Retainer",
      monthlyRetainer: 35000.0,
      estimatedDeliveryCost: 10500.0,
      billingCycle: "MONTHLY",
      packageStatus: "ACTIVE",
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 4,
      postsCompleted: 4,
      accountManagerId: aayan?.id || defaultAdmin.id,
      accountManagerName: "Aayan Andani",
      contractStartDate: new Date("2026-03-01"),
      contractRenewalDate: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
      contractEndDate: new Date("2026-09-01"),
      addOnServices: [],
      brandGuidelines: "Clinical Blue (#0284C7) and Clean White. High authority medical diagrams and doctor patient testimonial videos.",
      notes: [
        {
          title: "Technical SEO Audit & Doctor Bio Schema Integration",
          category: "REQUIREMENT",
          isConfidential: true,
          content: "Completed audit of 45 URLs. Implemented MedicalWebPage and Physician schema markup. Fixed 14 crawl errors and submitted new sitemap.",
        },
        {
          title: "Keyword Ranking Milestone: Top 3 for 'Robotic Knee Replacement Jaipur'",
          category: "STRATEGY",
          isConfidential: true,
          content: "Target keyword moved from page 4 to Google top 3 in Map Pack. Monthly organic appointment bookings rose from 12 to 38.",
        },
      ],
    },
    {
      name: "BharatFin Digital Credit Network",
      brandName: "BharatFin Enterprise",
      industry: "Fintech & MSME Lending",
      website: "https://bharatfincredit.in",
      phone: "+91 99000 88776",
      email: "marketing@bharatfincredit.in",
      city: "Bengaluru",
      state: "Karnataka",
      activePackage: "360° Corporate Brand Experience & Vernacular Engine",
      monthlyRetainer: 450000.0,
      estimatedDeliveryCost: 95000.0,
      billingCycle: "QUARTERLY",
      packageStatus: "ACTIVE",
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 30,
      postsCompleted: 24,
      accountManagerId: ansh?.id || defaultAdmin.id,
      accountManagerName: "Ansh Chourasiya",
      contractStartDate: new Date("2025-11-01"),
      contractRenewalDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      contractEndDate: new Date("2026-11-01"),
      addOnServices: [
        {
          id: "addon-vernacular-localization",
          name: "Regional Vernacular Localization",
          price: 12000,
        },
        {
          id: "addon-crisis-orm",
          name: "Crisis PR & 24/7 Social Listening",
          price: 30000,
        },
      ],
      brandGuidelines: "Navy (#1E3A8A) & Saffron (#EA580C). Multilingual brand guidelines across English, Hindi, and Kannada.",
      notes: [
        {
          title: "Executive MSA Contract Notes & Enterprise Governance",
          category: "IMPORTANT_INFO",
          isConfidential: true,
          content: "Enterprise agreement includes dedicated pod of 5 specialists. NDA signed. Quarterly invoice of ₹13,50,000 + GST settled via NEFT transfer.",
        },
        {
          title: "Crisis PR SOP & App Review Escalation Channel",
          category: "STRATEGY",
          isConfidential: true,
          content: "Monitored 2,400 app reviews on Google Play. Negative credit rejection sentiment mitigated with automated polite financial literacy messages.",
        },
      ],
    },
    {
      name: "Luxuria Jewels & Bridal Studio",
      brandName: "Luxuria Polki & Diamond",
      industry: "Luxury Jewelry & Bridal Retail",
      website: "https://luxuriajewels.co.in",
      phone: "+91 98333 44556",
      email: "concierge@luxuriajewels.co.in",
      city: "Ahmedabad",
      state: "Gujarat",
      activePackage: "Social Media Management Only",
      monthlyRetainer: 30000.0,
      estimatedDeliveryCost: 9000.0,
      billingCycle: "MONTHLY",
      packageStatus: "ACTIVE",
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 16,
      postsCompleted: 14,
      accountManagerId: sameer?.id || defaultAdmin.id,
      accountManagerName: "Sameer Meena",
      contractStartDate: new Date("2026-03-15"),
      contractRenewalDate: new Date(Date.now() + 38 * 24 * 60 * 60 * 1000),
      contractEndDate: new Date("2026-09-15"),
      addOnServices: [],
      brandGuidelines: "Champagne Gold (#D97706) & Velvet Black (#09090B). High-clarity macro jewelry photography.",
      notes: [
        {
          title: "Social Media Grid Aesthetic & Reels Brief",
          category: "REQUIREMENT",
          isConfidential: true,
          content: "16 static posts & 8 reels per month. High aesthetic 3-grid look on Instagram showing polki necklaces on model necklines.",
        },
      ],
    },
    {
      name: "Apex Corporate Legal Chambers",
      brandName: "Apex Law Partners",
      industry: "Legal & Corporate Advisory",
      website: "https://apexlegalpartners.com",
      phone: "+91 98222 11009",
      email: "partners@apexlegalpartners.com",
      city: "New Delhi",
      state: "Delhi",
      activePackage: "Performance Marketing — Ads Management Only",
      monthlyRetainer: 45000.0,
      estimatedDeliveryCost: 12000.0,
      billingCycle: "MONTHLY",
      packageStatus: "ACTIVE",
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 0,
      postsCompleted: 0,
      accountManagerId: kunal?.id || defaultAdmin.id,
      accountManagerName: "Kunal Sen",
      contractStartDate: new Date("2026-02-15"),
      contractRenewalDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // Renews in 5 days!
      contractEndDate: new Date("2026-08-15"),
      addOnServices: [],
      brandGuidelines: "Strict Bar Council compliance. High-intent Google Search ads only on M&A, Intellectual Property, and Cross-Border taxation.",
      notes: [
        {
          title: "Google Ads Compliance Check & Search Term Filtering",
          category: "STRATEGY",
          isConfidential: true,
          content: "Strict negative keyword list added to prevent consumer litigation or traffic court search clicks. Cost per qualified corporate enquiry reduced to ₹1,450.",
        },
      ],
    },
    {
      name: "QuickBite Cloud Kitchens Network",
      brandName: "QuickBite Gourmet Express",
      industry: "Food & Beverage / Cloud Kitchens",
      website: "https://quickbiteexpress.in",
      phone: "+91 97111 88990",
      email: "hello@quickbiteexpress.in",
      city: "Gurugram",
      state: "Haryana",
      activePackage: "Website Design & Development",
      monthlyRetainer: 75000.0,
      estimatedDeliveryCost: 22000.0,
      billingCycle: "QUARTERLY",
      packageStatus: "ONBOARDING",
      status: ClientStatus.ONBOARDING,
      onboardingProgress: 65,
      postsPlanned: 0,
      postsCompleted: 0,
      accountManagerId: aayan?.id || defaultAdmin.id,
      accountManagerName: "Aayan Andani",
      contractStartDate: new Date("2026-04-01"),
      contractRenewalDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      contractEndDate: new Date("2026-07-01"),
      addOnServices: [
        {
          id: "addon-landing-page",
          name: "Custom High-Converting Landing Page",
          price: 18000,
        },
      ],
      brandGuidelines: "Fire Orange (#EA580C) and Charcoal. Direct online ordering menu integration.",
      notes: [
        {
          title: "Next.js Direct Ordering Website Deliverable Scope",
          category: "REQUIREMENT",
          isConfidential: true,
          content: "Figma prototype signed off on 22nd Oct. Phase 2 development in progress with Razorpay gateway integration and WhatsApp delivery alerts.",
        },
      ],
    },
  ];

  for (const cData of clientSeedList) {
    const { notes, ...clientFields } = cData;

    const createdClient = await prisma.agencyClient.create({
      data: {
        tenantId,
        ...clientFields,
      },
    });

    console.log(`✅ Seeded Client: ${createdClient.name} (${createdClient.activePackage})`);

    // Add confidential notes for this client
    for (const n of notes) {
      await prisma.agencyClientNote.create({
        data: {
          tenantId,
          clientId: createdClient.id,
          title: n.title,
          category: n.category as any,
          content: n.content,
          isConfidential: n.isConfidential,
          createdById: defaultAdmin.id,
        },
      });
    }

    // Seed realistic invoices for payment tracking
    const invNum = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const isOverdue = cData.name.includes("Apex");
    const isPaid = !isOverdue;

    await prisma.agencyInvoice.create({
      data: {
        tenantId,
        clientId: createdClient.id,
        invoiceNumber: invNum,
        issueDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
        dueDate: isOverdue ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        subtotal: cData.monthlyRetainer,
        taxAmount: cData.monthlyRetainer * 0.18,
        totalAmount: cData.monthlyRetainer * 1.18,
        status: isOverdue ? InvoiceStatus.OVERDUE : InvoiceStatus.PAID,
        paymentMethod: isPaid ? "NEFT / Direct Bank" : null,
        paidAt: isPaid ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) : null,
        items: [
          {
            description: `${cData.activePackage} - Retainer Service`,
            quantity: 1,
            rate: cData.monthlyRetainer,
            amount: cData.monthlyRetainer,
          },
        ],
      },
    });
  }

  console.log("🎉 Successfully seeded 8 high-fidelity agency clients with standardized packages, contracts, notes, and payment history!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
