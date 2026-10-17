import { PrismaClient } from "@prisma/client";

export async function buildGoodwinBatteries(existingPrisma?: PrismaClient) {
  const prisma = existingPrisma || new PrismaClient();
  const shouldDisconnect = !existingPrisma;
  try {
    console.log("⚡ Building Goodwin Batteries CRM Organization Workspace (goodwin-batteries)...");

  // 1. Locate the Goodwin Batteries tenant
  const tenant = await prisma.tenant.findUnique({
    where: { code: "goodwin-batteries" },
    include: {
      settings: true,
      pipelines: { include: { stages: { orderBy: { orderIndex: "asc" } } } },
      memberships: { include: { user: true } },
    },
  });

  if (!tenant) {
    throw new Error("Tenant with code 'goodwin-batteries' not found.");
  }

  const tenantId = tenant.id;
  console.log(`✅ Located Goodwin Batteries Tenant: ${tenant.name} (${tenantId})`);

  // Identify Sales Manager user or Admin user for assignments
  const salesUser = tenant.memberships.find(
    (m) => m.user.email === "sales@goodwinbatteries.com"
  )?.user || tenant.memberships[0]?.user;

  if (!salesUser) {
    throw new Error("No user found in Goodwin Batteries tenant.");
  }

  // 2. Enrich Tenant Settings with Battery Manufacturing & Corporate Information
  await prisma.tenantSettings.upsert({
    where: { tenantId },
    update: {
      businessEmail: "contact@goodwinbatteries.com",
      phone: "+91 98765 43210",
      website: "https://goodwinbatteries.com",
      address: "Plot 42, Goodwin Battery Industrial Park, Phase II, IMT Manesar, Gurugram, Haryana - 122050",
      country: "India",
      currency: "INR",
      timezone: "Asia/Kolkata",
    },
    create: {
      tenantId,
      businessEmail: "contact@goodwinbatteries.com",
      phone: "+91 98765 43210",
      website: "https://goodwinbatteries.com",
      address: "Plot 42, Goodwin Battery Industrial Park, Phase II, IMT Manesar, Gurugram, Haryana - 122050",
      country: "India",
      currency: "INR",
      timezone: "Asia/Kolkata",
      seatLimit: 25,
    },
  });
  console.log("✅ Updated Goodwin Batteries corporate profile & settings.");

  // 3. Products Catalog: Mapped to Market Competitors (Exide, Amaron, Tata Green, Luminous, Livguard, Okaya, SF Sonic, Microtek, Eastman, HBL, CATL, BYD, LG, Panasonic, GS Yuasa, Bosch, VARTA)
  const batteryProducts = [
    {
      name: "Goodwin PowerDrive Neo (12V 5Ah)",
      sku: "GB-PD-1205",
      description: "Two-Wheeler VRLA Maintenance-Free AGM Battery. Anti-vibration matrix, instant cranking. Direct market benchmark against Amaron Pro Bike Rider, Exide Xplore, SF Sonic, and Tata Green Velocity. 48-Month Warranty.",
      unitPrice: 1450.0,
      currency: "INR",
    },
    {
      name: "Goodwin PowerDrive Max (12V 9Ah)",
      sku: "GB-PD-1209",
      description: "Heavy-displacement cruiser & sports motorcycle high-CCA battery. Competing with Amaron & Exide. 48-Month Warranty.",
      unitPrice: 2350.0,
      currency: "INR",
    },
    {
      name: "Goodwin DuraVolt Apex (12V 45Ah)",
      sku: "GB-DV-1245",
      description: "Passenger Car Silver-Alloy Starter Battery. High temperature endurance, ultra-low water loss. Competing with Amaron Hi-Life, Exide Mileage, Bosch S4 Mega Power, and VARTA Blue Dynamic. 60-Month Warranty.",
      unitPrice: 5400.0,
      currency: "INR",
    },
    {
      name: "Goodwin DuraVolt Ultra (12V 65Ah)",
      sku: "GB-DV-1265",
      description: "Heavy-duty SUV & Diesel passenger car high-cranking battery. Engineered for extreme duty cycles. Competing with Amaron Flo, Exide Matrix, and Bosch Automotive. 66-Month Warranty.",
      unitPrice: 7800.0,
      currency: "INR",
    },
    {
      name: "Goodwin HeavyTorque Max (12V 150Ah)",
      sku: "GB-HT-12150",
      description: "Heavy Commercial Vehicle, Multi-Axle Truck & Tractor battery. Hybrid alloy plate design, rough terrain surge-proof. Competing with Exide Express, Amaron Shield, and Bosch T3. 36-Month Commercial Warranty.",
      unitPrice: 13500.0,
      currency: "INR",
    },
    {
      name: "Goodwin SuperTubular Pro (12V 150Ah)",
      sku: "GB-ST-12150",
      description: "High-purity tall tubular inverter battery with ceramic vent plugs. 1400+ cycles at 80% DOD. Competing directly with Luminous Red Charge, Livguard Invertuff, and Microtek Dura Strong. 54-Month Warranty.",
      unitPrice: 14200.0,
      currency: "INR",
    },
    {
      name: "Goodwin SuperTubular Jumbo (12V 220Ah)",
      sku: "GB-ST-12220",
      description: "Heavy commercial backup tall tubular battery for extended power outages. Competing with Luminous ILTT and Microtek Jumbo. 60-Month Warranty.",
      unitPrice: 18900.0,
      currency: "INR",
    },
    {
      name: "Goodwin SolarCell Ultra C10 (12V 200Ah)",
      sku: "GB-SC-12200",
      description: "C10-rated deep-cycle solar tubular battery for residential and commercial rooftop solar installations. Low self-discharge rate. Competing with Luminous Solar, Eastman Solar, and Livguard Solar. 60-Month Warranty.",
      unitPrice: 17500.0,
      currency: "INR",
    },
    {
      name: "Goodwin E-Charge LFP 48V 100Ah (4.8kWh)",
      sku: "GB-EC-48100",
      description: "High-rate LiFePO4 E-Rickshaw & Light EV smart battery pack. Integrated CAN/Bluetooth Smart BMS, 3500+ cycles, IP67 enclosure, 2-hour fast charge. Direct benchmark against Okaya Ferrato, CATL LFP, and BYD Blade modules. 36-Month Full Replacement Warranty.",
      unitPrice: 62000.0,
      currency: "INR",
    },
    {
      name: "Goodwin E-Charge LFP 60V 50Ah (3.0kWh)",
      sku: "GB-EC-6050",
      description: "Smart Lithium-ion NMC/LFP swappable battery pack for electric delivery scooters and high-speed e-bikes. Competing with LG Energy Solution, CATL, and Panasonic Energy. 36-Month Warranty.",
      unitPrice: 44000.0,
      currency: "INR",
    },
    {
      name: "Goodwin InduPower VRLA 2V 500Ah",
      sku: "GB-IP-20500",
      description: "2-Volt Stationary lead-acid industrial cell for telecom towers, substations, data centers, and railways. Competing with HBL Nife, GS Yuasa Industrial, and Exide Powersafe. 20-Year Design Float Life.",
      unitPrice: 16800.0,
      currency: "INR",
    },
    {
      name: "Goodwin MegaWatt C&I ESS Rack 51.2V 200Ah (10.24kWh)",
      sku: "GB-ESS-10KWH",
      description: "Modular lithium energy storage rack for commercial & industrial microgrids and peak-shaving. Competing with CATL EnerC, BYD Chess, and LG Resu Prime. 6000+ cycle life.",
      unitPrice: 185000.0,
      currency: "INR",
    },
  ];

  const createdProducts: Record<string, any> = {};

  for (const p of batteryProducts) {
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
  console.log(`✅ Loaded ${Object.keys(createdProducts).length} Goodwin Batteries products into catalog.`);

  // 4. B2B Companies (Distributors, EV Fleet Operators, Solar EPCs, Logistics)
  const companiesData = [
    {
      name: "Zenith Automotive Dealerships & Spares",
      industry: "Automotive Parts & Distributor Network",
      website: "https://zenithauto.in",
      phone: "+91 98111 22334",
      email: "procurement@zenithauto.in",
      city: "New Delhi",
      state: "Delhi NCR",
      country: "India",
    },
    {
      name: "Surat Green Fleet Mobility Pvt Ltd",
      industry: "Electric Commercial Fleet (E-Rickshaw & 3W)",
      website: "https://suratgreenfleet.com",
      phone: "+91 98222 33445",
      email: "operations@suratgreenfleet.com",
      city: "Surat",
      state: "Gujarat",
      country: "India",
    },
    {
      name: "Apex Heavy Logistics & Transport Ltd",
      industry: "Interstate Freight & Commercial Fleet",
      website: "https://apexlogistics.in",
      phone: "+91 98333 44556",
      email: "fleet@apexlogistics.in",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
    },
    {
      name: "SunRay Solar EPC Powertech",
      industry: "Rooftop & Microgrid Solar Installations",
      website: "https://sunraysolarpower.in",
      phone: "+91 98444 66778",
      email: "projects@sunraysolarpower.in",
      city: "Jaipur",
      state: "Rajasthan",
      country: "India",
    },
    {
      name: "Bharat Telecom Infra Grid",
      industry: "Cellular Towers & Telecom Infrastructure",
      website: "https://bharatinfragrid.com",
      phone: "+91 98555 77889",
      email: "energy@bharatinfragrid.com",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
    },
    {
      name: "VoltRide Electric Scooters Pvt Ltd",
      industry: "Electric 2-Wheeler OEM Manufacturer",
      website: "https://voltridescooters.com",
      phone: "+91 98666 88990",
      email: "supplychain@voltridescooters.com",
      city: "Chennai",
      state: "Tamil Nadu",
      country: "India",
    },
    {
      name: "Kisan Agro Tractors & Implements",
      industry: "Agricultural Machinery & Spares Wholesale",
      website: "https://kisanagrotractors.in",
      phone: "+91 98777 99001",
      email: "contact@kisanagrotractors.in",
      city: "Ludhiana",
      state: "Punjab",
      country: "India",
    },
    {
      name: "Mahalaxmi Auto Electricals Wholesale",
      industry: "Wholesale Battery & Electrical Hub",
      website: "https://mahalaxmiauto.in",
      phone: "+91 98888 11223",
      email: "sales@mahalaxmiauto.in",
      city: "Kolkata",
      state: "West Bengal",
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
          assignedOwnerId: salesUser.id,
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
          assignedOwnerId: salesUser.id,
        },
      });
    }
  }
  console.log(`✅ Configured ${Object.keys(createdCompanies).length} B2B client accounts for Goodwin Batteries.`);

  // 5. Contacts (Key Decision Makers & Procurement Heads)
  const contactsData = [
    {
      companyName: "Zenith Automotive Dealerships & Spares",
      firstName: "Amit",
      lastName: "Verma",
      email: "amit@zenithauto.in",
      phone: "+91 98111 22334",
      jobTitle: "Managing Director",
      tags: ["Key Decision Maker", "Automotive", "Distributor Partner"],
    },
    {
      companyName: "Surat Green Fleet Mobility Pvt Ltd",
      firstName: "Sunita",
      lastName: "Patel",
      email: "sunita@suratgreenfleet.com",
      phone: "+91 98222 33445",
      jobTitle: "Fleet & Operations Director",
      tags: ["EV Fleet", "Lithium Transition", "Urgent Buyer"],
    },
    {
      companyName: "Apex Heavy Logistics & Transport Ltd",
      firstName: "Rajesh",
      lastName: "Gupta",
      email: "rajesh@apexlogistics.in",
      phone: "+91 98444 55667",
      jobTitle: "Chief Procurement Officer",
      tags: ["Commercial Fleet", "Heavy Transport", "Exide Replacement"],
    },
    {
      companyName: "SunRay Solar EPC Powertech",
      firstName: "Aditya",
      lastName: "Singhania",
      email: "aditya@sunraysolarpower.in",
      phone: "+91 98444 66778",
      jobTitle: "Head of Solar Engineering & EPC",
      tags: ["Solar C10", "Tubular", "Eastman Benchmark"],
    },
    {
      companyName: "Bharat Telecom Infra Grid",
      firstName: "Dr. K. S.",
      lastName: "Ramanathan",
      email: "ramanathan@bharatinfragrid.com",
      phone: "+91 98555 77889",
      jobTitle: "VP Infrastructure & Energy Systems",
      tags: ["Telecom UPS", "Industrial 2V", "HBL Evaluation"],
    },
    {
      companyName: "VoltRide Electric Scooters Pvt Ltd",
      firstName: "Naveen",
      lastName: "Chandran",
      email: "naveen@voltridescooters.com",
      phone: "+91 98666 88990",
      jobTitle: "Chief Technology Officer",
      tags: ["EV OEM", "Lithium NMC/LFP", "CATL Benchmark"],
    },
    {
      companyName: "Kisan Agro Tractors & Implements",
      firstName: "Gurpreet Singh",
      lastName: "Dhillon",
      email: "gurpreet@kisanagrotractors.in",
      phone: "+91 98777 99001",
      jobTitle: "Managing Partner",
      tags: ["Tractor Batteries", "Heavy Duty", "Punjab Network"],
    },
    {
      companyName: "Mahalaxmi Auto Electricals Wholesale",
      firstName: "Bikram",
      lastName: "Sen",
      email: "bikram@mahalaxmiauto.in",
      phone: "+91 98888 11223",
      jobTitle: "Senior Commercial Partner",
      tags: ["Eastern Region", "Wholesale", "Amaron/Exide Stockist"],
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
          assignedOwnerId: salesUser.id,
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
          assignedOwnerId: salesUser.id,
        },
      });
    }
  }
  console.log(`✅ Loaded ${Object.keys(createdContacts).length} executive contacts for Goodwin Batteries.`);

  // 6. Enriched Leads with Real Competitor Benchmarks (Exide, Amaron, Tata Green, Luminous, Okaya, Eastman, HBL, CATL, BYD)
  const leadsData = [
    {
      firstName: "Mahesh",
      lastName: "Sharma",
      companyName: "Haryana E-Vehicle Distributors",
      email: "mahesh@haryanaevhub.com",
      phone: "+91 98123 45678",
      status: "QUALIFIED",
      priority: "URGENT",
      source: "EV India Expo",
      score: 94,
      tags: ["Competitor: Okaya", "E-Rickshaw", "LFP Lithium", "North India Hub"],
    },
    {
      firstName: "Pooja",
      lastName: "Deshmukh",
      companyName: "Western Maharashtra Auto Parts Association",
      email: "pooja@deshmukhauto.in",
      phone: "+91 98234 56789",
      status: "CONTACTED",
      priority: "HIGH",
      source: "Distributor Inbound",
      score: 86,
      tags: ["Competitor: Amaron", "Competitor: Exide", "Two-Wheeler", "Automotive Car"],
    },
    {
      firstName: "Deepak",
      lastName: "Agarwal",
      companyName: "Thar Solar Microgrids & Rooftop EPC",
      email: "deepak@tharsolar.com",
      phone: "+91 98345 67890",
      status: "PROPOSAL",
      priority: "HIGH",
      source: "Solar EPC Trade Directory",
      score: 89,
      tags: ["Competitor: Eastman", "Competitor: Luminous", "Solar C10 Tubular", "Off-Grid"],
    },
    {
      firstName: "Col. R. K.",
      lastName: "Nair (Retd.)",
      companyName: "Southern Microgrid & Industrial UPS Ltd",
      email: "rknair@southernmicrogrid.com",
      phone: "+91 98456 78901",
      status: "NEW",
      priority: "MEDIUM",
      source: "Tender Portal",
      score: 76,
      tags: ["Competitor: HBL", "Industrial 2V", "Substation Backup", "Defense Spec"],
    },
    {
      firstName: "Anand",
      lastName: "Swaminathan",
      companyName: "Swaminathan Delivery Logistics Fleet",
      email: "anand@swaminathanfleet.in",
      phone: "+91 98567 89012",
      status: "QUALIFIED",
      priority: "HIGH",
      source: "OEM Referral",
      score: 91,
      tags: ["Competitor: CATL", "Competitor: BYD", "Light EV 60V", "Last-Mile Delivery"],
    },
    {
      firstName: "Harish",
      lastName: "Rawat",
      companyName: "Himalayan Spares & Heavy Commercial Spares",
      email: "harish@himalayanspares.in",
      phone: "+91 98678 90123",
      status: "NEW",
      priority: "LOW",
      source: "Cold Outreach",
      score: 64,
      tags: ["Competitor: Exide", "Commercial Truck", "Cold Cranking Amps", "High Altitude"],
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
          assignedOwnerId: salesUser.id,
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
          assignedOwnerId: salesUser.id,
        },
      });
    }
  }
  console.log("✅ Seeded competitor-benchmarked leads for Goodwin Batteries.");

  // 7. Pipeline Stages & High-Value B2B Deals
  const stages = tenant.pipelines[0]?.stages || [];
  if (stages.length >= 6) {
    const [newLeadStage, contactedStage, qualifiedStage, proposalStage, negotiationStage, wonStage] = stages;

    const dealsData = [
      {
        title: "Apex Logistics 300-Truck Fleet HeavyTorque Battery Contract",
        companyName: "Apex Heavy Logistics & Transport Ltd",
        contactEmail: "rajesh@apexlogistics.in",
        stage: negotiationStage,
        value: 4050000.0, // 300 units @ ~13,500
        probability: negotiationStage.winProbability,
        status: "OPEN",
        expectedCloseDate: new Date(Date.now() + 15 * 86400000),
      },
      {
        title: "Surat E-Rickshaw Fleet 120-Unit LFP Conversion Package",
        companyName: "Surat Green Fleet Mobility Pvt Ltd",
        contactEmail: "sunita@suratgreenfleet.com",
        stage: proposalStage,
        value: 7440000.0, // 120 units @ 62,000
        probability: proposalStage.winProbability,
        status: "OPEN",
        expectedCloseDate: new Date(Date.now() + 20 * 86400000),
      },
      {
        title: "SunRay Solar 350-Unit SolarCell Ultra C10 Microgrid Contract",
        companyName: "SunRay Solar EPC Powertech",
        contactEmail: "aditya@sunraysolarpower.in",
        stage: qualifiedStage,
        value: 6125000.0, // 350 units @ 17,500
        probability: qualifiedStage.winProbability,
        status: "OPEN",
        expectedCloseDate: new Date(Date.now() + 30 * 86400000),
      },
      {
        title: "Zenith Automotive 1,500-Unit Starter & Bike Battery Opening Stock",
        companyName: "Zenith Automotive Dealerships & Spares",
        contactEmail: "amit@zenithauto.in",
        stage: proposalStage,
        value: 4850000.0,
        probability: proposalStage.winProbability,
        status: "OPEN",
        expectedCloseDate: new Date(Date.now() + 25 * 86400000),
      },
      {
        title: "Bharat Telecom 150-Site Industrial 2V Battery Bank Modernization",
        companyName: "Bharat Telecom Infra Grid",
        contactEmail: "ramanathan@bharatinfragrid.com",
        stage: contactedStage,
        value: 8400000.0,
        probability: contactedStage.winProbability,
        status: "OPEN",
        expectedCloseDate: new Date(Date.now() + 45 * 86400000),
      },
      {
        title: "VoltRide EV Scooters Pilot Batch 200 Lithium NMC/LFP Packs",
        companyName: "VoltRide Electric Scooters Pvt Ltd",
        contactEmail: "naveen@voltridescooters.com",
        stage: qualifiedStage,
        value: 8800000.0,
        probability: qualifiedStage.winProbability,
        status: "OPEN",
        expectedCloseDate: new Date(Date.now() + 40 * 86400000),
      },
      {
        title: "Kisan Agro Punjab Tractor Battery Seasonal Supply Order",
        companyName: "Kisan Agro Tractors & Implements",
        contactEmail: "gurpreet@kisanagrotractors.in",
        stage: wonStage,
        value: 2025000.0,
        probability: 100,
        status: "WON",
        expectedCloseDate: new Date(Date.now() - 5 * 86400000),
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
            assignedOwnerId: salesUser.id,
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
            assignedOwnerId: salesUser.id,
          },
        });
      }
    }
    console.log("✅ Configured sales pipeline deals for Goodwin Batteries.");
  }

  // 8. Commercial Quotations with Detailed Line Items & Warranty Terms
  const ecProduct = createdProducts["GB-EC-48100"]; // Goodwin E-Charge LFP 48V 100Ah
  const htProduct = createdProducts["GB-HT-12150"]; // Goodwin HeavyTorque 12V 150Ah
  const scProduct = createdProducts["GB-SC-12200"]; // Goodwin SolarCell Ultra C10 200Ah

  const quotationsData = [
    {
      quotationNumber: "QT-GB-2026-001",
      companyName: "Surat Green Fleet Mobility Pvt Ltd",
      contactEmail: "sunita@suratgreenfleet.com",
      status: "SENT",
      subtotal: 4960000.0, // 80 units @ 62,000
      discountAmount: 248000.0, // 5% bulk distributor discount
      taxAmount: 848160.0, // 18% GST on Lithium Battery Packs
      totalAmount: 5560160.0,
      validUntil: new Date(Date.now() + 30 * 86400000),
      terms: "1. Warranty: 36 Months full replacement with smart telemetry BMS monitoring.\n2. Payment: 30% advance with PO, 70% against delivery.\n3. Scrap credit: ₹1,800 buyback credit per returned lead-acid spent battery core.\n4. Free doorstep fleet commissioning & fast-charger calibration in Surat.",
      items: [
        {
          productId: ecProduct?.id,
          description: "Goodwin E-Charge LFP 48V 100Ah (4.8kWh) Smart Bluetooth BMS Pack",
          quantity: 80,
          unitPrice: 62000.0,
          subtotal: 4960000.0,
        },
      ],
    },
    {
      quotationNumber: "QT-GB-2026-002",
      companyName: "Apex Heavy Logistics & Transport Ltd",
      contactEmail: "rajesh@apexlogistics.in",
      status: "ACCEPTED",
      subtotal: 3375000.0, // 250 units @ 13,500
      discountAmount: 202500.0, // 6% fleet contract discount
      taxAmount: 888300.0, // 28% GST on commercial automotive starter lead-acid batteries
      totalAmount: 4060800.0,
      validUntil: new Date(Date.now() + 45 * 86400000),
      terms: "1. Comprehensive 36-Month commercial breakdown replacement warranty across all NH-48 transport checkpoints.\n2. Delivery: In 3 scheduled batches of 80, 85, and 85 units.\n3. Dedicated emergency battery swap hotline provided.\n4. Competing proposal Exide Express benchmark exceeded with 15% higher CCA rating.",
      items: [
        {
          productId: htProduct?.id,
          description: "Goodwin HeavyTorque Max (12V 150Ah) Commercial Fleet Battery",
          quantity: 250,
          unitPrice: 13500.0,
          subtotal: 3375000.0,
        },
      ],
    },
    {
      quotationNumber: "QT-GB-2026-003",
      companyName: "SunRay Solar EPC Powertech",
      contactEmail: "aditya@sunraysolarpower.in",
      status: "DRAFT",
      subtotal: 5250000.0, // 300 units @ 17,500
      discountAmount: 262500.0, // 5% solar contractor pricing
      taxAmount: 598500.0, // 12% concessional solar battery GST
      totalAmount: 5586000.0,
      validUntil: new Date(Date.now() + 60 * 86400000),
      terms: "1. 60 Months performance warranty for deep-discharge solar off-grid cycles.\n2. C10 rate tested up to 1500 cycles at 80% Depth of Discharge.\n3. Factory sealed with ceramic micro-porous vent plugs.\n4. Free transit insurance included up to project sites in Jaipur & Jodhpur.",
      items: [
        {
          productId: scProduct?.id,
          description: "Goodwin SolarCell Ultra C10 (12V 200Ah) Deep-Cycle Solar Tubular Battery",
          quantity: 300,
          unitPrice: 17500.0,
          subtotal: 5250000.0,
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
          createdById: salesUser.id,
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
  console.log("✅ Created commercial quotations with line items for Goodwin Batteries.");

  // 9. Actionable Tasks & Calendar Agendas
  const tasksData = [
    {
      title: "Conduct on-site battery discharge test for Surat E-Rickshaw fleet",
      description: "Perform 1C and 0.5C discharge curve testing at Surat depot and compare with Okaya lead-acid telemetry.",
      priority: "HIGH",
      status: "PENDING",
      dueDate: new Date(Date.now() + 2 * 86400000),
      contactEmail: "sunita@suratgreenfleet.com",
    },
    {
      title: "Submit price-performance matrix (Goodwin LFP vs Okaya/CATL) to Surat Fleet",
      description: "Email total cost of ownership (TCO) breakdown showing 3-year savings on electricity & maintenance.",
      priority: "URGENT",
      status: "COMPLETED",
      dueDate: new Date(Date.now() - 1 * 86400000),
      contactEmail: "sunita@suratgreenfleet.com",
    },
    {
      title: "Deliver 2 prototype Goodwin E-Charge 60V packs to VoltRide R&D Chennai",
      description: "Provide ARAI compliance documentation, UN38.3 test certificates, and CAN bus protocol specs.",
      priority: "HIGH",
      status: "PENDING",
      dueDate: new Date(Date.now() + 4 * 86400000),
      contactEmail: "naveen@voltridescooters.com",
    },
    {
      title: "Finalize distributor credit limit & bank guarantee agreement with Zenith Automotive",
      description: "Review 45-day credit terms for ₹50 Lakh opening order covering North Zone retail distribution.",
      priority: "HIGH",
      status: "PENDING",
      dueDate: new Date(Date.now() + 5 * 86400000),
      contactEmail: "amit@zenithauto.in",
    },
    {
      title: "Prepare technical comparison vs HBL Nife 2V cells for Bharat Telecom tender",
      description: "Compile float charging current data, acid stratification resistance, and seismic rack specs.",
      priority: "MEDIUM",
      status: "PENDING",
      dueDate: new Date(Date.now() + 7 * 86400000),
      contactEmail: "ramanathan@bharatinfragrid.com",
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
          assignedToId: salesUser.id,
          contactId: contact?.id,
        },
      });
    }
  }
  console.log("✅ Seeded sales & technical inspection tasks.");

  // 10. Operational Activities
  const activitiesData = [
    {
      type: "MEETING",
      title: "Technical Sizing Presentation with VoltRide EV CTO",
      description: "Reviewed thermal runaway protection, active cell balancing, and NMC vs LFP performance under 45°C ambient Indian summer tests.",
      contactEmail: "naveen@voltridescooters.com",
      occurredAt: new Date(Date.now() - 2 * 86400000),
    },
    {
      type: "CALL",
      title: "Commercial Negotiation with Apex Logistics CPO Rajesh Gupta",
      description: "Discussed volume discount on 250 units HeavyTorque 12V 150Ah. Agreed on ₹13,500 base rate with 6% fleet discount.",
      contactEmail: "rajesh@apexlogistics.in",
      occurredAt: new Date(Date.now() - 3 * 86400000),
    },
    {
      type: "WHATSAPP",
      title: "Sent 48-Month Warranty Certificate & Dealer Price Book to Zenith Auto",
      description: "Shared official PDF price catalog highlighting dealer margins vs Amaron Pro and Exide Mileage.",
      contactEmail: "amit@zenithauto.in",
      occurredAt: new Date(Date.now() - 1 * 86400000),
    },
    {
      type: "EMAIL",
      title: "Official Quotation QT-GB-2026-001 Dispatched to Surat Green Fleet",
      description: "Transmitted commercial proposal for 80 units E-Charge 48V 100Ah with GST and scrap battery buyback clause.",
      contactEmail: "sunita@suratgreenfleet.com",
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
          performedById: salesUser.id,
          contactId: contact?.id,
          occurredAt: a.occurredAt,
        },
      });
    }
  }
  console.log("✅ Logged customer engagement activities.");

  // 11. Battery Industry Automation Rules
  const automationRules = [
    {
      name: "High-Priority EV & Lithium Fleet Lead Auto-Routing",
      triggerEvent: "LEAD_CREATED",
      conditions: {
        score_gte: 80,
        tag: "LFP Lithium",
      },
      actions: {
        assign_owner: "sales@goodwinbatteries.com",
        priority: "URGENT",
        create_task: "Initiate battery sizing consultation within 2 business hours",
      },
      isActive: true,
    },
    {
      name: "Competitor Replacement Battlecard Trigger",
      triggerEvent: "LEAD_CREATED",
      conditions: {
        tag_contains: "Competitor:",
      },
      actions: {
        create_task: "Review technical battlecard & warranty advantage comparison sheet",
      },
      isActive: true,
    },
    {
      name: "Commercial Proposal 48-Hour Follow-up Reminder",
      triggerEvent: "DEAL_STAGE_CHANGED",
      conditions: {
        stage: "Proposal Sent",
      },
      actions: {
        create_task: "Call client to review quotation, commercial credit terms, and scrap buyback valuation",
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
  console.log("✅ Configured automated battery workflow rules.");

  console.log("🎉 Goodwin Batteries CRM Organization Workspace fully built!");
  } finally {
    if (shouldDisconnect) {
      await prisma.$disconnect();
    }
  }
}

if (process.argv[1]?.includes("build-goodwin-batteries")) {
  buildGoodwinBatteries().catch((e) => {
    console.error("❌ Failed to build Goodwin Batteries workspace:", e);
    process.exit(1);
  });
}
