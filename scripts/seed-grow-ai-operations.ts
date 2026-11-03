import { PrismaClient, PostPlatform, PostStatus, CreativeReviewStatus, AdPlatform, AdStatus, TaskPriority, AgencyWorkflowStage, ProjectStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function seedGrowAIOperations() {
  console.log("🚀 Starting Goodwin Grow AI operational data seeder...");

  const tenant = await prisma.tenant.findUnique({
    where: { code: "goodwin-grow-ai" },
    include: {
      agencyClients: true,
      memberships: { include: { user: true } },
    },
  });

  if (!tenant) {
    console.error("❌ Goodwin Grow AI tenant not found!");
    return;
  }

  const tenantId = tenant.id;
  const clients = tenant.agencyClients;
  console.log(`Found ${clients.length} clients in Goodwin Grow AI.`);

  const assignees = [
    { name: "Rajnish Chauhan", role: "Agency Director" },
    { name: "Kunal Sen", role: "Growth Specialist" },
    { name: "Ansh Chourasiya", role: "Account Lead" },
    { name: "Pooja Verma", role: "Creative Lead" },
    { name: "Arjun Nair", role: "Performance Media Buyer" },
  ];

  for (const client of clients) {
    console.log(`Processing operational data for: ${client.name} (${client.brandName})...`);

    // 1. Projects
    const project1 = await prisma.agencyProject.create({
      data: {
        tenantId,
        clientId: client.id,
        name: `${client.brandName || client.name} - Q4 Growth Retainer`,
        description: `Full funnel digital growth sprint for ${client.industry}. Content creation, creative design, and multi-channel campaign management.`,
        deliverableType: "Monthly Social & Brand Retainer",
        status: ProjectStatus.IN_PROGRESS,
        budget: Number(client.monthlyRetainer) * 3,
        startDate: new Date("2026-10-01"),
        dueDate: new Date("2026-12-31"),
        assigneeName: "Rajnish Chauhan",
        progressPercent: 68,
      },
    });

    const project2 = await prisma.agencyProject.create({
      data: {
        tenantId,
        clientId: client.id,
        name: `${client.brandName || client.name} - Performance Ads & Local SEO`,
        description: `Direct response Meta/Google lead generation engine paired with high-intent Local SEO ranking optimization.`,
        deliverableType: "Performance Marketing & SEO",
        status: ProjectStatus.IN_PROGRESS,
        budget: Number(client.monthlyRetainer) * 2,
        startDate: new Date("2026-10-15"),
        dueDate: new Date("2026-11-30"),
        assigneeName: "Kunal Sen",
        progressPercent: 45,
      },
    });

    // 2. Agency Tasks
    const taskDefs = [
      {
        projectId: project1.id,
        title: `November Content Calendar & Reel Concepts for ${client.brandName}`,
        stage: AgencyWorkflowStage.INTERNAL_REVIEW,
        priority: TaskPriority.HIGH,
        assignee: assignees[3],
        preview: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
      },
      {
        projectId: project1.id,
        title: `Festival Season Carousel Design & Copywriting`,
        stage: AgencyWorkflowStage.CLIENT_APPROVAL,
        priority: TaskPriority.URGENT,
        assignee: assignees[1],
        preview: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80",
      },
      {
        projectId: project2.id,
        title: `High-Converting Lead Gen Ad Copy & Video Variations`,
        stage: AgencyWorkflowStage.SCHEDULED,
        priority: TaskPriority.HIGH,
        assignee: assignees[4],
        preview: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
      },
      {
        projectId: project2.id,
        title: `Google Business Profile & Citation Boost`,
        stage: AgencyWorkflowStage.PUBLISHED,
        priority: TaskPriority.MEDIUM,
        assignee: assignees[2],
        preview: null,
      },
    ];

    for (const td of taskDefs) {
      await prisma.agencyTask.create({
        data: {
          tenantId,
          clientId: client.id,
          projectId: td.projectId,
          title: td.title,
          description: `Deliverable task for ${client.name} within agreed monthly retainer SLA.`,
          stage: td.stage,
          priority: td.priority,
          assigneeName: td.assignee.name,
          assigneeRole: td.assignee.role,
          dueDate: new Date(Date.now() + 5 * 86400000),
          commentsCount: 2,
          assetPreview: td.preview,
        },
      });
    }

    // 3. Creative Assets
    const creative1 = await prisma.creativeAsset.create({
      data: {
        tenantId,
        clientId: client.id,
        title: `${client.brandName} - Hero Brand Reel & Cover Artwork`,
        assetType: "Video / Motion Graphic",
        dimensions: "1080x1920",
        fileUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        version: 2,
        reviewStatus: CreativeReviewStatus.CLIENT_REVIEW,
        clientFeedback: "Please make the logo 10% larger on the end card and highlight the festive offer badge.",
        submittedBy: "Pooja Verma",
        approverName: client.name,
        approverEmail: client.email,
        reviewedAt: new Date(),
        versions: {
          create: [
            {
              tenantId,
              versionNumber: 1,
              fileUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
              mediaType: "image",
              changelog: "Initial high-fidelity draft submitted for review",
              submittedBy: "Pooja Verma",
            },
            {
              tenantId,
              versionNumber: 2,
              fileUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
              mediaType: "image",
              changelog: "Updated with bold festive typography and enhanced CTA button",
              submittedBy: "Pooja Verma",
            },
          ],
        },
        comments: {
          create: [
            {
              tenantId,
              versionNumber: 2,
              authorName: client.name,
              authorRole: "Client Reviewer",
              content: "Looks fantastic! Just tweak the offer font color to gold and we will approve for dispatch.",
              isInternal: false,
            },
            {
              tenantId,
              versionNumber: 2,
              authorName: "Rajnish Chauhan",
              authorRole: "Agency Director",
              content: "Pooja, please finalize the color grade today so we can publish on Friday.",
              isInternal: true,
            },
          ],
        },
      },
    });

    const creative2 = await prisma.creativeAsset.create({
      data: {
        tenantId,
        clientId: client.id,
        title: `${client.brandName} - Carousel: 5 Core Value Pillars`,
        assetType: "Square Carousel Graphic",
        dimensions: "1080x1080",
        fileUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80",
        mediaType: "image",
        version: 1,
        reviewStatus: CreativeReviewStatus.APPROVED,
        submittedBy: "Pooja Verma",
        approverName: "Rajnish Chauhan",
        approvedAt: new Date(),
      },
    });

    // 4. Content Posts (Calendar)
    await prisma.contentPost.create({
      data: {
        tenantId,
        clientId: client.id,
        platform: PostPlatform.INSTAGRAM,
        postType: "Reel",
        title: `Spotlight Showcase: What makes ${client.brandName} exceptional`,
        caption: `Discover our signature solutions designed with passion and precision. Book a private consultation today!\n\n#${client.brandName?.replace(/\s+/g, '')} #Excellence #TrendingNow`,
        hashtags: "#Growth #PremiumQuality #IndiaBusiness",
        mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
        ownerName: "Pooja Verma",
        scheduledDate: new Date(Date.now() + 2 * 86400000),
        status: PostStatus.SCHEDULED,
        approvalStatus: "SCHEDULED",
        festivalOrEvent: "Weekend Brand Spotlight",
        reach: 4850,
        likes: 342,
        comments: 29,
        shares: 18,
      },
    });

    await prisma.contentPost.create({
      data: {
        tenantId,
        clientId: client.id,
        platform: PostPlatform.LINKEDIN,
        postType: "Article & Infographic",
        title: `Industry Insights: The Future of ${client.industry}`,
        caption: `In-depth analysis by ${client.brandName} on how modern operational excellence drives sustainable business growth.`,
        hashtags: "#Leadership #BusinessStrategy #GrowthMindset",
        mediaUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
        ownerName: "Rajnish Chauhan",
        scheduledDate: new Date(Date.now() + 4 * 86400000),
        status: PostStatus.SCHEDULED,
        approvalStatus: "SCHEDULED",
        festivalOrEvent: "Thought Leadership Series",
        reach: 2200,
        likes: 184,
        comments: 19,
        shares: 12,
      },
    });

    // 5. Ad Campaigns (Meta & Google)
    await prisma.adCampaign.create({
      data: {
        tenantId,
        clientId: client.id,
        platform: AdPlatform.META,
        campaignName: `${client.brandName} - Meta Lead Gen & WhatsApp Clicks`,
        objective: "Lead Generation",
        budget: 45000,
        spent: 31200,
        leadsCount: 148,
        cpl: 210.81,
        roas: 4.8,
        impressions: 114500,
        clicks: 3420,
        status: AdStatus.ACTIVE,
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-11-30"),
      },
    });

    await prisma.adCampaign.create({
      data: {
        tenantId,
        clientId: client.id,
        platform: AdPlatform.GOOGLE,
        campaignName: `${client.brandName} - High Intent Search Ads`,
        objective: "Conversions & Calls",
        budget: 60000,
        spent: 42100,
        leadsCount: 92,
        cpl: 457.6,
        roas: 5.4,
        impressions: 48900,
        clicks: 2890,
        status: AdStatus.ACTIVE,
        startDate: new Date("2026-10-01"),
        endDate: new Date("2026-11-30"),
      },
    });

    // 6. SEO Trackers
    const keywords = [
      { kw: `best ${client.industry} services in MP`, rank: 2, prevRank: 5, vol: 1800, diff: 32 },
      { kw: `${client.brandName} contact & price`, rank: 1, prevRank: 1, vol: 3200, diff: 15 },
      { kw: `top rated ${client.industry} specialist`, rank: 4, prevRank: 8, vol: 950, diff: 45 },
    ];

    for (const k of keywords) {
      await prisma.seoTracker.create({
        data: {
          tenantId,
          clientId: client.id,
          keyword: k.kw,
          targetUrl: client.website || "https://goodwingrowai.com",
          currentRank: k.rank,
          previousRank: k.prevRank,
          searchVolume: k.vol,
          difficulty: k.diff,
          gbpScore: 92,
          backlinksCount: 48,
          lastAuditedAt: new Date(),
        },
      });
    }
  }

  console.log("✅ Successfully seeded rich operational data across all 8 clients in Goodwin Grow AI!");
}

seedGrowAIOperations()
  .catch((e) => {
    console.error("Error seeding operations:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
