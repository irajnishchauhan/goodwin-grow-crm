import { PrismaClient, ClientStatus, ProjectStatus, AgencyWorkflowStage, PostPlatform, PostStatus, CreativeReviewStatus, AdPlatform, AdStatus, InvoiceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Seeding Goodwin Grow AI Marketing Agency Operating System...");

  const tenant = await prisma.tenant.findUnique({
    where: { code: "goodwin-grow-ai" },
  });

  if (!tenant) {
    throw new Error("goodwin-grow-ai tenant not found");
  }

  const tenantId = tenant.id;

  // Clear previous agency items for idempotency
  await prisma.agencyExpense.deleteMany({ where: { tenantId } });
  await prisma.agencyInvoice.deleteMany({ where: { tenantId } });
  await prisma.seoTracker.deleteMany({ where: { tenantId } });
  await prisma.adCampaign.deleteMany({ where: { tenantId } });
  await prisma.creativeAsset.deleteMany({ where: { tenantId } });
  await prisma.contentPost.deleteMany({ where: { tenantId } });
  await prisma.agencyTask.deleteMany({ where: { tenantId } });
  await prisma.agencyProject.deleteMany({ where: { tenantId } });
  await prisma.agencyClient.deleteMany({ where: { tenantId } });

  console.log("Cleaned existing agency records for fresh seed.");

  // 1. Agency Clients
  const clientsData = [
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
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 12,
      postsCompleted: 8,
      accountManagerName: "Kunal Sharma",
      leadDesignerName: "Pooja Verma",
      contentWriterName: "Aman Gupta",
      mediaBuyerName: "Rohit Kapoor",
      brandGuidelines: "Primary colors: Deep Navy (#0F172A), Electric Cyan (#06B6D4). Fonts: Montserrat Bold & Inter. Focus on ceramic coating, foam washing videos, and customer reviews.",
      contractStartDate: new Date("2026-01-01"),
      contractRenewalDate: new Date("2026-12-31"),
    },
    {
      name: "Maa Amba Foam & Furnishing",
      brandName: "Amba Living & Mattresses",
      industry: "Home Decor & Furniture Retail",
      website: "https://maaambafurnishing.com",
      phone: "+91 98260 44556",
      email: "care@maaambafurnishing.com",
      city: "Bhopal",
      state: "Madhya Pradesh",
      activePackage: "Enterprise Creative & Meta Ads Retainer",
      monthlyRetainer: 100000.0,
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 20,
      postsCompleted: 14,
      accountManagerName: "Ansh Chourasiya",
      leadDesignerName: "Deepak Joshi",
      contentWriterName: "Sneha Sen",
      mediaBuyerName: "Rohit Kapoor",
      brandGuidelines: "Warm Terracotta (#C2410C), Champagne Beige (#F5F5F4). Typography: Playfair Display + Lato. Emphasis on orthopaedic mattresses, custom sectional sofas, and wedding trousseau decor.",
      contractStartDate: new Date("2026-02-01"),
      contractRenewalDate: new Date("2027-01-31"),
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
      activePackage: "Hyper-Growth Performance Retainer (Meta + Google)",
      monthlyRetainer: 280000.0,
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 25,
      postsCompleted: 19,
      accountManagerName: "Rohit Kapoor",
      leadDesignerName: "Pooja Verma",
      contentWriterName: "Aman Gupta",
      mediaBuyerName: "Vikram Malhotra",
      brandGuidelines: "Emerald Vitality (#059669), Solar Yellow (#FBBF24). Modern sans-serif: Plus Jakarta Sans. Science-backed plant protein, immunity effervescents, clean label messaging.",
      contractStartDate: new Date("2025-10-01"),
      contractRenewalDate: new Date("2026-09-30"),
    },
    {
      name: "FinEdge Neo-Banking & Wealth Technologies",
      brandName: "FinEdge App",
      industry: "FinTech & Wealth Management",
      website: "https://finedgewealth.com",
      phone: "+91 98222 66778",
      email: "growth@finedgewealth.com",
      city: "Bengaluru",
      state: "Karnataka",
      activePackage: "360° Corporate Brand Experience & Influencers",
      monthlyRetainer: 450000.0,
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 30,
      postsCompleted: 24,
      accountManagerName: "Ansh Chourasiya",
      leadDesignerName: "Deepak Joshi",
      contentWriterName: "Sneha Sen",
      mediaBuyerName: "Rohit Kapoor",
      brandGuidelines: "Ultra Indigo (#4F46E5), Cobalt Blue (#2563EB). High tech, trustworthy financial charts, SEBI compliant disclaimers, micro-investing educational reels.",
      contractStartDate: new Date("2025-08-01"),
      contractRenewalDate: new Date("2026-08-01"),
    },
    {
      name: "Mahalaxmi Heritage Jewellers Group",
      brandName: "Mahalaxmi Jewels",
      industry: "Luxury Retail & Bridal Jewellery",
      website: "https://mahalaxmijewels.in",
      phone: "+91 98444 88990",
      email: "marketing@mahalaxmijewels.in",
      city: "Chennai",
      state: "Tamil Nadu",
      activePackage: "Luxury Brand & High-Production Video Pod",
      monthlyRetainer: 375000.0,
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 18,
      postsCompleted: 12,
      accountManagerName: "Kunal Sharma",
      leadDesignerName: "Deepak Joshi",
      contentWriterName: "Aman Gupta",
      mediaBuyerName: "Rohit Kapoor",
      brandGuidelines: "Royal Crimson (#991B1B), Antique Gold (#D97706). Grand South Indian bridal temple jewellery, cinematic 4K macro video clips, heritage authenticity.",
      contractStartDate: new Date("2025-11-01"),
      contractRenewalDate: new Date("2026-11-01"),
    },
    {
      name: "Nikita Shrivastava (Lucky's Hair Studio)",
      brandName: "Lucky's Unisex Hair & Skin",
      industry: "Salon, Beauty & Wellness",
      website: "https://luckyshairstudio.in",
      phone: "+91 98939 01792",
      email: "nikita@luckyshair.in",
      city: "Indore",
      state: "Madhya Pradesh",
      activePackage: "Local Salon Instagram & Google Business Booster",
      monthlyRetainer: 30000.0,
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 10,
      postsCompleted: 7,
      accountManagerName: "Kunal Sharma",
      leadDesignerName: "Pooja Verma",
      contentWriterName: "Sneha Sen",
      mediaBuyerName: "Kunal Sharma",
      brandGuidelines: "Rose Gold (#FB7185), Soft Charcoal (#1E293B). Hair transformation before/after reels, keratin treatments, bridal makeover highlights.",
      contractStartDate: new Date("2026-03-01"),
      contractRenewalDate: new Date("2027-02-28"),
    },
    {
      name: "Sumit More Furniture Design",
      brandName: "More Woods & Crafts",
      industry: "Sofa & Furniture Services",
      website: "https://sumitmorefurniture.com",
      phone: "+91 93990 61792",
      email: "sumit@morefurniture.in",
      city: "Indore",
      state: "Madhya Pradesh",
      activePackage: "Starter Digital Presence & Local Leads",
      monthlyRetainer: 25000.0,
      status: ClientStatus.ACTIVE,
      onboardingProgress: 100,
      postsPlanned: 8,
      postsCompleted: 6,
      accountManagerName: "Kunal Sharma",
      leadDesignerName: "Pooja Verma",
      contentWriterName: "Aman Gupta",
      mediaBuyerName: "Kunal Sharma",
      brandGuidelines: "Warm Teakwood (#78350F) and Forest Green. Highlighting bespoke carpenter craftsmanship and direct factory pricing.",
      contractStartDate: new Date("2026-04-01"),
      contractRenewalDate: new Date("2027-03-31"),
    },
  ];

  const createdClients: Record<string, any> = {};

  for (const c of clientsData) {
    const record = await prisma.agencyClient.create({
      data: {
        tenantId,
        ...c,
      },
    });
    createdClients[c.name] = record;
  }

  console.log(`✅ Created ${Object.keys(createdClients).length} agency clients.`);

  // 2. Agency Projects
  const sapna = createdClients["Sapna Washing Point"];
  const amba = createdClients["Maa Amba Foam & Furnishing"];
  const zest = createdClients["ZestPure Omnichannel D2C Nutrition"];
  const fin = createdClients["FinEdge Neo-Banking & Wealth Technologies"];

  const projects = [
    {
      tenantId,
      clientId: sapna.id,
      name: "October 2026 Festive Detailing & Monsoon Care Campaign",
      description: "Ceramic coating promotional videos, Instagram reels, and Google Maps Local SEO boost.",
      deliverableType: "Monthly Retainer Deliverable",
      status: ProjectStatus.IN_PROGRESS,
      budget: 50000.0,
      startDate: new Date("2026-10-01"),
      dueDate: new Date("2026-10-31"),
      assigneeName: "Kunal Sharma",
      progressPercent: 67,
    },
    {
      tenantId,
      clientId: amba.id,
      name: "Diwali Home Makeover & Ortho Mattress Launch",
      description: "High-production product catalog shoots, Meta lead ad funnels, and festive discount carousel ads.",
      deliverableType: "360° Creative & Meta Ads",
      status: ProjectStatus.IN_PROGRESS,
      budget: 100000.0,
      startDate: new Date("2026-10-05"),
      dueDate: new Date("2026-11-15"),
      assigneeName: "Ansh Chourasiya",
      progressPercent: 70,
    },
    {
      tenantId,
      clientId: zest.id,
      name: "Q4 Hyper-Growth Meta & Google Performance Scale",
      description: "Scaling monthly ad spend to ₹15 Lakhs at target 4.0x ROAS with dynamic creative testing.",
      deliverableType: "Performance Marketing",
      status: ProjectStatus.IN_PROGRESS,
      budget: 280000.0,
      startDate: new Date("2026-10-01"),
      dueDate: new Date("2026-12-31"),
      assigneeName: "Rohit Kapoor",
      progressPercent: 76,
    },
    {
      tenantId,
      clientId: fin.id,
      name: "Bharat Vernacular Influencer Campaign (Tier 2/3 Cities)",
      description: "Hindi, Marathi & Tamil creator videos explaining SIP investment apps.",
      deliverableType: "Influencer Marketing & PR",
      status: ProjectStatus.IN_PROGRESS,
      budget: 450000.0,
      startDate: new Date("2026-09-15"),
      dueDate: new Date("2026-11-30"),
      assigneeName: "Ansh Chourasiya",
      progressPercent: 80,
    },
  ];

  const createdProjects: any[] = [];
  for (const p of projects) {
    const proj = await prisma.agencyProject.create({ data: p });
    createdProjects.push(proj);
  }

  console.log(`✅ Created ${createdProjects.length} agency delivery projects.`);

  // 3. 7-Stage Agency Tasks
  const sapnaProj = createdProjects[0];
  const ambaProj = createdProjects[1];

  const tasksData = [
    {
      tenantId,
      projectId: sapnaProj.id,
      clientId: sapna.id,
      title: "Content Brief: Foam Wash ASMR & Ceramic Coating Process",
      description: "Draft 3 video scripts highlighting high-pressure foam wash and 9H ceramic coating gloss.",
      stage: AgencyWorkflowStage.COPYWRITING,
      priority: "HIGH" as any,
      assigneeName: "Aman Gupta",
      assigneeRole: "Content Writer",
      dueDate: new Date("2026-10-22"),
      commentsCount: 3,
    },
    {
      tenantId,
      projectId: sapnaProj.id,
      clientId: sapna.id,
      title: "Design: Festive 30% Off Car Spa Carousel (1080x1350)",
      description: "Create 5-slide educational carousel explaining water repellency on rainy roads.",
      stage: AgencyWorkflowStage.INTERNAL_REVIEW,
      priority: "HIGH" as any,
      assigneeName: "Pooja Verma",
      assigneeRole: "Lead Designer",
      dueDate: new Date("2026-10-21"),
      commentsCount: 4,
      assetPreview: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=600",
    },
    {
      tenantId,
      projectId: sapnaProj.id,
      clientId: sapna.id,
      title: "Client Approval: Diwali Festival Greeting Reel & Detailing Offer",
      description: "Submitted to client for final green light before social publishing.",
      stage: AgencyWorkflowStage.CLIENT_APPROVAL,
      priority: "URGENT" as any,
      assigneeName: "Kunal Sharma",
      assigneeRole: "Account Manager",
      dueDate: new Date("2026-10-20"),
      commentsCount: 2,
      assetPreview: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=600",
    },
    {
      tenantId,
      projectId: sapnaProj.id,
      clientId: sapna.id,
      title: "Scheduled: Sunday Car Maintenance Tips Post",
      description: "Pre-scheduled via Instagram Graph API integration for Sunday 11:00 AM.",
      stage: AgencyWorkflowStage.SCHEDULED,
      priority: "MEDIUM" as any,
      assigneeName: "Pooja Verma",
      assigneeRole: "Social Media Executive",
      dueDate: new Date("2026-10-25"),
      commentsCount: 1,
    },
    {
      tenantId,
      projectId: ambaProj.id,
      clientId: amba.id,
      title: "Copywriting: Orthopaedic Mattress Spine Alignment Story",
      description: "Doctor recommended posture copy and customer testimonial hook.",
      stage: AgencyWorkflowStage.DESIGN,
      priority: "MEDIUM" as any,
      assigneeName: "Deepak Joshi",
      assigneeRole: "Senior Visualizer",
      dueDate: new Date("2026-10-23"),
      commentsCount: 2,
    },
    {
      tenantId,
      projectId: ambaProj.id,
      clientId: amba.id,
      title: "Published: Dussehra Auspicious Furniture Purchase Video",
      description: "Live post delivered on Instagram & Facebook page with ₹2,000 boost budget.",
      stage: AgencyWorkflowStage.PUBLISHED,
      priority: "LOW" as any,
      assigneeName: "Ansh Chourasiya",
      assigneeRole: "Account Manager",
      dueDate: new Date("2026-10-18"),
      commentsCount: 5,
    },
  ];

  for (const t of tasksData) {
    await prisma.agencyTask.create({ data: t });
  }

  console.log(`✅ Seeded ${tasksData.length} 7-stage agency tasks.`);

  // 4. Content Calendar Posts (with Indian Festival & Brand Campaigns)
  const postsData = [
    {
      tenantId,
      clientId: sapna.id,
      platform: PostPlatform.INSTAGRAM,
      postType: "Reel",
      title: "Deep High-Pressure Foam Wash Transformation",
      caption: "Satisfying car wash ASMR! 🚗✨ Protect your paint from mud and hard water stains with our 5-stage detailing spa. Book your slot via WhatsApp in bio!",
      hashtags: "#SapnaWashingPoint #IndoreCars #CarDetailingIndia #CeramicCoating #FoamWashASMR",
      mediaUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
      scheduledDate: new Date("2026-10-20T11:00:00Z"),
      status: PostStatus.SCHEDULED,
      festivalOrEvent: "Weekly Brand Content",
      reach: 4800,
      likes: 342,
      comments: 28,
    },
    {
      tenantId,
      clientId: amba.id,
      platform: PostPlatform.INSTAGRAM,
      postType: "Carousel",
      title: "5 Signs Your Mattress Is Ruining Your Sleep",
      caption: "Waking up with lower back pain? It's time to switch to Amba Ortho-Support Mattress. 100-night risk-free trial + free home delivery in Bhopal & Indore! 🛏️",
      hashtags: "#MaaAmbaFurnishing #MattressIndia #OrthoMattress #HomeDecorBhopal #SleepWell",
      mediaUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      scheduledDate: new Date("2026-10-22T14:30:00Z"),
      status: PostStatus.SCHEDULED,
      festivalOrEvent: "Educational Content",
      reach: 6200,
      likes: 490,
      comments: 41,
    },
    {
      tenantId,
      clientId: sapna.id,
      platform: PostPlatform.FACEBOOK,
      postType: "Creative Poster",
      title: "Dhanteras & Diwali Vehicle Puja Shubh Mahurat Offer",
      caption: "Welcome Goddess Lakshmi with a brand new shine on your car! Get complete exterior teflon polish free on interior dry cleaning packages. Valid till Nov 1st.",
      hashtags: "#DiwaliOffer #IndoreDeals #CarPolishing #SapnaCarCare",
      mediaUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
      scheduledDate: new Date("2026-10-28T09:00:00Z"),
      status: PostStatus.IN_REVIEW,
      festivalOrEvent: "Diwali & Dhanteras Festive Campaign",
      reach: 0,
      likes: 0,
      comments: 0,
    },
    {
      tenantId,
      clientId: zest.id,
      platform: PostPlatform.INSTAGRAM,
      postType: "Reel",
      title: "Why Most Whey Proteins Cause Bloating",
      caption: "We stripped out artificial sweeteners, gums, and chemical additives. Meet ZestPure 100% Grass-Fed Isolate with plant digestive enzymes. Your gut will thank you! ⚡🌱",
      hashtags: "#ZestPure #CleanNutrition #WheyIsolate #FitnessIndia #HealthyLifestyle",
      mediaUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800",
      scheduledDate: new Date("2026-10-21T18:00:00Z"),
      status: PostStatus.CLIENT_APPROVED,
      festivalOrEvent: "Product Explainer Series",
      reach: 18500,
      likes: 1420,
      comments: 112,
    },
  ];

  for (const post of postsData) {
    await prisma.contentPost.create({ data: post });
  }

  console.log(`✅ Seeded ${postsData.length} content calendar posts.`);

  // 5. Creative Assets
  const assetsData = [
    {
      tenantId,
      clientId: sapna.id,
      title: "Festive Ceramic Coating 30% Off Poster",
      assetType: "Instagram Feed Post (1080x1080)",
      dimensions: "1080x1080",
      fileUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
      version: 1,
      reviewStatus: CreativeReviewStatus.PENDING,
      clientFeedback: "Please highlight that prior appointment is required on weekends.",
      submittedBy: "Pooja Verma",
    },
    {
      tenantId,
      clientId: amba.id,
      title: "Orthopaedic Mattress Cutaway Diagram & Comfort Layers",
      assetType: "Technical Infographic Carousel",
      dimensions: "1080x1350",
      fileUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      version: 2,
      reviewStatus: CreativeReviewStatus.APPROVED,
      clientFeedback: "Approved! Colors look very premium and readable.",
      submittedBy: "Deepak Joshi",
      reviewedAt: new Date(),
    },
    {
      tenantId,
      clientId: zest.id,
      title: "ZestPure Plant Protein Bottle 3D Glass Render",
      assetType: "E-Commerce Hero Banner",
      dimensions: "1920x1080",
      fileUrl: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=800",
      version: 1,
      reviewStatus: CreativeReviewStatus.APPROVED,
      clientFeedback: "Looks great, please prepare 9:16 vertical version for Meta Stories.",
      submittedBy: "Pooja Verma",
      reviewedAt: new Date(),
    },
  ];

  for (const asset of assetsData) {
    await prisma.creativeAsset.create({ data: asset });
  }

  console.log(`✅ Seeded ${assetsData.length} creative assets for review.`);

  // 6. Meta & Google Ad Campaigns
  const adsData = [
    {
      tenantId,
      clientId: sapna.id,
      platform: AdPlatform.META,
      campaignName: "Sapna Detailing — Indore Radius 10km WhatsApp Leads",
      objective: "WhatsApp Direct Messages",
      budget: 15000.0,
      spent: 8420.0,
      leadsCount: 94,
      cpl: 89.57,
      roas: 4.8,
      impressions: 48500,
      clicks: 1420,
      status: AdStatus.ACTIVE,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
    },
    {
      tenantId,
      clientId: amba.id,
      platform: AdPlatform.META,
      campaignName: "Amba Luxury Living — Custom Sectional Sofa Leads",
      objective: "Instant Lead Forms",
      budget: 45000.0,
      spent: 28400.0,
      leadsCount: 168,
      cpl: 169.04,
      roas: 5.4,
      impressions: 112000,
      clicks: 3450,
      status: AdStatus.ACTIVE,
      startDate: new Date("2026-10-05"),
      endDate: new Date("2026-11-10"),
    },
    {
      tenantId,
      clientId: zest.id,
      platform: AdPlatform.GOOGLE,
      campaignName: "ZestPure Search Ads — Buy Grass Fed Whey Isolate Online",
      objective: "E-commerce Purchases",
      budget: 120000.0,
      spent: 88500.0,
      leadsCount: 420,
      cpl: 210.71,
      roas: 4.15,
      impressions: 245000,
      clicks: 9800,
      status: AdStatus.ACTIVE,
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
    },
  ];

  for (const ad of adsData) {
    await prisma.adCampaign.create({ data: ad });
  }

  console.log(`✅ Seeded ${adsData.length} digital marketing ad campaigns.`);

  // 7. SEO Trackers & Local Google Business Profile Rankings
  const seoData = [
    {
      tenantId,
      clientId: sapna.id,
      keyword: "best car wash in indore",
      targetUrl: "https://sapnawashing.in/car-wash-indore",
      currentRank: 2,
      previousRank: 5,
      searchVolume: 3200,
      difficulty: 28,
      gbpScore: 94,
      backlinksCount: 48,
      lastAuditedAt: new Date(),
    },
    {
      tenantId,
      clientId: sapna.id,
      keyword: "ceramic coating price indore",
      targetUrl: "https://sapnawashing.in/ceramic-coating",
      currentRank: 3,
      previousRank: 4,
      searchVolume: 1800,
      difficulty: 35,
      gbpScore: 94,
      backlinksCount: 32,
      lastAuditedAt: new Date(),
    },
    {
      tenantId,
      clientId: amba.id,
      keyword: "sofa manufacturer in bhopal",
      targetUrl: "https://maaambafurnishing.com/sofa",
      currentRank: 1,
      previousRank: 2,
      searchVolume: 2400,
      difficulty: 24,
      gbpScore: 89,
      backlinksCount: 64,
      lastAuditedAt: new Date(),
    },
    {
      tenantId,
      clientId: zest.id,
      keyword: "clean grass fed whey isolate india",
      targetUrl: "https://zestpurewellness.in/whey-isolate",
      currentRank: 4,
      previousRank: 9,
      searchVolume: 8900,
      difficulty: 58,
      gbpScore: 80,
      backlinksCount: 240,
      lastAuditedAt: new Date(),
    },
  ];

  for (const s of seoData) {
    await prisma.seoTracker.create({ data: s });
  }

  console.log(`✅ Seeded ${seoData.length} SEO & Local GBP trackers.`);

  // 8. Agency Invoices
  const invoicesData = [
    {
      tenantId,
      clientId: sapna.id,
      invoiceNumber: "INV-GGA-2026-089",
      issueDate: new Date("2026-10-01"),
      dueDate: new Date("2026-10-10"),
      subtotal: 50000.0,
      taxAmount: 9000.0,
      totalAmount: 59000.0,
      status: InvoiceStatus.PAID,
      items: [
        { description: "Monthly Social Media Management Retainer (12 Posts/Reels)", amount: 35000 },
        { description: "Indore Local SEO & Google Business Profile Optimization", amount: 15000 },
      ],
      paymentMethod: "Razorpay UPI",
      paidAt: new Date("2026-10-04"),
    },
    {
      tenantId,
      clientId: amba.id,
      invoiceNumber: "INV-GGA-2026-090",
      issueDate: new Date("2026-10-01"),
      dueDate: new Date("2026-10-10"),
      subtotal: 100000.0,
      taxAmount: 18000.0,
      totalAmount: 118000.0,
      status: InvoiceStatus.PAID,
      items: [
        { description: "Enterprise Creative Design Pod (20 Assets + Reels)", amount: 65000 },
        { description: "Meta Performance Lead Ad Funnel Management", amount: 35000 },
      ],
      paymentMethod: "NEFT / Bank Transfer",
      paidAt: new Date("2026-10-06"),
    },
    {
      tenantId,
      clientId: zest.id,
      invoiceNumber: "INV-GGA-2026-091",
      issueDate: new Date("2026-10-01"),
      dueDate: new Date("2026-10-15"),
      subtotal: 280000.0,
      taxAmount: 50400.0,
      totalAmount: 330400.0,
      status: InvoiceStatus.PAID,
      items: [
        { description: "Goodwin Hyper-Growth Performance Retainer (Meta + Google)", amount: 280000 },
      ],
      paymentMethod: "Corporate Wire",
      paidAt: new Date("2026-10-08"),
    },
    {
      tenantId,
      clientId: fin.id,
      invoiceNumber: "INV-GGA-2026-092",
      issueDate: new Date("2026-10-15"),
      dueDate: new Date("2026-10-30"),
      subtotal: 450000.0,
      taxAmount: 81000.0,
      totalAmount: 531000.0,
      status: InvoiceStatus.SENT,
      items: [
        { description: "360° Corporate Brand Experience & Vernacular Creator Pod", amount: 450000 },
      ],
      paymentMethod: "Pending Net Banking",
    },
  ];

  for (const inv of invoicesData) {
    await prisma.agencyInvoice.create({ data: inv });
  }

  console.log(`✅ Seeded ${invoicesData.length} agency invoices.`);

  // 9. Agency Operating Expenses (for Profitability calculations)
  const expensesData = [
    {
      tenantId,
      clientId: sapna.id,
      category: "Creative Production",
      description: "Freelance videographer on-site car wash shooting (4K 60fps)",
      amount: 8000.0,
      date: new Date("2026-10-05"),
      isBillable: false,
    },
    {
      tenantId,
      clientId: amba.id,
      category: "Software Tools",
      description: "Midjourney & Runway AI 3D furniture texture generation",
      amount: 4500.0,
      date: new Date("2026-10-07"),
      isBillable: false,
    },
    {
      tenantId,
      clientId: zest.id,
      category: "Media Spend / Ad Tech",
      description: "Triple Whale attribution & server-side Conversions API license",
      amount: 18000.0,
      date: new Date("2026-10-02"),
      isBillable: true,
    },
    {
      tenantId,
      clientId: fin.id,
      category: "Subcontractor",
      description: "Regional vernacular translators (Tamil & Marathi scriptwriting)",
      amount: 25000.0,
      date: new Date("2026-10-12"),
      isBillable: false,
    },
  ];

  for (const exp of expensesData) {
    await prisma.agencyExpense.create({ data: exp });
  }

  console.log(`✅ Seeded ${expensesData.length} agency operational expenses.`);
  console.log("🎉 Successfully completed Goodwin Grow AI Marketing Agency Operating System seed!");
}

main()
  .catch((e) => {
    console.error("Error seeding agency data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
