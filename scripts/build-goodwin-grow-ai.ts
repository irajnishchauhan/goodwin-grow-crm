import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

export async function buildGoodwinGrowAI(existingPrisma?: PrismaClient) {
  const prisma = existingPrisma || new PrismaClient();
  const shouldDisconnect = !existingPrisma;

  try {
    console.log("⚡ Building Goodwin Grow AI CRM Organization Workspace (goodwin-grow-ai)...");

    // 1. Locate the Goodwin Grow AI tenant
    const tenant = await prisma.tenant.findUnique({
      where: { code: "goodwin-grow-ai" },
      include: {
        settings: true,
        pipelines: { include: { stages: { orderBy: { orderIndex: "asc" } } } },
        memberships: { include: { user: true } },
      },
    });

    if (!tenant) {
      throw new Error("Tenant with code 'goodwin-grow-ai' not found.");
    }

    const tenantId = tenant.id;
    console.log(`✅ Located Goodwin Grow AI Tenant: ${tenant.name} (${tenantId})`);

    // 2. Add or identify Senior Growth Partner / Agency Director
    const growthPartnerPassword = await hashPassword("GrowthPartner@2026!");
    const growthUser = await prisma.user.upsert({
      where: { email: "rohit@goodwingrowai.com" },
      update: {},
      create: {
        email: "rohit@goodwingrowai.com",
        fullName: "Rohit Kapoor (VP Client Growth & Creative Strategy)",
        passwordHash: growthPartnerPassword,
        isActive: true,
      },
    });

    const managerRole = await prisma.role.findFirst({
      where: { tenantId, name: "Sales Manager" },
    });

    const existingMembership = await prisma.tenantMembership.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId: growthUser.id,
        },
      },
    });

    if (!existingMembership) {
      const membership = await prisma.tenantMembership.create({
        data: {
          tenantId,
          userId: growthUser.id,
          isOwner: false,
          status: "ACTIVE",
        },
      });

      if (managerRole) {
        await prisma.membershipRole.create({
          data: {
            membershipId: membership.id,
            roleId: managerRole.id,
          },
        });
      }
    }

    const assignedUserId = growthUser.id;

    // 3. Enrich Tenant Settings with Agency Headquarters Information
    await prisma.tenantSettings.upsert({
      where: { tenantId },
      update: {
        businessEmail: "growth@goodwingrowai.com",
        phone: "+91 99887 76655",
        website: "https://goodwingrowai.com",
        address: "Level 9, Cyber City Tower B, DLF Cyber City, Gurugram, Haryana - 122002",
        country: "India",
        currency: "INR",
        timezone: "Asia/Kolkata",
        seatLimit: 100,
      },
      create: {
        tenantId,
        businessEmail: "growth@goodwingrowai.com",
        phone: "+91 99887 76655",
        website: "https://goodwingrowai.com",
        address: "Level 9, Cyber City Tower B, DLF Cyber City, Gurugram, Haryana - 122002",
        country: "India",
        currency: "INR",
        timezone: "Asia/Kolkata",
        seatLimit: 100,
      },
    });
    console.log("✅ Updated Goodwin Grow AI corporate agency profile & settings.");

    // 4. Products & Services Catalog Benchmarked against National Leaders (Schbang, Social Beat, WATConsult, Techmagnate)
    const agencyServices = [
      {
        name: "Goodwin 360° Creative & Brand Experience Retainer",
        sku: "GGA-CREATIVE-360",
        description: "Full-service creative brand identity, campaign storytelling, high-production ad films, and UI/UX design. Direct market benchmark against Schbang. Monthly creative pod delivering 20+ video ad variations, 50+ social assets, and quarterly brand film production.",
        unitPrice: 450000.0,
        currency: "INR",
      },
      {
        name: "Goodwin Hyper-Growth Performance & Media Buying Retainer",
        sku: "GGA-PERF-MKTG",
        description: "ROI-driven multi-channel media buying across Meta, Google Ads, YouTube, and LinkedIn. Direct market benchmark against Social Beat. Advanced ROAS optimization, AI audience segmentation, and CAC reduction frameworks.",
        unitPrice: 280000.0,
        currency: "INR",
      },
      {
        name: "Goodwin Bharat Vernacular & Regional Influencer Engine",
        sku: "GGA-VERNACULAR-INF",
        description: "Hyper-localized vernacular video production in 8 Indian languages (Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam) with tier-1/tier-2 creator networks. Benchmark: Social Beat 22-language Bharat reach.",
        unitPrice: 550000.0,
        currency: "INR",
      },
      {
        name: "Goodwin Enterprise Digital Transformation & Social Listening",
        sku: "GGA-ENT-STRATEGY",
        description: "360° corporate digital transformation, real-time social media listening, crisis management & Online Reputation Management (ORM). Benchmark: WATConsult enterprise multinational brand management.",
        unitPrice: 375000.0,
        currency: "INR",
      },
      {
        name: "Goodwin Enterprise AI SEO & Organic Search Dominance Retainer",
        sku: "GGA-SEO-DOMINANCE",
        description: "Comprehensive enterprise technical SEO, programmatic content engine, high-intent keyword ranking, and AI search engine optimization (GEO/AEO). Direct market benchmark against Techmagnate. Guaranteed 300%+ organic traffic growth.",
        unitPrice: 220000.0,
        currency: "INR",
      },
      {
        name: "Goodwin Autonomous AI Agent Marketing & Conversational MarTech",
        sku: "GGA-AI-AGENT-MARTECH",
        description: "Proprietary Goodwin Grow AI autonomous agents for real-time lead qualification, automated WhatsApp conversational funnels, dynamic ad copy generation, and CRM synchronization.",
        unitPrice: 350000.0,
        currency: "INR",
      },
      {
        name: "Goodwin App Store Optimization (ASO) & User Acquisition Engine",
        sku: "GGA-ASO-MOBILE",
        description: "Mobile app keyword optimization, conversion rate optimization on Google Play & Apple App Store, and programmatic app install campaigns. Benchmark: Techmagnate ASO services.",
        unitPrice: 175000.0,
        currency: "INR",
      },
      {
        name: "Goodwin Custom MarTech Architecture & Enterprise Web Engineering",
        sku: "GGA-TECH-MARTECH",
        description: "Headless Next.js e-commerce / corporate portal development, Customer Data Platform (CDP) setup, and custom CRM/ERP bidirectional integrations. Benchmark: Schbang Tech Solutions.",
        unitPrice: 750000.0,
        currency: "INR",
      },
    ];

    const createdProducts: Record<string, any> = {};

    for (const p of agencyServices) {
      const existing = await prisma.product.findFirst({
        where: { tenantId, sku: p.sku },
      });

      if (existing) {
        createdProducts[p.sku] = await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: p.name,
            description: p.description,
            unitPrice: p.unitPrice,
            currency: p.currency,
            isActive: true,
          },
        });
      } else {
        createdProducts[p.sku] = await prisma.product.create({
          data: {
            tenantId,
            name: p.name,
            sku: p.sku,
            description: p.description,
            unitPrice: p.unitPrice,
            currency: p.currency,
            isActive: true,
          },
        });
      }
    }
    console.log(`✅ Loaded ${Object.keys(createdProducts).length} agency growth services into Goodwin Grow AI catalog.`);

    // 5. Strategic Enterprise & D2C Client Accounts (Companies)
    const companiesData = [
      {
        name: "ZestPure Omnichannel D2C Nutrition & Wellness",
        industry: "D2C Health, Supplements & FMCG",
        website: "https://zestpurewellness.in",
        phone: "+91 98111 55667",
        email: "partnerships@zestpurewellness.in",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
      },
      {
        name: "FinEdge Neo-Banking & Wealth Technologies",
        industry: "FinTech & Digital Investment Platform",
        website: "https://finedgewealth.com",
        phone: "+91 98222 66778",
        email: "growth@finedgewealth.com",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
      },
      {
        name: "Apex Consumer Goods & Personal Care Ltd",
        industry: "FMCG, Personal Care & Cosmetics",
        website: "https://apexpersonalcare.in",
        phone: "+91 98333 77889",
        email: "corporate@apexpersonalcare.in",
        city: "Gurugram",
        state: "Haryana",
        country: "India",
      },
      {
        name: "Mahalaxmi Heritage Jewellers Group",
        industry: "Luxury Retail & Bridal Jewellery",
        website: "https://mahalaxmijewels.in",
        phone: "+91 98444 88990",
        email: "marketing@mahalaxmijewels.in",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
      },
      {
        name: "AutoTech Mobility & Fleet Telematics",
        industry: "B2B Connected Vehicles & IoT SaaS",
        website: "https://autotechmobility.in",
        phone: "+91 98555 99001",
        email: "contact@autotechmobility.in",
        city: "Pune",
        state: "Maharashtra",
        country: "India",
      },
      {
        name: "SkillSphere Global EdTech & Certifications",
        industry: "EdTech, Executive Learning & AI Courses",
        website: "https://skillsphereglobal.in",
        phone: "+91 98666 00112",
        email: "admissions@skillsphereglobal.in",
        city: "Noida",
        state: "Uttar Pradesh",
        country: "India",
      },
      {
        name: "CloudKitchens India Network Pvt Ltd",
        industry: "FoodTech & Cloud Kitchen Delivery Hubs",
        website: "https://cloudkitchensindia.com",
        phone: "+91 98777 11223",
        email: "brand@cloudkitchensindia.com",
        city: "New Delhi",
        state: "Delhi NCR",
        country: "India",
      },
    ];

    const createdCompanies: Record<string, any> = {};

    for (const c of companiesData) {
      const existing = await prisma.company.findFirst({
        where: { tenantId, name: c.name },
      });

      if (existing) {
        createdCompanies[c.name] = await prisma.company.update({
          where: { id: existing.id },
          data: {
            industry: c.industry,
            website: c.website,
            phone: c.phone,
            email: c.email,
            city: c.city,
            state: c.state,
            country: c.country,
            assignedOwnerId: assignedUserId,
          },
        });
      } else {
        createdCompanies[c.name] = await prisma.company.create({
          data: {
            tenantId,
            name: c.name,
            industry: c.industry,
            website: c.website,
            phone: c.phone,
            email: c.email,
            city: c.city,
            state: c.state,
            country: c.country,
            assignedOwnerId: assignedUserId,
          },
        });
      }
    }
    console.log(`✅ Loaded ${Object.keys(createdCompanies).length} strategic client accounts for Goodwin Grow AI.`);

    // 6. Executive Decision Maker Contacts
    const contactsData = [
      {
        companyName: "ZestPure Omnichannel D2C Nutrition & Wellness",
        firstName: "Ananya",
        lastName: "Sen",
        email: "ananya@zestpurewellness.in",
        phone: "+91 98111 55667",
        jobTitle: "Chief Marketing Officer (CMO)",
        tags: ["CMO", "D2C Brand", "Schbang Benchmark", "Performance Decision Maker"],
      },
      {
        companyName: "FinEdge Neo-Banking & Wealth Technologies",
        firstName: "Rohan",
        lastName: "Khosla",
        email: "rohan@finedgewealth.com",
        phone: "+91 98222 66778",
        jobTitle: "VP Marketing & Digital Growth",
        tags: ["FinTech", "Techmagnate Benchmark", "Enterprise SEO", "ASO"],
      },
      {
        companyName: "Apex Consumer Goods & Personal Care Ltd",
        firstName: "Vikramaditya",
        lastName: "Singhania",
        email: "vikramaditya@apexpersonalcare.in",
        phone: "+91 98333 77889",
        jobTitle: "Executive Director of Brand Communications",
        tags: ["Enterprise FMCG", "WATConsult Benchmark", "Social Listening", "ORM"],
      },
      {
        companyName: "Mahalaxmi Heritage Jewellers Group",
        firstName: "Priyanka",
        lastName: "Subramanian",
        email: "priyanka@mahalaxmijewels.in",
        phone: "+91 98444 88990",
        jobTitle: "Head of Regional Marketing & Brand",
        tags: ["Regional Marketing", "Social Beat Benchmark", "Vernacular Influencers", "South India"],
      },
      {
        companyName: "AutoTech Mobility & Fleet Telematics",
        firstName: "Sameer",
        lastName: "Deshmukh",
        email: "sameer@autotechmobility.in",
        phone: "+91 98555 99001",
        jobTitle: "Chief Strategy & Marketing Officer",
        tags: ["B2B Brand", "Schbang Tech Benchmark", "Global Thought Leadership"],
      },
      {
        companyName: "SkillSphere Global EdTech & Certifications",
        firstName: "Dr. Meera",
        lastName: "Nambiar",
        email: "meera@skillsphereglobal.in",
        phone: "+91 98666 00112",
        jobTitle: "Chief Executive Officer",
        tags: ["EdTech", "Techmagnate SEO Benchmark", "High Intent Search"],
      },
      {
        companyName: "CloudKitchens India Network Pvt Ltd",
        firstName: "Kunal",
        lastName: "Bhasin",
        email: "kunal@cloudkitchensindia.com",
        phone: "+91 98777 11223",
        jobTitle: "Head of Digital Customer Acquisition",
        tags: ["QSR", "Hyper-local Meta Ads", "Social Beat Performance"],
      },
    ];

    const createdContacts: Record<string, any> = {};

    for (const c of contactsData) {
      const company = createdCompanies[c.companyName];
      const existing = await prisma.contact.findFirst({
        where: { tenantId, email: c.email },
      });

      if (existing) {
        createdContacts[c.email] = await prisma.contact.update({
          where: { id: existing.id },
          data: {
            firstName: c.firstName,
            lastName: c.lastName,
            phone: c.phone,
            jobTitle: c.jobTitle,
            companyId: company?.id,
            tags: c.tags,
            assignedOwnerId: assignedUserId,
          },
        });
      } else {
        createdContacts[c.email] = await prisma.contact.create({
          data: {
            tenantId,
            firstName: c.firstName,
            lastName: c.lastName,
            email: c.email,
            phone: c.phone,
            jobTitle: c.jobTitle,
            companyId: company?.id,
            tags: c.tags,
            assignedOwnerId: assignedUserId,
          },
        });
      }
    }
    console.log(`✅ Loaded ${Object.keys(createdContacts).length} decision-maker contacts for Goodwin Grow AI.`);

    // 7. Enriched Leads Benchmarking National Agency Brands (Schbang, Social Beat, WATConsult, Techmagnate)
    const leadsData = [
      {
        firstName: "Tanvi",
        lastName: "Roy",
        companyName: "UrbanGlow D2C Clean Beauty & Cosmetics",
        email: "tanvi@urbanglowbeauty.in",
        phone: "+91 98111 22344",
        status: "QUALIFIED",
        priority: "URGENT",
        source: "AdAge India CMO Summit",
        score: 95,
        tags: ["Competitor: Schbang", "Full-Service Creative", "D2C Brand", "360 Retainer", "Ad Films"],
      },
      {
        firstName: "Siddharth",
        lastName: "Menon",
        companyName: "Southern Spice Foods & Packaged Goods",
        email: "siddharth@southernspice.in",
        phone: "+91 98222 33455",
        status: "CONTACTED",
        priority: "HIGH",
        source: "Regional Brand Expo",
        score: 88,
        tags: ["Competitor: Social Beat", "Vernacular Video", "Regional Influencers", "South India", "CAC Optimization"],
      },
      {
        firstName: "Shweta",
        lastName: "Kulkarni",
        companyName: "Bharat Life Insurance & Financial Services",
        email: "shweta@bharatlifeinsure.in",
        phone: "+91 98333 44566",
        status: "PROPOSAL",
        priority: "HIGH",
        source: "CMO Roundtable Inbound",
        score: 92,
        tags: ["Competitor: WATConsult", "Enterprise ORM", "Social Listening", "BFSI Brand", "Crisis PR"],
      },
      {
        firstName: "Gaurav",
        lastName: "Taneja",
        companyName: "HealthKart Aggregator Spares & Nutrition",
        email: "gaurav@healthkartspares.in",
        phone: "+91 98444 55677",
        status: "QUALIFIED",
        priority: "HIGH",
        source: "Organic Search Inbound",
        score: 84,
        tags: ["Competitor: Techmagnate", "Enterprise SEO", "Search Rank", "Content Engine", "High Volume"],
      },
      {
        firstName: "Aakash",
        lastName: "Bhargava",
        companyName: "QuickRide Mobility Technologies",
        email: "aakash@quickridemobility.in",
        phone: "+91 98555 66788",
        status: "NEW",
        priority: "MEDIUM",
        source: "Founder Referral",
        score: 78,
        tags: ["Competitor: Social Beat", "Competitor: Techmagnate", "App Store Optimization", "User Acquisition"],
      },
      {
        firstName: "Nidhi",
        lastName: "Chawla",
        companyName: "Heritage Luxury Resorts & Hospitality",
        email: "nidhi@heritageresorts.in",
        phone: "+91 98666 77899",
        status: "NEW",
        priority: "LOW",
        source: "LinkedIn Outreach",
        score: 72,
        tags: ["Competitor: Schbang", "Brand Storytelling", "Luxury Hospitality", "Creative Production"],
      },
    ];

    for (const ld of leadsData) {
      const existing = await prisma.lead.findFirst({
        where: { tenantId, email: ld.email },
      });

      if (existing) {
        await prisma.lead.update({
          where: { id: existing.id },
          data: {
            firstName: ld.firstName,
            lastName: ld.lastName,
            companyName: ld.companyName,
            phone: ld.phone,
            status: ld.status as any,
            priority: ld.priority as any,
            source: ld.source,
            score: ld.score,
            tags: ld.tags,
            assignedOwnerId: assignedUserId,
          },
        });
      } else {
        await prisma.lead.create({
          data: {
            tenantId,
            firstName: ld.firstName,
            lastName: ld.lastName,
            companyName: ld.companyName,
            email: ld.email,
            phone: ld.phone,
            status: ld.status as any,
            priority: ld.priority as any,
            source: ld.source,
            score: ld.score,
            tags: ld.tags,
            assignedOwnerId: assignedUserId,
          },
        });
      }
    }
    console.log("✅ Seeded competitor-benchmarked agency leads for Goodwin Grow AI.");

    // 8. High-Value Agency Retainer Deals in Pipeline
    const stages = tenant.pipelines[0]?.stages || [];
    if (stages.length >= 6) {
      const [newLeadStage, contactedStage, qualifiedStage, proposalStage, negotiationStage, wonStage] = stages;

      const dealsData = [
        {
          title: "ZestPure 360° Creative Brand & Performance Media Annual Retainer",
          companyName: "ZestPure Omnichannel D2C Nutrition & Wellness",
          contactEmail: "ananya@zestpurewellness.in",
          stage: negotiationStage,
          value: 5400000.0, // 12 months @ 4,50,000/mo
          probability: negotiationStage.winProbability,
          status: "OPEN",
          expectedCloseDate: new Date(Date.now() + 15 * 86400000),
        },
        {
          title: "Apex Consumer Goods Corporate Social Listening & ORM Retainer",
          companyName: "Apex Consumer Goods & Personal Care Ltd",
          contactEmail: "vikramaditya@apexpersonalcare.in",
          stage: proposalStage,
          value: 4500000.0, // 12 months @ 3,75,000/mo
          probability: proposalStage.winProbability,
          status: "OPEN",
          expectedCloseDate: new Date(Date.now() + 20 * 86400000),
        },
        {
          title: "Mahalaxmi Jewellers 3-State Vernacular Influencer Festive Campaign",
          companyName: "Mahalaxmi Heritage Jewellers Group",
          contactEmail: "priyanka@mahalaxmijewels.in",
          stage: qualifiedStage,
          value: 3300000.0,
          probability: qualifiedStage.winProbability,
          status: "OPEN",
          expectedCloseDate: new Date(Date.now() + 25 * 86400000),
        },
        {
          title: "FinEdge Neo-Bank Annual Enterprise SEO & ASO Growth Contract",
          companyName: "FinEdge Neo-Banking & Wealth Technologies",
          contactEmail: "rohan@finedgewealth.com",
          stage: proposalStage,
          value: 2640000.0, // 12 months @ 2,20,000/mo
          probability: proposalStage.winProbability,
          status: "OPEN",
          expectedCloseDate: new Date(Date.now() + 30 * 86400000),
        },
        {
          title: "AutoTech Mobility Global B2B Brand & Thought Leadership Overhaul",
          companyName: "AutoTech Mobility & Fleet Telematics",
          contactEmail: "sameer@autotechmobility.in",
          stage: contactedStage,
          value: 2750000.0,
          probability: contactedStage.winProbability,
          status: "OPEN",
          expectedCloseDate: new Date(Date.now() + 45 * 86400000),
        },
        {
          title: "SkillSphere EdTech Programmatic SEO & AI Organic Growth Engine",
          companyName: "SkillSphere Global EdTech & Certifications",
          contactEmail: "meera@skillsphereglobal.in",
          stage: wonStage,
          value: 2200000.0,
          probability: 100,
          status: "WON",
          expectedCloseDate: new Date(Date.now() - 3 * 86400000),
        },
      ];

      for (const d of dealsData) {
        const company = createdCompanies[d.companyName];
        const contact = createdContacts[d.contactEmail];

        const existingDeal = await prisma.deal.findFirst({
          where: { tenantId, title: d.title },
        });

        if (existingDeal) {
          await prisma.deal.update({
            where: { id: existingDeal.id },
            data: {
              stageId: d.stage.id,
              companyId: company?.id,
              contactId: contact?.id,
              value: d.value,
              probability: d.probability,
              status: d.status as any,
              expectedCloseDate: d.expectedCloseDate,
              assignedOwnerId: assignedUserId,
            },
          });
        } else {
          await prisma.deal.create({
            data: {
              tenantId,
              pipelineId: tenant.pipelines[0].id,
              stageId: d.stage.id,
              companyId: company?.id,
              contactId: contact?.id,
              title: d.title,
              value: d.value,
              currency: "INR",
              probability: d.probability,
              status: d.status as any,
              expectedCloseDate: d.expectedCloseDate,
              assignedOwnerId: assignedUserId,
            },
          });
        }
      }
      console.log("✅ Configured sales pipeline deals for Goodwin Grow AI.");
    }

    // 9. Commercial Master Services Agreements & Quotations
    const creativeService = createdProducts["GGA-CREATIVE-360"];
    const perfService = createdProducts["GGA-PERF-MKTG"];
    const seoService = createdProducts["GGA-SEO-DOMINANCE"];
    const ormService = createdProducts["GGA-ENT-STRATEGY"];

    const quotationsData = [
      {
        quotationNumber: "QT-GGA-2026-001",
        companyName: "ZestPure Omnichannel D2C Nutrition & Wellness",
        contactEmail: "ananya@zestpurewellness.in",
        status: "SENT",
        subtotal: 4380000.0, // 6-month dual retainer (Creative + Performance)
        discountAmount: 219000.0, // 5% bundle discount
        taxAmount: 748980.0, // 18% GST on digital agency services
        totalAmount: 4909980.0,
        validUntil: new Date(Date.now() + 30 * 86400000),
        terms: "1. Scope: Full-service Creative Media & Video Production Pod (1 Creative Director, 2 Motion Designers, 1 Copy Lead) + Hyper-Growth Paid Media Management (Meta/Google Ads).\n2. Monthly Deliverables: 24 Video Ad variations, weekly creative fatigue refresh, full bi-weekly ROAS review.\n3. Media spend managed directly on client ad accounts with 0% markup.\n4. Creative benchmark Schbang exceeded with proprietary Goodwin AI variant scaling.",
        items: [
          {
            productId: creativeService?.id,
            description: "Goodwin 360° Creative & Brand Experience Retainer (6-Month Pod)",
            quantity: 6,
            unitPrice: 450000.0,
            subtotal: 2700000.0,
          },
          {
            productId: perfService?.id,
            description: "Goodwin Hyper-Growth Performance & Media Buying Management (6 Months)",
            quantity: 6,
            unitPrice: 280000.0,
            subtotal: 1680000.0,
          },
        ],
      },
      {
        quotationNumber: "QT-GGA-2026-002",
        companyName: "FinEdge Neo-Banking & Wealth Technologies",
        contactEmail: "rohan@finedgewealth.com",
        status: "ACCEPTED",
        subtotal: 2370000.0,
        discountAmount: 118500.0, // 5% annual commitment discount
        taxAmount: 405270.0, // 18% GST
        totalAmount: 2656770.0,
        validUntil: new Date(Date.now() + 45 * 86400000),
        terms: "1. Scope: Enterprise Technical SEO Architecture, Core Web Vitals Optimization & High-Intent Search Dominance.\n2. Guaranteed Top-3 search visibility for 150+ high-volume FinTech & Wealth advisory terms.\n3. Benchmark: Comprehensive competitive displacement against Techmagnate rankings.\n4. Monthly reporting including Google Search Console indexing, backlink equity, and organic CAC tracking.",
        items: [
          {
            productId: seoService?.id,
            description: "Goodwin Enterprise AI SEO & Organic Search Dominance Retainer (Annual Contract)",
            quantity: 12,
            unitPrice: 197500.0,
            subtotal: 2370000.0,
          },
        ],
      },
      {
        quotationNumber: "QT-GGA-2026-003",
        companyName: "Apex Consumer Goods & Personal Care Ltd",
        contactEmail: "vikramaditya@apexpersonalcare.in",
        status: "DRAFT",
        subtotal: 4500000.0, // 12-Month Enterprise ORM & Social Listening
        discountAmount: 225000.0,
        taxAmount: 769500.0, // 18% GST
        totalAmount: 5044500.0,
        validUntil: new Date(Date.now() + 60 * 86400000),
        terms: "1. Scope: 24x7 Brand sentiment monitoring across Twitter/X, Instagram, LinkedIn, and consumer forums.\n2. Crisis escalation SLA: 15-minute response protocol with pre-approved PR statements.\n3. Executive dashboard comparing brand sentiment vs key FMCG competitors (benchmark: WATConsult enterprise social listening).",
        items: [
          {
            productId: ormService?.id,
            description: "Goodwin Enterprise Digital Transformation & Social Listening Retainer (12 Months)",
            quantity: 12,
            unitPrice: 375000.0,
            subtotal: 4500000.0,
          },
        ],
      },
    ];

    for (const q of quotationsData) {
      const company = createdCompanies[q.companyName];
      const contact = createdContacts[q.contactEmail];

      const existingQuote = await prisma.quotation.findFirst({
        where: { tenantId, quotationNumber: q.quotationNumber },
      });

      if (existingQuote) {
        await prisma.quotation.update({
          where: { id: existingQuote.id },
          data: {
            companyId: company?.id,
            contactId: contact?.id,
            status: q.status as any,
            subtotal: q.subtotal,
            discountAmount: q.discountAmount,
            taxAmount: q.taxAmount,
            totalAmount: q.totalAmount,
            validUntil: q.validUntil,
            terms: q.terms,
          },
        });
      } else {
        const newQuote = await prisma.quotation.create({
          data: {
            tenantId,
            quotationNumber: q.quotationNumber,
            companyId: company?.id,
            contactId: contact?.id,
            status: q.status as any,
            subtotal: q.subtotal,
            discountAmount: q.discountAmount,
            taxAmount: q.taxAmount,
            totalAmount: q.totalAmount,
            validUntil: q.validUntil,
            terms: q.terms,
            createdById: assignedUserId,
          },
        });

        for (const itm of q.items) {
          if (itm.productId) {
            await prisma.quotationItem.create({
              data: {
                quotationId: newQuote.id,
                productId: itm.productId,
                description: itm.description,
                quantity: itm.quantity,
                unitPrice: itm.unitPrice,
                discount: 0,
                taxRate: 18,
                lineTotal: itm.subtotal,
              },
            });
          }
        }
      }
    }
    console.log("✅ Created commercial retainer quotations for Goodwin Grow AI.");

    // 10. Operational Tasks & Calendar Follow-ups
    const tasksData = [
      {
        title: "Present Q4 360° Creative Pitch Deck & TVC storyboard to ZestPure CMO Ananya Sen",
        description: "Showcase creative brand storytelling pod deliverables vs Schbang proposal with AI video variations.",
        priority: "HIGH",
        status: "PENDING",
        dueDate: new Date(Date.now() + 2 * 86400000),
        contactEmail: "ananya@zestpurewellness.in",
      },
      {
        title: "Deliver Technical SEO & Core Web Vitals audit vs Techmagnate benchmark for FinEdge",
        description: "Submit 45-page deep technical audit highlighting crawl budget, SSR caching, and keyword opportunity gap.",
        priority: "URGENT",
        status: "COMPLETED",
        dueDate: new Date(Date.now() - 1 * 86400000),
        contactEmail: "rohan@finedgewealth.com",
      },
      {
        title: "Finalize 45-day Vernacular Influencer roster (Tamil/Telugu/Malayalam) for Mahalaxmi Jewellers",
        description: "Review creator engagement rates, contract terms, and festive creative brief against Social Beat benchmark.",
        priority: "HIGH",
        status: "PENDING",
        dueDate: new Date(Date.now() + 4 * 86400000),
        contactEmail: "priyanka@mahalaxmijewels.in",
      },
      {
        title: "Deploy real-time Brand Sentiment Alert Bot for Apex Consumer Goods ORM pilot",
        description: "Configure social listening sentiment filters and WhatsApp instant escalation notifications.",
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: new Date(Date.now() + 6 * 86400000),
        contactEmail: "vikramaditya@apexpersonalcare.in",
      },
      {
        title: "Conduct weekly ROAS & CAC performance review with CloudKitchens growth team",
        description: "Analyze Swiggy/Zomato direct attribution vs Meta hyper-local ads performance.",
        priority: "HIGH",
        status: "PENDING",
        dueDate: new Date(Date.now() + 3 * 86400000),
        contactEmail: "kunal@cloudkitchensindia.com",
      },
    ];

    for (const t of tasksData) {
      const contact = createdContacts[t.contactEmail];
      const existingTask = await prisma.task.findFirst({
        where: { tenantId, title: t.title },
      });

      if (!existingTask) {
        await prisma.task.create({
          data: {
            tenantId,
            title: t.title,
            description: t.description,
            priority: t.priority as any,
            status: t.status as any,
            dueDate: t.dueDate,
            assignedToId: assignedUserId,
            contactId: contact?.id,
          },
        });
      }
    }
    console.log("✅ Seeded client strategy & creative review tasks.");

    // 11. Client Engagement Activities
    const activitiesData = [
      {
        type: "MEETING",
        title: "Pitch Presentation with ZestPure CMO Ananya Sen",
        description: "Presented 360° brand film concept and performance media framework. Client praised the AI variant scaling approach.",
        contactEmail: "ananya@zestpurewellness.in",
        occurredAt: new Date(Date.now() - 2 * 86400000),
      },
      {
        type: "CALL",
        title: "Commercial Retainer Scope Review with FinEdge VP Growth Rohan Khosla",
        description: "Agreed on annual contract scope covering 150+ high-volume FinTech keywords and mobile App Store Optimization.",
        contactEmail: "rohan@finedgewealth.com",
        occurredAt: new Date(Date.now() - 3 * 86400000),
      },
      {
        type: "WHATSAPP",
        title: "Sent Vernacular Influencer Creator Roster to Mahalaxmi Jewellers",
        description: "Shared curated PDF roster of 35 verified South Indian regional fashion & lifestyle influencers.",
        contactEmail: "priyanka@mahalaxmijewels.in",
        occurredAt: new Date(Date.now() - 1 * 86400000),
      },
      {
        type: "EMAIL",
        title: "Official Retainer Quotation QT-GGA-2026-001 Dispatched to ZestPure",
        description: "Sent commercial SOW covering dual creative and performance media pod for 6 months.",
        contactEmail: "ananya@zestpurewellness.in",
        occurredAt: new Date(Date.now() - 4 * 86400000),
      },
    ];

    for (const a of activitiesData) {
      const contact = createdContacts[a.contactEmail];
      const existing = await prisma.activity.findFirst({
        where: { tenantId, title: a.title },
      });

      if (!existing) {
        await prisma.activity.create({
          data: {
            tenantId,
            type: a.type as any,
            title: a.title,
            description: a.description,
            performedById: assignedUserId,
            contactId: contact?.id,
            occurredAt: a.occurredAt,
          },
        });
      }
    }
    console.log("✅ Logged client relationship engagement activities.");

    // 12. Automated Agency Workflow Rules
    const automationRules = [
      {
        name: "Enterprise Retainer Lead Fast-Track Routing",
        triggerEvent: "LEAD_CREATED",
        conditions: {
          score_gte: 85,
          tag: "360 Retainer",
        },
        actions: {
          assign_owner: "rohit@goodwingrowai.com",
          priority: "URGENT",
          create_task: "Schedule agency credentials presentation & CMO discovery call within 2 hours",
        },
        isActive: true,
      },
      {
        name: "National Agency Pitch Battlecard Trigger",
        triggerEvent: "LEAD_CREATED",
        conditions: {
          tag_contains: "Competitor:",
        },
        actions: {
          create_task: "Compile differentiation pitch matrix vs Schbang / Social Beat / WATConsult / Techmagnate",
        },
        isActive: true,
      },
      {
        name: "Retainer Proposal 48-Hour Review Follow-up",
        triggerEvent: "DEAL_STAGE_CHANGED",
        conditions: {
          stage: "Proposal Sent",
        },
        actions: {
          create_task: "Follow up with client procurement team on pod team allocation & SOW sign-off",
        },
        isActive: true,
      },
    ];

    for (const r of automationRules) {
      const existing = await prisma.automationRule.findFirst({
        where: { tenantId, name: r.name },
      });

      if (existing) {
        await prisma.automationRule.update({
          where: { id: existing.id },
          data: {
            triggerEvent: r.triggerEvent as any,
            conditions: r.conditions,
            actions: r.actions,
            isActive: r.isActive,
          },
        });
      } else {
        await prisma.automationRule.create({
          data: {
            tenantId,
            name: r.name,
            triggerEvent: r.triggerEvent as any,
            conditions: r.conditions,
            actions: r.actions,
            isActive: r.isActive,
          },
        });
      }
    }
    console.log("✅ Configured automated agency workflow rules.");

    console.log("🎉 Goodwin Grow AI CRM Organization Workspace fully built!");
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect();
    }
  }
}

if (process.argv[1]?.includes("build-goodwin-grow-ai")) {
  buildGoodwinGrowAI().catch((e) => {
    console.error("❌ Failed to build Goodwin Grow AI workspace:", e);
    process.exit(1);
  });
}
