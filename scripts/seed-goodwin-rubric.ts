import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";
import { SYSTEM_PERMISSIONS } from "../src/lib/rbac/permissions";

const prisma = new PrismaClient();

export async function seedGoodwinRubric() {
  console.log("🚀 Starting Goodwin Grow AI Comprehensive Rubric & Personas Seeding...");

  // 1. Locate Tenant
  const tenant = await prisma.tenant.findUnique({
    where: { code: "goodwin-grow-ai" },
  });

  if (!tenant) {
    throw new Error("Tenant goodwin-grow-ai not found");
  }
  const tenantId = tenant.id;

  // 2. Ensure all system permissions exist
  for (const p of SYSTEM_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description, module: p.module },
      create: { code: p.code, module: p.module, description: p.description },
    });
  }
  const allPerms = await prisma.permission.findMany();
  const permsMap = new Map(allPerms.map((p) => [p.code, p.id]));

  // 3. Ensure Roles exist
  async function ensureRole(name: string, description: string, codes: string[]) {
    let role = await prisma.role.findFirst({
      where: { tenantId, name },
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          tenantId,
          name,
          description,
          isSystem: true,
        },
      });
    }

    for (const code of codes) {
      const permId = permsMap.get(code);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
          update: {},
          create: { roleId: role.id, permissionId: permId },
        });
      }
    }
    return role;
  }

  const agencyAdminRole = await ensureRole(
    "Agency Admin",
    "Full organization control across clients, creative pods, team, and financials",
    allPerms.map((p) => p.code)
  );

  const accountManagerRole = await ensureRole(
    "Account Manager",
    "Client relationship, pipeline, task, and creative internal review oversight",
    [
      "leads:read", "leads:write", "leads:convert", "leads:export",
      "contacts:read", "contacts:write",
      "companies:read", "companies:write",
      "deals:read", "deals:write", "deals:stages",
      "tasks:read", "tasks:write",
      "activities:log",
      "creatives:read", "creatives:write", "creatives:review_internal", "creatives:version",
      "calendar:read", "calendar:write",
      "clients:read", "clients:write",
      "reports:read",
      "quotations:read", "quotations:write",
    ]
  );

  const designerRole = await ensureRole(
    "Designer",
    "Creative visual production, asset versioning, and feedback review",
    [
      "creatives:read", "creatives:write", "creatives:version",
      "tasks:read", "tasks:write",
      "calendar:read", "calendar:write",
    ]
  );

  const clientRole = await ensureRole(
    "Client",
    "Strict client portal access to assigned deliverables, approvals, and reports",
    [
      "portal:access",
      "creatives:read",
      "creatives:review_client",
      "calendar:read",
      "reports:read",
    ]
  );

  console.log("✅ Configured RBAC roles with precise permissions.");

  // 4. Ensure Clients exist
  let sapna = await prisma.agencyClient.findFirst({
    where: { tenantId, name: "Sapna Washing Point" },
  });
  if (!sapna) {
    sapna = await prisma.agencyClient.create({
      data: {
        tenantId,
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
        status: "ACTIVE",
        onboardingProgress: 100,
        postsPlanned: 12,
        postsCompleted: 8,
        accountManagerName: "Kunal Sharma",
        leadDesignerName: "Pooja Verma",
      },
    });
  }

  let amba = await prisma.agencyClient.findFirst({
    where: { tenantId, name: "Maa Amba Foam & Furnishing" },
  });
  if (!amba) {
    amba = await prisma.agencyClient.create({
      data: {
        tenantId,
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
        status: "ACTIVE",
        onboardingProgress: 100,
        postsPlanned: 20,
        postsCompleted: 14,
        accountManagerName: "Ansh Chourasiya",
        leadDesignerName: "Deepak Joshi",
      },
    });
  }

  // 5. Create Persona User Accounts
  async function ensureUserWithMembership(
    email: string,
    fullName: string,
    passwordPlain: string,
    roleId: string,
    agencyClientId?: string | null,
    isPlatformAdmin: boolean = false
  ) {
    const passwordHash = await hashPassword(passwordPlain);
    const user = await prisma.user.upsert({
      where: { email },
      update: { fullName, passwordHash, isPlatformAdmin, isActive: true },
      create: { email, fullName, passwordHash, isPlatformAdmin, isActive: true },
    });

    const membership = await prisma.tenantMembership.upsert({
      where: { tenantId_userId: { tenantId, userId: user.id } },
      update: {
        agencyClientId: agencyClientId || null,
        status: "ACTIVE",
      },
      create: {
        tenantId,
        userId: user.id,
        agencyClientId: agencyClientId || null,
        status: "ACTIVE",
        isOwner: email === "admin@goodwingrowai.com",
      },
    });

    await prisma.membershipRole.upsert({
      where: { membershipId_roleId: { membershipId: membership.id, roleId } },
      update: {},
      create: { membershipId: membership.id, roleId },
    });

    return { user, membership };
  }

  // Super Admin
  await ensureUserWithMembership(
    "superadmin@goodwingrowai.com",
    "Goodwin Super Admin",
    "GoodwinAdmin@2026!",
    agencyAdminRole.id,
    null,
    true
  );

  // Agency Admin
  await ensureUserWithMembership(
    "admin@goodwingrowai.com",
    "Aarav Singhania (Agency Director)",
    "AgencyAdmin@2026!",
    agencyAdminRole.id,
    null,
    false
  );

  // Account Manager
  const kunalUser = await ensureUserWithMembership(
    "kunal@goodwingrowai.com",
    "Kunal Sharma (Senior Account Manager)",
    "AccountManager@2026!",
    accountManagerRole.id,
    null,
    false
  );

  // Designer
  await ensureUserWithMembership(
    "pooja@goodwingrowai.com",
    "Pooja Verma (Lead Motion & Visual Designer)",
    "Designer@2026!",
    designerRole.id,
    null,
    false
  );

  // Client 1 (Sapna Washing Point)
  await ensureUserWithMembership(
    "client@sapnawashing.in",
    "Rajesh Patidar (Sapna Detailing Owner)",
    "ClientPortal@2026!",
    clientRole.id,
    sapna.id,
    false
  );

  // Client 2 (Maa Amba Furnishing)
  await ensureUserWithMembership(
    "client@ambafurnishing.com",
    "Suresh Agarwal (Amba Living Owner)",
    "ClientPortal@2026!",
    clientRole.id,
    amba.id,
    false
  );

  console.log("✅ Seeded 5 distinct persona user accounts with clean isolation.");

  // 6. Creative Assets covering full 7-stage lifecycle with Versions & Comments
  await prisma.creativeComment.deleteMany({ where: { tenantId } });
  await prisma.creativeVersion.deleteMany({ where: { tenantId } });
  await prisma.creativeAsset.deleteMany({ where: { tenantId } });

  const creativesData = [
    {
      title: "Diwali 30% Off Detailing Spa Carousel",
      assetType: "Instagram 5-Slide Carousel (1080x1350)",
      dimensions: "1080x1350",
      fileUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
      mediaType: "image",
      reviewStatus: "CLIENT_REVIEW", // Awaiting client sign-off
      clientId: sapna.id,
      submittedBy: "Pooja Verma",
      versions: [
        {
          versionNumber: 1,
          fileUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
          mediaType: "image",
          changelog: "v1: Draft slide flow and headline typography",
          submittedBy: "Pooja Verma",
        },
        {
          versionNumber: 2,
          fileUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
          mediaType: "image",
          changelog: "v2: Added WhatsApp booking QR code and festive golden accents",
          submittedBy: "Pooja Verma",
        },
      ],
      comments: [
        {
          versionNumber: 1,
          authorName: "Kunal Sharma",
          authorRole: "Account Manager",
          content: "Internal review note: Please verify brand cyan #06B6D4 matches the approved deck before client sees this.",
          isInternal: true, // INTERNAL NOTE
        },
        {
          versionNumber: 2,
          authorName: "Pooja Verma",
          authorRole: "Designer",
          content: "Colors matched and high-res ceramic gloss slides uploaded for client review.",
          isInternal: false, // CLIENT VISIBLE
        },
      ],
    },
    {
      title: "High-Pressure Snow Foam ASMR & Paint Protection Reel",
      assetType: "Vertical 9:16 Video Reel (1080x1920)",
      dimensions: "1080x1920",
      fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      mediaType: "video", // Video file with HTML5 player support
      reviewStatus: "INTERNAL_REVIEW", // In internal review
      clientId: sapna.id,
      submittedBy: "Deepak Joshi",
      versions: [
        {
          versionNumber: 1,
          fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          mediaType: "video",
          changelog: "v1: Rough video cut with slow-motion foam nozzle audio",
          submittedBy: "Deepak Joshi",
        },
      ],
      comments: [
        {
          versionNumber: 1,
          authorName: "Kunal Sharma",
          authorRole: "Account Manager",
          content: "Internal review: Audio levels on sound effect are slightly high. Please normalize by 3dB.",
          isInternal: true,
        },
      ],
    },
    {
      title: "Orthopaedic Mattress Spinal Alignment & Cooling Layers Infographic",
      assetType: "Technical Infographic Carousel (1080x1350)",
      dimensions: "1080x1350",
      fileUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      mediaType: "image",
      reviewStatus: "CHANGES_REQUESTED", // Changes requested by client
      clientFeedback: "Please enlarge the 100-night trial badge and make doctor endorsement text bold.",
      clientId: amba.id,
      submittedBy: "Deepak Joshi",
      versions: [
        {
          versionNumber: 1,
          fileUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
          mediaType: "image",
          changelog: "v1: Initial 3D layer exploded diagram",
          submittedBy: "Deepak Joshi",
        },
      ],
      comments: [
        {
          versionNumber: 1,
          authorName: "Suresh Agarwal",
          authorRole: "Client",
          content: "The layers look clear, but please make the 10-year warranty icon 20% larger for older customers.",
          isInternal: false,
        },
      ],
    },
    {
      title: "Ceramic Pro Coating 9H Scratch Resistance Testimonial Poster",
      assetType: "Social Media Poster (1080x1080)",
      dimensions: "1080x1080",
      fileUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
      mediaType: "image",
      reviewStatus: "APPROVED", // Approved by client with timestamp and approver recorded
      approverName: "Rajesh Patidar",
      approverEmail: "client@sapnawashing.in",
      approvedAt: new Date(Date.now() - 24 * 3600000),
      clientId: sapna.id,
      submittedBy: "Pooja Verma",
      versions: [
        {
          versionNumber: 1,
          fileUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
          mediaType: "image",
          changelog: "v1: Customer vehicle shine photo with quotes",
          submittedBy: "Pooja Verma",
        },
      ],
      comments: [
        {
          versionNumber: 1,
          authorName: "Rajesh Patidar",
          authorRole: "Client",
          content: "Approved for publishing! Looks crisp and premium.",
          isInternal: false,
        },
      ],
    },
    {
      title: "Weekend Highway Car Spa Express Package Teaser",
      assetType: "Instagram Feed Post",
      dimensions: "1080x1080",
      fileUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
      mediaType: "image",
      reviewStatus: "SCHEDULED", // Scheduled for release
      clientId: sapna.id,
      submittedBy: "Pooja Verma",
      approverName: "Rajesh Patidar",
      approverEmail: "client@sapnawashing.in",
      approvedAt: new Date(Date.now() - 48 * 3600000),
      versions: [
        {
          versionNumber: 1,
          fileUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
          mediaType: "image",
          changelog: "v1: Fast wash package breakdown",
          submittedBy: "Pooja Verma",
        },
      ],
      comments: [],
    },
    {
      title: "Dussehra Auspicious New Car Detailing Celebration Reel",
      assetType: "Instagram Reel",
      dimensions: "1080x1920",
      fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      mediaType: "video",
      reviewStatus: "PUBLISHED", // Published
      clientId: sapna.id,
      submittedBy: "Pooja Verma",
      approverName: "Rajesh Patidar",
      approverEmail: "client@sapnawashing.in",
      approvedAt: new Date(Date.now() - 72 * 3600000),
      versions: [
        {
          versionNumber: 1,
          fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          mediaType: "video",
          changelog: "v1: Live festival celebration cut",
          submittedBy: "Pooja Verma",
        },
      ],
      comments: [],
    },
    {
      title: "Winter Care Underbody Anti-Rust Coating Brief",
      assetType: "Technical Infographic",
      dimensions: "1080x1080",
      fileUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
      mediaType: "image",
      reviewStatus: "DRAFT", // Draft stage
      clientId: sapna.id,
      submittedBy: "Pooja Verma",
      versions: [
        {
          versionNumber: 1,
          fileUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=800",
          mediaType: "image",
          changelog: "v1: Initial concept draft",
          submittedBy: "Pooja Verma",
        },
      ],
      comments: [],
    },
  ];

  for (const c of creativesData) {
    const asset = await prisma.creativeAsset.create({
      data: {
        tenantId,
        clientId: c.clientId,
        title: c.title,
        assetType: c.assetType,
        dimensions: c.dimensions,
        fileUrl: c.fileUrl,
        mediaType: c.mediaType,
        version: c.versions.length,
        reviewStatus: c.reviewStatus as any,
        clientFeedback: c.clientFeedback || null,
        submittedBy: c.submittedBy,
        approverName: c.approverName || null,
        approverEmail: c.approverEmail || null,
        approvedAt: c.approvedAt || null,
        reviewedAt: c.approvedAt || (c.reviewStatus === "CHANGES_REQUESTED" ? new Date() : null),
        versions: {
          create: c.versions.map((v) => ({
            tenantId,
            versionNumber: v.versionNumber,
            fileUrl: v.fileUrl,
            mediaType: v.mediaType,
            changelog: v.changelog,
            submittedBy: v.submittedBy,
          })),
        },
      },
    });

    for (const com of c.comments) {
      await prisma.creativeComment.create({
        data: {
          tenantId,
          assetId: asset.id,
          versionNumber: com.versionNumber,
          authorName: com.authorName,
          authorRole: com.authorRole,
          content: com.content,
          isInternal: com.isInternal,
        },
      });
    }
  }
  console.log(`✅ Seeded ${creativesData.length} creatives covering all 7 lifecycle stages.`);

  // 7. Content Calendar Posts with Overdue Approvals
  await prisma.contentPost.deleteMany({ where: { tenantId } });
  const now = Date.now();
  const postsData = [
    {
      tenantId,
      clientId: sapna.id,
      platform: "INSTAGRAM" as any,
      postType: "5-Slide Carousel",
      title: "Diwali 30% Off Detailing Spa Carousel",
      caption: "Festival season brings traffic, dust, and fireworks fallout. Protect your ride with 9H ceramic coating! Early bird booking open.",
      ownerName: "Pooja Verma",
      deadline: new Date(now - 2 * 86400000), // Overdue deadline!
      approvalStatus: "CLIENT_REVIEW", // Overdue approval!
      scheduledDate: new Date(now + 4 * 86400000),
      status: "SCHEDULED" as any,
      mediaUrl: "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800",
      festivalOrEvent: "Diwali Festive Campaign",
    },
    {
      tenantId,
      clientId: sapna.id,
      platform: "INSTAGRAM" as any,
      postType: "Reel",
      title: "Foam Wash ASMR & Water Beading Demonstration",
      caption: "Satisfying car wash transformation 🚗💦 Watch the water sheet off the hydrophobic shield.",
      ownerName: "Deepak Joshi",
      deadline: new Date(now + 1 * 86400000),
      approvalStatus: "INTERNAL_REVIEW",
      scheduledDate: new Date(now + 3 * 86400000),
      status: "SCHEDULED" as any,
      mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      festivalOrEvent: "Weekly Brand Content",
    },
    {
      tenantId,
      clientId: sapna.id,
      platform: "FACEBOOK" as any,
      postType: "Creative Poster",
      title: "Dhanteras Vehicle Puja Shubh Mahurat Greeting",
      caption: "Welcome prosperity and safety this Dhanteras! Exterior teflon polish included with full interior deep cleaning.",
      ownerName: "Pooja Verma",
      deadline: new Date(now - 3 * 86400000),
      approvalStatus: "APPROVED",
      scheduledDate: new Date(now + 7 * 86400000),
      status: "SCHEDULED" as any,
      mediaUrl: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800",
      festivalOrEvent: "Dhanteras Gold Muhurat",
    },
    {
      tenantId,
      clientId: amba.id,
      platform: "INSTAGRAM" as any,
      postType: "Infographic",
      title: "5 Sleep Postures That Eliminate Lower Back Strain",
      caption: "Dr. recommended ergonomic spine alignment with Amba Ortho-Support Mattresses. 100-night home trial across MP.",
      ownerName: "Deepak Joshi",
      deadline: new Date(now - 1 * 86400000), // Overdue!
      approvalStatus: "CHANGES_REQUESTED",
      scheduledDate: new Date(now + 5 * 86400000),
      status: "SCHEDULED" as any,
      mediaUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800",
      festivalOrEvent: "Educational Health Campaign",
    },
  ];

  for (const post of postsData) {
    await prisma.contentPost.create({ data: post });
  }
  console.log(`✅ Seeded ${postsData.length} content calendar posts with overdue approval alerts.`);

  // 8. Leads with source, service required, deal value, next follow-up, and lost reasons
  await prisma.lead.deleteMany({ where: { tenantId } });
  const leadsData = [
    {
      firstName: "Vikram",
      lastName: "Singhania",
      companyName: "Singhania Logistics & Fleet Services",
      email: "vikram@singhanialogistics.in",
      phone: "+91 98111 22334",
      status: "QUALIFIED" as any,
      source: "Google Ads (High Intent)",
      serviceRequired: "Corporate Fleet Ceramic Spa Retainer",
      dealValue: 480000.0,
      nextFollowUp: new Date(now + 1 * 86400000),
      clientId: sapna.id,
      priority: "HIGH" as any,
      score: 85,
    },
    {
      firstName: "Meenakshi",
      lastName: "Rao",
      companyName: "Rao Luxury Home Interior Design Studio",
      email: "meenakshi@raodesignstudio.com",
      phone: "+91 98222 33445",
      status: "PROPOSAL" as any,
      source: "Meta Lead Gen Form",
      serviceRequired: "Custom Modular Sectional & Mattresses",
      dealValue: 750000.0,
      nextFollowUp: new Date(now + 2 * 86400000),
      clientId: amba.id,
      priority: "URGENT" as any,
      score: 92,
    },
    {
      firstName: "Tarun",
      lastName: "Bansal",
      companyName: "Bansal EV Charging Hubs",
      email: "tarun@bansalev.in",
      phone: "+91 98333 44556",
      status: "LOST" as any,
      source: "Website Direct Inquiry",
      serviceRequired: "Commercial Fleet Detailing",
      dealValue: 250000.0,
      lostReason: "Budget Constraints: Decided to postpone until next quarter",
      clientId: sapna.id,
      priority: "LOW" as any,
      score: 40,
    },
    {
      firstName: "Aditi",
      lastName: "Kapoor",
      companyName: "Kapoor Dental Clinics & Aesthetic Care",
      email: "aditi@kapoordental.com",
      phone: "+91 98444 55667",
      status: "NEW" as any,
      source: "Referral / Word of Mouth",
      serviceRequired: "Google Maps Local SEO & Video Ads",
      dealValue: 180000.0,
      nextFollowUp: new Date(now + 3 * 86400000),
      clientId: sapna.id,
      priority: "MEDIUM" as any,
      score: 65,
    },
  ];

  for (const ld of leadsData) {
    const createdLead = await prisma.lead.create({
      data: {
        tenantId,
        ...ld,
      },
    });

    await prisma.activity.create({
      data: {
        tenantId,
        type: "NOTE",
        title: "Lead Created",
        description: `Lead created for ${ld.firstName} ${ld.lastName} (${ld.companyName}) - Required: ${ld.serviceRequired}`,
        performedById: kunalUser.user.id,
        leadId: createdLead.id,
      },
    });
  }
  console.log(`✅ Seeded ${leadsData.length} leads with required sales & pipeline attributes.`);

  // 9. Tasks with checklist, attachments, recurring, and overdue alerts
  await prisma.task.deleteMany({ where: { tenantId } });
  const tasksData = [
    {
      title: "Deliver Diwali 5-Slide Carousel revisions for Sapna Detailing",
      description: "Implement WhatsApp QR placement and enlarge festive discount badge",
      dueDate: new Date(now - 1 * 86400000), // OVERDUE TASK
      priority: "URGENT" as any,
      status: "PENDING" as any,
      clientId: sapna.id,
      checklist: [
        { id: "1", text: "Check brand cyan #06B6D4 HEX consistency", completed: true },
        { id: "2", text: "Export 1080x1350 PNG with 300 DPI", completed: false },
        { id: "3", text: "Upload to client portal for approval", completed: false },
      ],
      attachments: [
        { name: "Sapna_Brand_Guide_v2.pdf", url: "https://example.com/guide.pdf", size: "2.4 MB" },
      ],
      isRecurring: true,
      recurringInterval: "WEEKLY",
    },
    {
      title: "Review Orthopaedic Mattress Cutaway Diagram with Suresh Agarwal",
      description: "Present 3D exploded view comparing pocket spring vs memory foam layers",
      dueDate: new Date(now + 2 * 86400000),
      priority: "HIGH" as any,
      status: "IN_PROGRESS" as any,
      clientId: amba.id,
      checklist: [
        { id: "1", text: "Highlight doctor orthopaedic endorsement badge", completed: true },
        { id: "2", text: "Prepare side-by-side comparison slide", completed: true },
      ],
      attachments: [],
      isRecurring: false,
    },
    {
      title: "Schedule Weekly Meta Performance & ROAS Call with Kunal",
      description: "Analyze Swiggy/Zomato direct attribution vs Meta hyper-local ads performance",
      dueDate: new Date(now + 3 * 86400000),
      priority: "MEDIUM" as any,
      status: "PENDING" as any,
      clientId: sapna.id,
      checklist: [
        { id: "1", text: "Pull Meta Ad Manager CPL figures for Indore", completed: false },
        { id: "2", text: "Verify WhatsApp chat conversion numbers", completed: false },
      ],
      isRecurring: true,
      recurringInterval: "BIWEEKLY",
    },
  ];

  for (const t of tasksData) {
    await prisma.task.create({
      data: {
        tenantId,
        ...t,
      },
    });
  }
  console.log(`✅ Seeded ${tasksData.length} tasks with checklists, attachments, and recurring configuration.`);

  console.log("🎉 Complete Rubric & Personas Seeding Finished Successfully!");
}

if (process.argv[1]?.includes("seed-goodwin-rubric")) {
  seedGoodwinRubric()
    .catch((e) => {
      console.error("❌ Failed to seed rubric:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
