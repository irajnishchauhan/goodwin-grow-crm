import { PrismaClient, PartnerType, PartnerStatus, PartnerTier, BatteryOrderStatus, CollectionStatus, WarrantyClaimStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedBatteryNetwork() {
  console.log("⚡ Seeding Goodwin Batteries dedicated CRM network data...");

  const tenant = await prisma.tenant.findUnique({
    where: { code: "goodwin-batteries" },
    include: {
      memberships: { include: { user: true } },
    },
  });

  if (!tenant) {
    throw new Error("Tenant with code 'goodwin-batteries' not found. Please run seed first.");
  }

  const tenantId = tenant.id;
  const salesUser = tenant.memberships.find(
    (m) => m.user.email === "sales@goodwinbatteries.com"
  )?.user || tenant.memberships[0]?.user;

  if (!salesUser) {
    throw new Error("No sales user found in Goodwin Batteries tenant.");
  }

  // 1. Fetch available products
  const products = await prisma.product.findMany({
    where: { tenantId },
  });

  // Territories
  const territories = [
    "North - Delhi NCR",
    "North - Punjab & Haryana",
    "North - Rajasthan",
    "West - Maharashtra & Goa",
    "West - Gujarat Central",
    "South - Karnataka & Bengaluru",
    "South - Tamil Nadu",
    "East - West Bengal & Kolkata",
  ];

  // 2. Distributors (6 Major Regional Distributors)
  const distributorsData = [
    {
      code: "DIST-NCR-01",
      businessName: "Zenith Battery Distributors Pvt Ltd",
      ownerName: "Rajeshwar Singhania",
      phone: "+91 98110 54321",
      email: "dist.ncr@zenithauto.in",
      gstin: "07AAACZ1234D1Z2",
      pan: "AAACZ1234D",
      address: "Warehouse 14, Okhla Industrial Area Phase III",
      city: "New Delhi",
      state: "Delhi",
      pincode: "110020",
      territory: "North - Delhi NCR",
      creditLimit: 5000000.0,
      creditDays: 45,
      outstandingBalance: 1420000.0,
      overdueAmount: 0.0,
      tier: PartnerTier.PLATINUM,
    },
    {
      code: "DIST-GUJ-02",
      businessName: "Gujarat Energy & Traction Distribution Hub",
      ownerName: "Kiritbhai Patel",
      phone: "+91 98250 88991",
      email: "kirit.patel@gujaratenergyhub.com",
      gstin: "24AACCG4567E1ZP",
      pan: "AACCG4567E",
      address: "GIDC Industrial Estate, Makarpura",
      city: "Vadodara",
      state: "Gujarat",
      pincode: "390010",
      territory: "West - Gujarat Central",
      creditLimit: 4500000.0,
      creditDays: 30,
      outstandingBalance: 980000.0,
      overdueAmount: 0.0,
      tier: PartnerTier.PLATINUM,
    },
    {
      code: "DIST-MAH-03",
      businessName: "Sahyadri Auto Electricals Wholesale",
      ownerName: "Vilasrao Shinde",
      phone: "+91 98201 33442",
      email: "orders@sahyadriauto.com",
      gstin: "27AABCS7890F1Z8",
      pan: "AABCS7890F",
      address: "Bhiwandi Logistics Hub, Building B-4",
      city: "Thane",
      state: "Maharashtra",
      pincode: "421302",
      territory: "West - Maharashtra & Goa",
      creditLimit: 6000000.0,
      creditDays: 45,
      outstandingBalance: 1850000.0,
      overdueAmount: 120000.0,
      tier: PartnerTier.PLATINUM,
    },
    {
      code: "DIST-PUN-04",
      businessName: "Kalsi Power Logistics & Batteries",
      ownerName: "Harpreet Singh Kalsi",
      phone: "+91 98760 11223",
      email: "harpreet@kalsipower.in",
      gstin: "03AAACK9988G1ZQ",
      pan: "AAACK9988G",
      address: "GT Road, Transport Nagar",
      city: "Ludhiana",
      state: "Punjab",
      pincode: "141003",
      territory: "North - Punjab & Haryana",
      creditLimit: 3500000.0,
      creditDays: 30,
      outstandingBalance: 840000.0,
      overdueAmount: 0.0,
      tier: PartnerTier.GOLD,
    },
    {
      code: "DIST-KAR-05",
      businessName: "Bangalore PowerGrid Channel Partners",
      ownerName: "Chandrasekhar Reddy",
      phone: "+91 98450 67890",
      email: "reddy@bangalorepowergrid.in",
      gstin: "29AACCB1122H1ZN",
      pan: "AACCB1122H",
      address: "Peenya Industrial Area, 4th Phase",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560058",
      territory: "South - Karnataka & Bengaluru",
      creditLimit: 4000000.0,
      creditDays: 30,
      outstandingBalance: 1100000.0,
      overdueAmount: 180000.0,
      tier: PartnerTier.GOLD,
    },
    {
      code: "DIST-RAJ-06",
      businessName: "Marwar Solar & Inverter Distribution",
      ownerName: "Mahendra Singh Rathore",
      phone: "+91 98290 44556",
      email: "rathore@marwarsolar.in",
      gstin: "08AAACM5544J1ZK",
      pan: "AAACM5544J",
      address: "Vishwakarma Industrial Area (VKIA), Road No. 9",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302013",
      territory: "North - Rajasthan",
      creditLimit: 3000000.0,
      creditDays: 30,
      outstandingBalance: 720000.0,
      overdueAmount: 0.0,
      tier: PartnerTier.GOLD,
    },
  ];

  const createdDistributors: any[] = [];
  for (const d of distributorsData) {
    const partner = await prisma.batteryPartner.upsert({
      where: {
        tenantId_code: { tenantId, code: d.code },
      },
      update: {
        businessName: d.businessName,
        ownerName: d.ownerName,
        phone: d.phone,
        email: d.email,
        gstin: d.gstin,
        pan: d.pan,
        address: d.address,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        territory: d.territory,
        creditLimit: d.creditLimit,
        creditDays: d.creditDays,
        outstandingBalance: d.outstandingBalance,
        overdueAmount: d.overdueAmount,
        type: PartnerType.DISTRIBUTOR,
        status: PartnerStatus.ACTIVE,
        tier: d.tier,
        assignedSalesUserId: salesUser.id,
      },
      create: {
        tenantId,
        code: d.code,
        businessName: d.businessName,
        ownerName: d.ownerName,
        phone: d.phone,
        email: d.email,
        gstin: d.gstin,
        pan: d.pan,
        address: d.address,
        city: d.city,
        state: d.state,
        pincode: d.pincode,
        territory: d.territory,
        creditLimit: d.creditLimit,
        creditDays: d.creditDays,
        outstandingBalance: d.outstandingBalance,
        overdueAmount: d.overdueAmount,
        type: PartnerType.DISTRIBUTOR,
        status: PartnerStatus.ACTIVE,
        tier: d.tier,
        assignedSalesUserId: salesUser.id,
      },
    });
    createdDistributors.push(partner);
  }
  console.log(`✅ Upserted ${createdDistributors.length} regional distributors.`);

  // 3. Exactly 42 Active Dealers across territories
  const dealerNames = [
    { name: "Apex Battery House", owner: "Raman Gupta", city: "Gurugram", state: "Haryana", territory: "North - Delhi NCR", tier: PartnerTier.PLATINUM, balance: 185000, overdue: 42000 },
    { name: "Shree Ganesh Auto Electricals", owner: "Ganesh Sharma", city: "Faridabad", state: "Haryana", territory: "North - Delhi NCR", tier: PartnerTier.GOLD, balance: 140000, overdue: 0 },
    { name: "SuperPower Batteries & Inverters", owner: "Vikram Malhotra", city: "Noida", state: "Uttar Pradesh", territory: "North - Delhi NCR", tier: PartnerTier.PLATINUM, balance: 290000, overdue: 85000 },
    { name: "National Auto Spares & Battery", owner: "Subhash Chand", city: "New Delhi", state: "Delhi", territory: "North - Delhi NCR", tier: PartnerTier.SILVER, balance: 65000, overdue: 0 },
    { name: "Kisan Battery & Solar Works", owner: "Sukhdev Singh", city: "Karnal", state: "Haryana", territory: "North - Punjab & Haryana", tier: PartnerTier.GOLD, balance: 125000, overdue: 25000 },
    { name: "Majha Battery Sales & Service", owner: "Jaswant Singh", city: "Amritsar", state: "Punjab", territory: "North - Punjab & Haryana", tier: PartnerTier.GOLD, balance: 95000, overdue: 0 },
    { name: "Doaba Auto Power Point", owner: "Balwinder Kumar", city: "Jalandhar", state: "Punjab", territory: "North - Punjab & Haryana", tier: PartnerTier.SILVER, balance: 45000, overdue: 0 },
    { name: "Channi Battery & Inverter Junction", owner: "Gurmeet Ram", city: "Bathinda", state: "Punjab", territory: "North - Punjab & Haryana", tier: PartnerTier.SILVER, balance: 52000, overdue: 0 },
    { name: "Jaipur Battery World", owner: "Kailash Agarwal", city: "Jaipur", state: "Rajasthan", territory: "North - Rajasthan", tier: PartnerTier.PLATINUM, balance: 310000, overdue: 62000 },
    { name: "Marudhar Inverter & Battery Care", owner: "Gopal Purohit", city: "Jodhpur", state: "Rajasthan", territory: "North - Rajasthan", tier: PartnerTier.GOLD, balance: 175000, overdue: 0 },
    { name: "Mewar Traction Power", owner: "Bhawani Singh", city: "Udaipur", state: "Rajasthan", territory: "North - Rajasthan", tier: PartnerTier.SILVER, balance: 88000, overdue: 18000 },
    { name: "Bikaner Battery Shoppe", owner: "Mohan Lal Soni", city: "Bikaner", state: "Rajasthan", territory: "North - Rajasthan", tier: PartnerTier.SILVER, balance: 42000, overdue: 0 },
    { name: "Surat Green Drive Spares", owner: "Nilesh Choksi", city: "Surat", state: "Gujarat", territory: "West - Gujarat Central", tier: PartnerTier.PLATINUM, balance: 245000, overdue: 0 },
    { name: "Ahmedabad Auto Power Mart", owner: "Bhavin Shah", city: "Ahmedabad", state: "Gujarat", territory: "West - Gujarat Central", tier: PartnerTier.PLATINUM, balance: 340000, overdue: 55000 },
    { name: "Saurashtra Battery Agency", owner: "Hitesh Vora", city: "Rajkot", state: "Gujarat", territory: "West - Gujarat Central", tier: PartnerTier.GOLD, balance: 160000, overdue: 0 },
    { name: "Navsari EV & Tubular Hub", owner: "Dharmesh Desai", city: "Navsari", state: "Gujarat", territory: "West - Gujarat Central", tier: PartnerTier.SILVER, balance: 60000, overdue: 0 },
    { name: "Mumbai Battery Junction", owner: "Pravin Kadam", city: "Mumbai", state: "Maharashtra", territory: "West - Maharashtra & Goa", tier: PartnerTier.PLATINUM, balance: 420000, overdue: 95000 },
    { name: "Pune PowerTech Solutions", owner: "Sanjay Joshi", city: "Pune", state: "Maharashtra", territory: "West - Maharashtra & Goa", tier: PartnerTier.PLATINUM, balance: 315000, overdue: 0 },
    { name: "Nashik Auto Electrical Centre", owner: "Nitin Bhalerao", city: "Nashik", state: "Maharashtra", territory: "West - Maharashtra & Goa", tier: PartnerTier.GOLD, balance: 135000, overdue: 30000 },
    { name: "Aurangabad Battery Depot", owner: "Syed Munir", city: "Chhatrapati Sambhajinagar", state: "Maharashtra", territory: "West - Maharashtra & Goa", tier: PartnerTier.GOLD, balance: 110000, overdue: 0 },
    { name: "Goa Coastal Marine & Auto Battery", owner: "Anthony D'Souza", city: "Panaji", state: "Goa", territory: "West - Maharashtra & Goa", tier: PartnerTier.SILVER, balance: 75000, overdue: 0 },
    { name: "Bengaluru Battery Bazaar", owner: "Manjunath Swamy", city: "Bengaluru", state: "Karnataka", territory: "South - Karnataka & Bengaluru", tier: PartnerTier.PLATINUM, balance: 380000, overdue: 0 },
    { name: "Mysore Electro Power", owner: "Ranganath BS", city: "Mysuru", state: "Karnataka", territory: "South - Karnataka & Bengaluru", tier: PartnerTier.GOLD, balance: 120000, overdue: 0 },
    { name: "Hubli Traction & Inverter Point", owner: "Basavaraj Patil", city: "Hubballi", state: "Karnataka", territory: "South - Karnataka & Bengaluru", tier: PartnerTier.GOLD, balance: 98000, overdue: 22000 },
    { name: "Mangalore Marine Battery Traders", owner: "Umesh Poojary", city: "Mangaluru", state: "Karnataka", territory: "South - Karnataka & Bengaluru", tier: PartnerTier.SILVER, balance: 64000, overdue: 0 },
    { name: "Chennai Battery Superstore", owner: "Karthik Subramanian", city: "Chennai", state: "Tamil Nadu", territory: "South - Tamil Nadu", tier: PartnerTier.PLATINUM, balance: 350000, overdue: 72000 },
    { name: "Coimbatore Industrial Power Hub", owner: "Muruganandam V", city: "Coimbatore", state: "Tamil Nadu", territory: "South - Tamil Nadu", tier: PartnerTier.GOLD, balance: 190000, overdue: 0 },
    { name: "Madurai Battery Centre", owner: "Senthil Kumar", city: "Madurai", state: "Tamil Nadu", territory: "South - Tamil Nadu", tier: PartnerTier.GOLD, balance: 115000, overdue: 0 },
    { name: "Salem Auto Electric Works", owner: "Palaniswamy R", city: "Salem", state: "Tamil Nadu", territory: "South - Tamil Nadu", tier: PartnerTier.SILVER, balance: 58000, overdue: 0 },
    { name: "Kolkata Power House", owner: "Anirban Mukherjee", city: "Kolkata", state: "West Bengal", territory: "East - West Bengal & Kolkata", tier: PartnerTier.PLATINUM, balance: 280000, overdue: 0 },
    { name: "Howrah Traction Spares", owner: "Debabrata Das", city: "Howrah", state: "West Bengal", territory: "East - West Bengal & Kolkata", tier: PartnerTier.GOLD, balance: 145000, overdue: 38000 },
    { name: "Siliguri Battery Supply Co", owner: "Bikash Roy", city: "Siliguri", state: "West Bengal", territory: "East - West Bengal & Kolkata", tier: PartnerTier.GOLD, balance: 92000, overdue: 0 },
    { name: "Durgapur Industrial Battery Mart", owner: "Sourav Bhattacharya", city: "Durgapur", state: "West Bengal", territory: "East - West Bengal & Kolkata", tier: PartnerTier.SILVER, balance: 68000, overdue: 0 },
    { name: "Ghaziabad Inverter & Battery Zone", owner: "Satish Tyagi", city: "Ghaziabad", state: "Uttar Pradesh", territory: "North - Delhi NCR", tier: PartnerTier.GOLD, balance: 165000, overdue: 0 },
    { name: "Meerut Powerline Batteries", owner: "Pradeep Sirohi", city: "Meerut", state: "Uttar Pradesh", territory: "North - Delhi NCR", tier: PartnerTier.SILVER, balance: 82000, overdue: 0 },
    { name: "Panipat Automotive Power Station", owner: "Devendra Malik", city: "Panipat", state: "Haryana", territory: "North - Punjab & Haryana", tier: PartnerTier.SILVER, balance: 74000, overdue: 0 },
    { name: "Kota Solar Energy & Battery Hub", owner: "Dinesh Meena", city: "Kota", state: "Rajasthan", territory: "North - Rajasthan", tier: PartnerTier.GOLD, balance: 130000, overdue: 0 },
    { name: "Anand EV Charging & Spares", owner: "Paresh Patel", city: "Anand", state: "Gujarat", territory: "West - Gujarat Central", tier: PartnerTier.SILVER, balance: 58000, overdue: 0 },
    { name: "Kolhapur Sugarcane Agro Batteries", owner: "Sachin Patil", city: "Kolhapur", state: "Maharashtra", territory: "West - Maharashtra & Goa", tier: PartnerTier.GOLD, balance: 105000, overdue: 0 },
    { name: "Belgaum Battery Centre", owner: "Appasaheb Desai", city: "Belagavi", state: "Karnataka", territory: "South - Karnataka & Bengaluru", tier: PartnerTier.SILVER, balance: 49000, overdue: 0 },
    { name: "Tiruchirappalli Power Cell", owner: "Jeyaraj Pandian", city: "Tiruchirappalli", state: "Tamil Nadu", territory: "South - Tamil Nadu", tier: PartnerTier.SILVER, balance: 62000, overdue: 0 },
    { name: "Asansol Mining & Heavy Battery Hub", owner: "Tapan Banerjee", city: "Asansol", state: "West Bengal", territory: "East - West Bengal & Kolkata", tier: PartnerTier.GOLD, balance: 128000, overdue: 28000 },
  ];

  const createdDealers: any[] = [];
  for (let i = 0; i < dealerNames.length; i++) {
    const d = dealerNames[i];
    const code = `DLR-${(i + 1).toString().padStart(3, "0")}`;
    const matchingDistributor = createdDistributors.find((dist) => dist.territory === d.territory) || createdDistributors[0];

    const partner = await prisma.batteryPartner.upsert({
      where: {
        tenantId_code: { tenantId, code },
      },
      update: {
        businessName: d.name,
        ownerName: d.owner,
        phone: `+91 ${98000 + i} ${10000 + i * 17}`,
        email: `dealer.${code.toLowerCase()}@partnergoodwin.com`,
        gstin: `07AABC${1000 + i}G1Z${(i % 9) + 1}`,
        pan: `AABC${1000 + i}G`,
        address: `Shop No. ${12 + (i % 30)}, Main Commercial Market`,
        city: d.city,
        state: d.state,
        pincode: `${110000 + i * 23}`,
        territory: d.territory,
        creditLimit: d.tier === PartnerTier.PLATINUM ? 1000000.0 : d.tier === PartnerTier.GOLD ? 500000.0 : 250000.0,
        creditDays: 30,
        outstandingBalance: d.balance,
        overdueAmount: d.overdue,
        type: PartnerType.DEALER,
        status: PartnerStatus.ACTIVE,
        tier: d.tier,
        parentDistributorId: matchingDistributor.id,
        assignedSalesUserId: salesUser.id,
      },
      create: {
        tenantId,
        code,
        businessName: d.name,
        ownerName: d.owner,
        phone: `+91 ${98000 + i} ${10000 + i * 17}`,
        email: `dealer.${code.toLowerCase()}@partnergoodwin.com`,
        gstin: `07AABC${1000 + i}G1Z${(i % 9) + 1}`,
        pan: `AABC${1000 + i}G`,
        address: `Shop No. ${12 + (i % 30)}, Main Commercial Market`,
        city: d.city,
        state: d.state,
        pincode: `${110000 + i * 23}`,
        territory: d.territory,
        creditLimit: d.tier === PartnerTier.PLATINUM ? 1000000.0 : d.tier === PartnerTier.GOLD ? 500000.0 : 250000.0,
        creditDays: 30,
        outstandingBalance: d.balance,
        overdueAmount: d.overdue,
        type: PartnerType.DEALER,
        status: PartnerStatus.ACTIVE,
        tier: d.tier,
        parentDistributorId: matchingDistributor.id,
        assignedSalesUserId: salesUser.id,
      },
    });
    createdDealers.push(partner);
  }
  console.log(`✅ Upserted exactly ${createdDealers.length} Active Dealers.`);

  // 4. Retail Outlets (10 Retailers)
  for (let r = 1; r <= 10; r++) {
    const code = `RET-${r.toString().padStart(3, "0")}`;
    const assignedDealer = createdDealers[r - 1];
    await prisma.batteryPartner.upsert({
      where: { tenantId_code: { tenantId, code } },
      update: {
        businessName: `City Retail Battery Point ${r}`,
        ownerName: `Retail Partner ${r}`,
        phone: `+91 97110 ${20000 + r}`,
        address: `Gala ${r}, Near Railway Crossing`,
        city: assignedDealer.city,
        state: assignedDealer.state,
        territory: assignedDealer.territory,
        type: PartnerType.RETAILER,
        status: PartnerStatus.ACTIVE,
        tier: PartnerTier.SILVER,
        parentDistributorId: assignedDealer.id,
        assignedSalesUserId: salesUser.id,
      },
      create: {
        tenantId,
        code,
        businessName: `City Retail Battery Point ${r}`,
        ownerName: `Retail Partner ${r}`,
        phone: `+91 97110 ${20000 + r}`,
        address: `Gala ${r}, Near Railway Crossing`,
        city: assignedDealer.city,
        state: assignedDealer.state,
        territory: assignedDealer.territory,
        type: PartnerType.RETAILER,
        status: PartnerStatus.ACTIVE,
        tier: PartnerTier.SILVER,
        parentDistributorId: assignedDealer.id,
        assignedSalesUserId: salesUser.id,
      },
    });
  }
  console.log("✅ Upserted 10 Retail Outlets.");

  // 5. Open Enquiries (Exactly 18 Open Enquiries in Leads table)
  // Check existing leads and create to ensure exactly 18 open leads
  const openLeadStatuses = ["NEW", "CONTACTED", "QUALIFIED"];
  const batteryEnquiries = [
    { title: "Dealership Enquiry for Rohtak & Jind District", name: "Anil Khatri", phone: "+91 98123 00001", email: "anil.khatri@gmail.com", source: "Website Enquiry Form", status: "NEW", notes: "Existing Amaron dealer looking for higher margin secondary line." },
    { title: "Lithium E-Rickshaw Battery Dealership Query", name: "Sunil Verma", phone: "+91 98123 00002", email: "sunil.verma@evdealers.in", source: "WhatsApp Chatbot", status: "NEW", notes: "Runs 40-fleet e-rickshaw stand in Ghaziabad, needs 48V 100Ah packs." },
    { title: "Solar Rooftop Tubular Battery Sizing for 50kW Plant", name: "Deepak Saini", phone: "+91 98123 00003", email: "deepak@sainisolar.com", source: "Google Ads (Solar)", status: "CONTACTED", notes: "Wants quotation for 24 units Goodwin SolarCell Ultra C10 200Ah." },
    { title: "Two-Wheeler Battery Bulk Purchase - Bike Workshop", name: "Mohit Bansal", phone: "+91 98123 00004", email: "mohit@bansalmotors.com", source: "Field Sales Visit", status: "CONTACTED", notes: "Service center servicing 25+ bikes daily. Demands 48-month warranty." },
    { title: "Distributorship Application - Western Odisha Region", name: "Prasant Mohanty", phone: "+91 98123 00005", email: "prasant@mohantypower.com", source: "Trade Referral", status: "QUALIFIED", notes: "Ready with ₹35 Lakh initial inventory investment and 2500 sq ft warehouse." },
    { title: "Heavy Commercial Fleet Battery Replacement (50 Trucks)", name: "Gurdeep Dhillon", phone: "+91 98123 00006", email: "gurdeep@dhillontransport.com", source: "Direct Inbound", status: "QUALIFIED", notes: "Needs pricing for HeavyTorque 12V 150Ah with old battery scrap buyback." },
    { title: "Inverter Battery Dealership Proposal - Alwar Bypass", name: "Rameshwar Dayal", phone: "+91 98123 00007", email: "rameshwar@alwarinverters.com", source: "Meta Ads (Dealer)", status: "NEW", notes: "Currently sells Livguard; disappointed with claim processing speed." },
    { title: "OEM Supply of VRLA Batteries for Electric Scooters", name: "Tarun Bajaj", phone: "+91 98123 00008", email: "tarun@speedxev.com", source: "Website Contact Form", status: "CONTACTED", notes: "Initial trial lot of 200 units 12V 28Ah VRLA packs required for homologation." },
    { title: "Automotive Battery Retail Counter Setup", name: "Pooja Trivedi", phone: "+91 98123 00009", email: "pooja@trivedispareparts.com", source: "WhatsApp Chatbot", status: "NEW", notes: "New outlet opening in Vapi industrial corridor. Requires starter display rack." },
    { title: "Telecom Tower DG Backup Battery Replacements", name: "Alok Sengupta", phone: "+91 98123 00010", email: "alok@kolkatatowers.in", source: "Google Ads", status: "QUALIFIED", notes: "RFP for 2V 500Ah stationary cells across 12 tower locations." },
    { title: "UPS Battery Replacement for Hospital ICU Systems", name: "Dr. Vinay Mehta", phone: "+91 98123 00011", email: "admin@apexmedicare.org", source: "Referral", status: "CONTACTED", notes: "Urgent need for 32 units 12V 100Ah sealed AGM maintenance-free batteries." },
    { title: "Agro Tractor Battery Distribution - Vidarbha Belt", name: "Santosh Deshmukh", phone: "+91 98123 00012", email: "santosh@deshmukhtractors.in", source: "Field Sales Visit", status: "QUALIFIED", notes: "High seasonal demand during pre-monsoon kharif ploughing." },
    { title: "Residential Society Inverter Backup Upgrade", name: "Brigadier N.K. Roy", phone: "+91 98123 00013", email: "nkroy@silverspringsrwa.com", source: "Website Enquiry Form", status: "NEW", notes: "Clubhouse and lift backup bank: 16 tall tubular 220Ah batteries." },
    { title: "Dealer Onboarding Enquiry - Bareilly & Moradabad", name: "Waseem Akram", phone: "+91 98123 00014", email: "akram@upbatteries.com", source: "Trade Referral", status: "CONTACTED", notes: "Has network of 18 sub-dealers across Rohilkhand region." },
    { title: "Lithium Golf Cart Battery Pack Custom Assembly", name: "Naveen Chhabra", phone: "+91 98123 00015", email: "naveen@greengolfresort.com", source: "Direct Inbound", status: "NEW", notes: "Retrofitting 12 lead-acid golf buggies to 48V 100Ah Lithium packs." },
    { title: "State Road Transport Undertaking Spare Tender", name: "Satish Kumar (Consultant)", phone: "+91 98123 00016", email: "satish@tenderadvisors.in", source: "Website Contact Form", status: "QUALIFIED", notes: "Clarification on test certificates and ARAI approval for 12V 180Ah." },
    { title: "Commercial Battery Charging Station Franchise", name: "Harishankar Pandey", phone: "+91 98123 00017", email: "harishankar@pandeybattery.in", source: "Meta Ads (Dealer)", status: "CONTACTED", notes: "Inquiring about fast charging infrastructure and battery swap stocks." },
    { title: "B2B Dealership Query - Surat Textile Industrial Area", name: "Chirag Gandhi", phone: "+91 98123 00018", email: "chirag@gandhielectric.com", source: "WhatsApp Chatbot", status: "NEW", notes: "Supplies power conditioning equipment to 40+ powerloom textile units." },
  ];

  // Clean old sample leads for this tenant to ensure exact 18
  await prisma.lead.deleteMany({
    where: { tenantId },
  });

  for (const enq of batteryEnquiries) {
    const nameParts = enq.name.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || "Enquirer";

    await prisma.lead.create({
      data: {
        tenantId,
        firstName,
        lastName,
        companyName: enq.title,
        phone: enq.phone,
        email: enq.email,
        serviceRequired: enq.notes,
        status: enq.status as any,
        source: enq.source,
        score: Math.floor(Math.random() * 35) + 65,
        dealValue: (Math.floor(Math.random() * 5) + 2) * 100000,
        tags: ["Battery Enquiry", enq.source],
        assignedOwnerId: salesUser.id,
        nextFollowUp: new Date(Date.now() + (Math.floor(Math.random() * 5) + 1) * 86400000),
      },
    });
  }
  console.log(`✅ Upserted exactly ${batteryEnquiries.length} Open Battery Enquiries.`);

  // 6. Orders: Exactly 12 Pending Orders, plus 6 Dispatched/Delivered
  await prisma.batteryOrder.deleteMany({ where: { tenantId } });

  const pendingOrderDealers = createdDealers.slice(0, 12);
  const pendingOrdersData = [
    { orderNum: "GB-ORD-2026-001", amount: 245000, items: [{ sku: "GB-PD-1205", qty: 50 }, { sku: "GB-DV-1245", qty: 25 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-002", amount: 380000, items: [{ sku: "GB-ST-12150", qty: 20 }, { sku: "GB-ST-12220", qty: 10 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-003", amount: 195000, items: [{ sku: "GB-PD-1209", qty: 30 }, { sku: "GB-DV-1265", qty: 15 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-004", amount: 490000, items: [{ sku: "GB-EC-48100", qty: 7 }, { sku: "GB-SC-12200", qty: 12 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-005", amount: 165000, items: [{ sku: "GB-HT-12150", qty: 12 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-006", amount: 285000, items: [{ sku: "GB-ST-12150", qty: 15 }, { sku: "GB-PD-1205", qty: 40 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-007", amount: 320000, items: [{ sku: "GB-DV-1245", qty: 30 }, { sku: "GB-DV-1265", qty: 20 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-008", amount: 560000, items: [{ sku: "GB-EC-48100", qty: 8 }, { sku: "GB-EC-6050", qty: 5 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-009", amount: 210000, items: [{ sku: "GB-ST-12220", qty: 11 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-010", amount: 145000, items: [{ sku: "GB-PD-1205", qty: 60 }, { sku: "GB-PD-1209", qty: 20 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-011", amount: 415000, items: [{ sku: "GB-HT-12150", qty: 25 }, { sku: "GB-SC-12200", qty: 5 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
    { orderNum: "GB-ORD-2026-012", amount: 175000, items: [{ sku: "GB-DV-1245", qty: 20 }, { sku: "GB-ST-12150", qty: 8 }], status: BatteryOrderStatus.PENDING_APPROVAL, ref: null },
  ];

  for (let i = 0; i < pendingOrdersData.length; i++) {
    const o = pendingOrdersData[i];
    const dealer = pendingOrderDealers[i];
    await prisma.batteryOrder.create({
      data: {
        tenantId,
        orderNumber: o.orderNum,
        partnerId: dealer.id,
        salesUserId: salesUser.id,
        totalAmount: o.amount,
        status: o.status,
        erpSyncStatus: "QUEUED_FOR_ERP_VALIDATION",
        items: o.items,
        deliveryAddress: `${dealer.address}, ${dealer.city}, ${dealer.state}`,
        notes: "Dealer seasonal stocking order. Subject to credit limit review.",
        expectedDate: new Date(Date.now() + 5 * 86400000),
      },
    });
  }

  // 6 Completed / Dispatched orders
  for (let j = 1; j <= 6; j++) {
    const dealer = createdDealers[12 + j];
    await prisma.batteryOrder.create({
      data: {
        tenantId,
        orderNumber: `GB-ORD-2026-DISP-${j}`,
        partnerId: dealer.id,
        salesUserId: salesUser.id,
        totalAmount: 320000.0,
        status: j % 2 === 0 ? BatteryOrderStatus.DELIVERED : BatteryOrderStatus.DISPATCHED,
        erpSyncStatus: "ERP_CONFIRMED_SYNCED",
        erpOrderRef: `ERP-SO-990${j}`,
        items: [{ sku: "GB-DV-1245", qty: 20 }, { sku: "GB-ST-12150", qty: 15 }],
        deliveryAddress: `${dealer.address}, ${dealer.city}`,
        notes: "Synced with Goodwin ERP. Invoice generated in ERP.",
        expectedDate: new Date(Date.now() - j * 86400000),
      },
    });
  }
  console.log("✅ Upserted exactly 12 Pending Orders and 6 Dispatched orders.");

  // 7. Collections: Exactly 7 Overdue Collection Follow-ups (with notes and upcoming follow-up date)
  await prisma.batteryCollection.deleteMany({ where: { tenantId } });

  const followUpDealers = createdDealers.filter((d) => d.overdueAmount > 0).slice(0, 7);
  const collectionFollowUpsData = [
    { inv: "GB-INV-2026-081", days: 45, due: 42000, date: new Date(Date.now() - 45 * 86400000), notes: "Spoke with Raman Gupta. Agreed to clear ₹42,000 via RTGS post weekend sales." },
    { inv: "GB-INV-2026-092", days: 60, due: 85000, date: new Date(Date.now() - 60 * 86400000), notes: "Promised cheque collection on Friday from Noida outlet." },
    { inv: "GB-INV-2026-104", days: 38, due: 25000, date: new Date(Date.now() - 38 * 86400000), notes: "Karnal dealer requested 5 days extension due to local harvest market payments." },
    { inv: "GB-INV-2026-118", days: 52, due: 62000, date: new Date(Date.now() - 52 * 86400000), notes: "Jaipur dealer dispute on 2 transit-damaged batteries. Credit note pending." },
    { inv: "GB-INV-2026-125", days: 70, due: 95000, date: new Date(Date.now() - 70 * 86400000), notes: "Mumbai dealer second reminder sent. Accounts team escalation triggered." },
    { inv: "GB-INV-2026-133", days: 35, due: 72000, date: new Date(Date.now() - 35 * 86400000), notes: "Chennai dealer payment scheduled via HDFC corporate netbanking on Monday." },
    { inv: "GB-INV-2026-140", days: 42, due: 38000, date: new Date(Date.now() - 42 * 86400000), notes: "Howrah dealer confirmed NEFT of ₹38,000 after dispatch of new inverter lot." },
  ];

  for (let c = 0; c < 7; c++) {
    const item = collectionFollowUpsData[c];
    const dealer = followUpDealers[c] || createdDealers[c];
    await prisma.batteryCollection.create({
      data: {
        tenantId,
        invoiceNumber: item.inv,
        partnerId: dealer.id,
        amountDue: item.due,
        amountPaid: 0.0,
        dueDate: item.date,
        status: CollectionStatus.OVERDUE,
        ageingDays: item.days,
        followUpNotes: item.notes,
        nextFollowUpDate: new Date(Date.now() + (c + 1) * 86400000),
      },
    });
  }

  // Add 10 paid or current collections for realistic ledger
  for (let k = 1; k <= 10; k++) {
    const dealer = createdDealers[k + 6];
    await prisma.batteryCollection.create({
      data: {
        tenantId,
        invoiceNumber: `GB-INV-2026-REG-${k}`,
        partnerId: dealer.id,
        amountDue: 120000.0,
        amountPaid: 120000.0,
        dueDate: new Date(Date.now() + 15 * 86400000),
        paymentDate: new Date(),
        paymentMode: "NEFT / RTGS",
        status: CollectionStatus.PAID,
        ageingDays: 0,
        followUpNotes: "Payment cleared on time.",
      },
    });
  }
  console.log("✅ Upserted exactly 7 Collection Follow-ups (and 10 cleared collections).");

  // 8. Warranty & Service Claims
  await prisma.batteryWarrantyClaim.deleteMany({ where: { tenantId } });

  const warrantyCases = [
    { num: "GB-CLM-2026-001", customer: "Rajendra Prasad", phone: "+91 98111 99001", serial: "GB-2025-VRLA-88219", model: "PowerDrive Neo (12V 5Ah)", type: "Dead on Arrival / Zero Voltage", status: WarrantyClaimStatus.APPROVED_REPLACEMENT, repSerial: "GB-2026-VRLA-99410" },
    { num: "GB-CLM-2026-002", customer: "Manish Agarwal", phone: "+91 98222 99002", serial: "GB-2024-CAR-44102", model: "DuraVolt Apex (12V 45Ah)", type: "Bulging / Overcharging by Alternator", status: WarrantyClaimStatus.INSPECTION, repSerial: null },
    { num: "GB-CLM-2026-003", customer: "Vikas Tyagi", phone: "+91 98333 99003", serial: "GB-2023-TUB-11904", model: "SuperTubular Pro (12V 150Ah)", type: "Specific Gravity Low / Inverter Backup Dropped", status: WarrantyClaimStatus.APPROVED_PRORATA, repSerial: "GB-2026-TUB-33011" },
    { num: "GB-CLM-2026-004", customer: "Surendra Yadav", phone: "+91 98444 99004", serial: "GB-2025-LFP-00213", model: "E-Charge LFP 48V 100Ah", type: "BMS High Temp Cutoff Error Code 04", status: WarrantyClaimStatus.SUBMITTED, repSerial: null },
    { num: "GB-CLM-2026-005", customer: "Komal Swaminathan", phone: "+91 98555 99005", serial: "GB-2025-CAR-55291", model: "DuraVolt Ultra (12V 65Ah)", type: "Terminal Sulphation & Cracked Container", status: WarrantyClaimStatus.REJECTED, repSerial: null },
    { num: "GB-CLM-2026-006", customer: "Amitabh Banerjee", phone: "+91 98666 99006", serial: "GB-2024-SOL-77124", model: "SolarCell Ultra C10 (12V 200Ah)", type: "Internal Cell Short Circuit", status: WarrantyClaimStatus.APPROVED_REPLACEMENT, repSerial: "GB-2026-SOL-88029" },
  ];

  for (let w = 0; w < warrantyCases.length; w++) {
    const c = warrantyCases[w];
    const dealer = createdDealers[w];
    await prisma.batteryWarrantyClaim.create({
      data: {
        tenantId,
        claimNumber: c.num,
        partnerId: dealer.id,
        customerName: c.customer,
        customerPhone: c.phone,
        batterySerialNumber: c.serial,
        batteryModel: c.model,
        purchaseDate: new Date(Date.now() - 365 * 86400000),
        claimDate: new Date(Date.now() - (w + 1) * 86400000),
        claimType: c.type,
        status: c.status,
        technicianNotes: "Verified via Goodwin Authorized Digital Warranty System. Hydrometer and electronic load tester report attached.",
        replacementSerial: c.repSerial,
        erpSyncStatus: c.status === WarrantyClaimStatus.APPROVED_REPLACEMENT ? "CREDIT_MEMO_PENDING_IN_ERP" : "SYNCED",
        resolutionDate: c.repSerial ? new Date() : null,
      },
    });
  }
  console.log(`✅ Upserted ${warrantyCases.length} Warranty & Complaint Service Cases.`);

  // 9. Field Sales Visits
  await prisma.batteryFieldVisit.deleteMany({ where: { tenantId } });

  const visitNotes = [
    { purpose: "Monthly Dealer Review & Stock Audit", outcome: "Reviewed stock of 2W VRLA and Inverter batteries. Dealer ordered 35 units.", booked: 215000, coll: 45000 },
    { purpose: "Payment Recovery & Ageing Settlement", outcome: "Collected post-dated cheque for overdue invoice GB-INV-2026-081.", booked: 0, coll: 42000 },
    { purpose: "New Lithium 48V LFP Demo & Retail POS Display Setup", outcome: "Trained store counter technicians on Smart BMS CAN connectivity.", booked: 180000, coll: 0 },
    { purpose: "Warranty Replacement Handover & Core Scrap Pickup", outcome: "Exchanged dead battery under warranty; picked up 8 discarded lead batteries for recycling credit.", booked: 95000, coll: 28000 },
    { purpose: "Commercial Fleet Sizing Meeting with Truck Union", outcome: "Met fleet manager. Proposed HeavyTorque 12V 150Ah trial batch for 10 Ashok Leyland multi-axle trucks.", booked: 135000, coll: 0 },
  ];

  for (let f = 0; f < 8; f++) {
    const dealer = createdDealers[f];
    const note = visitNotes[f % visitNotes.length];
    await prisma.batteryFieldVisit.create({
      data: {
        tenantId,
        partnerId: dealer.id,
        salesUserId: salesUser.id,
        visitDate: new Date(Date.now() - f * 86400000),
        purpose: note.purpose,
        outcome: note.outcome,
        notes: "GPS Verified Check-in at dealer commercial showroom.",
        orderBooked: note.booked,
        collectionMade: note.coll,
        followUpDate: new Date(Date.now() + (f + 3) * 86400000),
      },
    });
  }
  console.log("✅ Upserted 8 Field Sales Visits with GPS Check-in data.");

  console.log("🎉 Goodwin Batteries CRM Network Data successfully seeded with exact figures:");
  console.log("   - 42 Active Dealers");
  console.log("   - 18 Open Enquiries");
  console.log("   - 12 Pending Orders");
  console.log("   - 7 Collection Follow-ups");
}

if (process.argv[1]?.includes("seed-battery-network")) {
  seedBatteryNetwork()
    .catch((e) => {
      console.error("❌ Failed seeding battery network:", e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
