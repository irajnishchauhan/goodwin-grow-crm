export interface BatteryProductSeed {
  sku: string;
  name: string;
  category: string;
  description: string;
  unitPrice: number;
  warrantyMonths: number;
}

export const GOODWIN_BATTERIES_CATALOG: BatteryProductSeed[] = [
  {
    sku: "GB-ST-12150",
    name: "Goodwin SuperTubular Pro (12V 150Ah)",
    category: "Inverter Tall Tubular",
    description: "High-purity tall tubular inverter battery with ceramic vent plugs. 1400+ cycles at 80% DOD. Competing directly with Luminous Red Charge, Livguard Invertuff, and Microtek Dura Strong. 54-Month Warranty.",
    unitPrice: 14200,
    warrantyMonths: 54,
  },
  {
    sku: "GB-ST-12220",
    name: "Goodwin SuperTubular Jumbo (12V 220Ah)",
    category: "Inverter Tall Tubular",
    description: "Heavy commercial backup tall tubular battery for extended power outages. Competing with Luminous ILTT and Microtek Jumbo. 60-Month Warranty.",
    unitPrice: 18900,
    warrantyMonths: 60,
  },
  {
    sku: "GB-SC-12200",
    name: "Goodwin SolarCell Ultra C10 (12V 200Ah)",
    category: "Solar C10 Tubular",
    description: "C10-rated deep-cycle solar tubular battery for residential and commercial rooftop solar installations. Low self-discharge rate. Competing with Luminous Solar, Eastman Solar, and Livguard Solar. 60-Month Warranty.",
    unitPrice: 17500,
    warrantyMonths: 60,
  },
  {
    sku: "GB-EC-48100",
    name: "Goodwin E-Charge LFP 48V 100Ah (4.8kWh)",
    category: "Lithium Iron Phosphate (LFP)",
    description: "High-rate LiFePO4 E-Rickshaw & Light EV smart battery pack. Integrated CAN/Bluetooth Smart BMS, 3500+ cycles, IP67 enclosure, 2-hour fast charge. Direct benchmark against Okaya Ferrato, CATL LFP, and BYD Blade modules. 36-Month Full Replacement Warranty.",
    unitPrice: 62000,
    warrantyMonths: 36,
  },
  {
    sku: "GB-PD-1209",
    name: "Goodwin PowerDrive Max (12V 9Ah)",
    category: "Two-Wheeler VRLA",
    description: "Heavy-displacement cruiser & sports motorcycle high-CCA battery. Competing with Amaron & Exide. 48-Month Warranty.",
    unitPrice: 2350,
    warrantyMonths: 48,
  },
  {
    sku: "GB-DV-1245",
    name: "Goodwin DuraVolt Apex (12V 45Ah)",
    category: "Automotive SLI",
    description: "Passenger Car Silver-Alloy Starter Battery. High temperature endurance, ultra-low water loss. Competing with Amaron Hi-Life, Exide Mileage, Bosch S4 Mega Power, and VARTA Blue Dynamic. 60-Month Warranty.",
    unitPrice: 5400,
    warrantyMonths: 60,
  },
  {
    sku: "GB-DV-1265",
    name: "Goodwin DuraVolt Ultra (12V 65Ah)",
    category: "Automotive SLI",
    description: "Heavy-duty SUV & Diesel passenger car high-cranking battery. Engineered for extreme duty cycles. Competing with Amaron Flo, Exide Matrix, and Bosch Automotive. 66-Month Warranty.",
    unitPrice: 7800,
    warrantyMonths: 66,
  },
  {
    sku: "GB-HT-12150",
    name: "Goodwin HeavyTorque Max (12V 150Ah)",
    category: "Commercial & Heavy Vehicle",
    description: "Heavy Commercial Vehicle, Multi-Axle Truck & Tractor battery. Hybrid alloy plate design, rough terrain surge-proof. Competing with Exide Express, Amaron Shield, and Bosch T3. 36-Month Commercial Warranty.",
    unitPrice: 13500,
    warrantyMonths: 36,
  },
  {
    sku: "GB-EC-6050",
    name: "Goodwin E-Charge LFP 60V 50Ah (3.0kWh)",
    category: "E-Rickshaw & EV Traction",
    description: "Smart Lithium-ion NMC/LFP swappable battery pack for electric delivery scooters and high-speed e-bikes. Competing with LG Energy Solution, CATL, and Panasonic Energy. 36-Month Warranty.",
    unitPrice: 44000,
    warrantyMonths: 36,
  },
  {
    sku: "GB-IP-20500",
    name: "Goodwin InduPower VRLA 2V 500Ah",
    category: "Industrial & Telecom VRLA",
    description: "2-Volt Stationary lead-acid industrial cell for telecom towers, substations, data centers, and railways. Competing with HBL Nife, GS Yuasa Industrial, and Exide Powersafe. 20-Year Design Float Life.",
    unitPrice: 16800,
    warrantyMonths: 60,
  },
  {
    sku: "GB-ESS-10KWH",
    name: "Goodwin MegaWatt C&I ESS Rack 51.2V 200Ah (10.24kWh)",
    category: "Lithium Iron Phosphate (LFP)",
    description: "Modular lithium energy storage rack for commercial & industrial microgrids and peak-shaving. Competing with CATL EnerC, BYD Chess, and LG Resu Prime. 6000+ cycle life. 84-Month Warranty.",
    unitPrice: 185000,
    warrantyMonths: 84,
  },
  {
    sku: "GB-PD-1205",
    name: "Goodwin PowerDrive Neo (12V 5Ah)",
    category: "Two-Wheeler VRLA",
    description: "Two-Wheeler VRLA Maintenance-Free AGM Battery. Anti-vibration matrix, instant cranking. Direct market benchmark against Amaron Pro Bike Rider, Exide Xplore, SF Sonic, and Tata Green Velocity. 48-Month Warranty.",
    unitPrice: 1450,
    warrantyMonths: 48,
  },
];
