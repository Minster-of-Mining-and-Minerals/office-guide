"use strict";

/**
 * Backfills Amharic translations for the demo floors, offices, service tags,
 * departments, descriptions and contact persons.
 *
 * Idempotent — running twice writes the same values. Only rows keyed by
 * `floor_number` or `room_number` in the maps below are touched; anything
 * created via the admin UI is left alone.
 */

// ─── Floor names ────────────────────────────────────────────────
const FLOOR_NAME_AM = {
  0: "የመሬት ወለል",
  1: "አንደኛ ወለል",
  2: "ሁለተኛ ወለል",
  3: "ሦስተኛ ወለል",
  4: "አራተኛ ወለል",
  5: "አምስተኛ ወለል",
};

// ─── Office core fields ─────────────────────────────────────────
// name_am, department_am, description_am, contact_person_am
const OFFICE_AM = {
  // Ground Floor
  "G-01": {
    name: "አቀባበል",
    department: "የፊት ቢሮ",
    description: "የጎብኚዎች መቀበያና መረጃ ጠረጴዛ።",
    contact: "ወ/ት ሰላም በቀለ",
  },
  "G-02": {
    name: "የደህንነት ጽ/ቤት",
    department: "ደህንነት",
    description: "የህንፃ ደህንነትና የጎብኚ መታወቂያ አገልግሎት።",
    contact: "አቶ ዳዊት አሰፋ",
  },
  "G-03": {
    name: "ገንዘብ ተቀባይ",
    department: "ፋይናንስ",
    description: "የፍቃድ፣ የፈቃድ እና የሮያሊቲ ክፍያዎች።",
    contact: "ወ/ሮ ሃና ግርማ",
  },
  "G-04": {
    name: "መዝገብ ቤት",
    department: "አስተዳደር",
    description: "የህዝብ መዝገብ ጥያቄና ሰነድ ፍለጋ።",
    contact: "አቶ ዮናስ ተስፋዬ",
  },
  "G-05": {
    name: "የእገዛ ቢሮ",
    department: "አይቲ",
    description: "ለሰራተኞችና ለህዝብ ኪዮስክ የአይቲ ድጋፍ።",
    contact: "ወ/ት ሊሊ መኮንን",
  },

  // Floor 1 — Administration & HR
  "1-01": {
    name: "የሚኒስትር ጽ/ቤት",
    department: "ስራ አስፈጻሚ",
    description: "የክቡር ሚኒስትር ጽ/ቤት።",
    contact: "የሚኒስትር ጽ/ቤት ጸሐፊ",
  },
  "1-02": {
    name: "ቋሚ ጸሐፊ",
    department: "ስራ አስፈጻሚ",
    description: "የቋሚ ጸሐፊ ጽ/ቤት።",
    contact: "አቶ ከበደ ወልዴ",
  },
  "1-03": {
    name: "አስተዳደር",
    department: "አስተዳደር",
    description: "አጠቃላይ አስተዳደርና ደብዳቤዎች።",
    contact: "ወ/ት መዓዛ ዓለማየሁ",
  },
  "1-04": {
    name: "የሰው ሀብት አስተዳደር",
    department: "የሰው ሀብት",
    description: "የቅጥር፣ የሰራተኛ መዝገብና ደህንነት።",
    contact: "አቶ በረከት ፍቃዱ",
  },
  "1-05": {
    name: "ስልጠናና ልማት",
    department: "የሰው ሀብት",
    description: "የሰራተኛ ስልጠናና የምስክር ወረቀት አገልግሎት።",
    contact: "ወ/ት ሩት ኃይሌ",
  },
  "1-06": {
    name: "የስብሰባ አዳራሽ",
    department: "ስራ አስፈጻሚ",
    description: "የስራ አስፈጻሚ ስብሰባና የተለያዩ ስብሰባዎች።",
    contact: "የቢሮ ማስተካከያ",
  },

  // Floor 2 — Finance & Procurement
  "2-01": {
    name: "ዋና ሂሳብ ሹም",
    department: "ፋይናንስ",
    description: "የሂሳብ ክትትልና የፋይናንስ ሪፖርት።",
    contact: "አቶ ሰለሞን ገብሬ",
  },
  "2-02": {
    name: "ደመወዝ",
    department: "ፋይናንስ",
    description: "የሰራተኞች ደመወዝና ጥቅማ ጥቅም።",
    contact: "ወ/ት ቤቲ ካሳ",
  },
  "2-03": {
    name: "ግዥ",
    department: "ግዥ",
    description: "ጨረታዎች፣ ውሎችና የአቅራቢ አስተዳደር።",
    contact: "አቶ ቴዎድሮስ አበራ",
  },
  "2-04": {
    name: "ኦዲት",
    department: "ውስጥ ኦዲት",
    description: "የውስጥ ኦዲትና የተግባር ግምገማ።",
    contact: "ወ/ሮ አስቴር ንጋቱ",
  },
  "2-05": {
    name: "በጀትና ዕቅድ",
    department: "ፋይናንስ",
    description: "የዓመታዊ በጀትና የወጪ እቅድ።",
    contact: "አቶ ፋሲል ብርሃኑ",
  },

  // Floor 3 — Mining Rights & Licensing
  "3-01": {
    name: "ፍቃድ አሰጣጥ",
    department: "የማዕድን መብቶች",
    description: "የማዕድን ፍቃድ ማመልከቻና እድሳት።",
    contact: "አቶ መስፍን ታደሰ",
  },
  "3-02": {
    name: "ካዳስተር",
    department: "የማዕድን መብቶች",
    description: "የማዕድን ቦታ ካርታና ወሰን መዝገብ።",
    contact: "ወ/ት ሳራ ወልዴ",
  },
  "3-03": {
    name: "ሮያሊቲና ገቢ",
    department: "የማዕድን መብቶች",
    description: "የማዕድን ሮያሊቲ ግምትና ስብስብ።",
    contact: "አቶ ጌታቸው ማሞ",
  },
  "3-04": {
    name: "ጥቃቅን ማዕድን",
    department: "የማዕድን መብቶች",
    description: "የባህላዊና ጥቃቅን ማዕድን ፍቃድ።",
    contact: "ወ/ት ራሔል ደስታ",
  },
  "3-05": {
    name: "ተግባርና ቁጥጥር",
    department: "የማዕድን መብቶች",
    description: "የመስክ ቁጥጥር መርሃ ግብርና ማስከበሪያ።",
    contact: "አቶ አቤል ፈለቀ",
  },

  // Floor 4 — Geology & Environment
  "4-01": {
    name: "ጂኦሎጂካል ጥናት",
    department: "ጂኦሎጂ",
    description: "የሀገራዊ ጂኦሎጂ ካርታና የመረጃ ማዕከል።",
    contact: "ዶ/ር አለሙ ተፈራ",
  },
  "4-02": {
    name: "ላቦራቶሪ",
    department: "ጂኦሎጂ",
    description: "የናሙና ፈተናና የማዕድን ትንተና።",
    contact: "ወ/ት ገነት በላቸው",
  },
  "4-03": {
    name: "የአካባቢ ተግባር",
    department: "አካባቢ",
    description: "የአካባቢ ተፅእኖ ግምገማና ክትትል።",
    contact: "አቶ ሄኖክ በቀለ",
  },
  "4-04": {
    name: "ማገገሚያና መዘጋት",
    department: "አካባቢ",
    description: "የማዕድን ቦታ ማገገሚያ እቅድ አወጣጥ።",
    contact: "ወ/ሮ ትዕግስት ግዛው",
  },
  "4-05": {
    name: "GIS እና ሪሞት ሴንሲንግ",
    department: "ጂኦሎጂ",
    description: "የስፍራ መረጃ አገልግሎትና የሳተላይት ምስሎች።",
    contact: "አቶ ናታን ዮሐንስ",
  },

  // Floor 5 — Legal, Communications & IT
  "5-01": {
    name: "የህግ አገልግሎት",
    department: "ህግ",
    description: "የህግ ምክርና የውል ግምገማ።",
    contact: "ወ/ት ኤደን ዘሪሁን",
  },
  "5-02": {
    name: "የህዝብ ግንኙነት",
    department: "ኮሙኒኬሽን",
    description: "የመገናኛ ብዙሃን ጥያቄና የህዝብ ተሳትፎ።",
    contact: "አቶ ሳሙኤል ወልዱ",
  },
  "5-03": {
    name: "ኮሙኒኬሽን",
    department: "ኮሙኒኬሽን",
    description: "የሚኒስቴር ህትመቶችና ውስጣዊ ግንኙነት።",
    contact: "ወ/ት ቤተልሔም ዓለሙ",
  },
  "5-04": {
    name: "አይሲቲ",
    department: "አይቲ",
    description: "የመረጃ ስርዓቶችና መሠረተ ልማት።",
    contact: "አቶ ሮቤል ኃይሌ",
  },
  "5-05": {
    name: "ዳታ ሴንተር",
    department: "አይቲ",
    description: "የተከለከለ መዳረሻ — ለተፈቀደላቸው ብቻ።",
    contact: null,
  },
  "5-06": {
    name: "ጥናትና ፖሊሲ",
    department: "ፖሊሲ",
    description: "የማዕድን ፖሊሲ ጥናትና የህግ ረቂቅ።",
    contact: "ዶ/ር ሰላማዊት ግርማ",
  },
};

// ─── Service tag translations ───────────────────────────────────
// English → Amharic. Order in the AM array must match order in the EN array.
const SERVICE_AM = {
  "Visitor check-in": "የጎብኚ መመዝገቢያ",
  "Directions & wayfinding": "አቅጣጫና መንገድ ማሳያ",
  "Lost & found": "የጠፉና የተገኙ",
  "Visitor badges": "የጎብኚ መታወቂያ",
  "Vehicle access passes": "የተሽከርካሪ መግቢያ ፍቃድ",
  "Incident reporting": "አጋጣሚ ማሳወቅ",
  "Licence fee payments": "የፍቃድ ክፍያ",
  "Permit renewal fees": "የፍቃድ እድሳት ክፍያ",
  "Royalty payments": "የሮያሊቲ ክፍያ",
  "Receipt reprints": "የደረሰኝ ማተሚያ",
  "Public records request": "የህዝብ መዝገብ ማመልከቻ",
  "Document lookup": "ሰነድ ፍለጋ",
  "Certified copies": "የተረጋገጠ ኮፒ",
  "Password reset": "የይለፍ ቃል ማዳስ",
  "Kiosk terminal support": "ኪዮስክ ድጋፍ",
  "Wi-Fi assistance": "የዋይ-ፋይ እርዳታ",
  "Ministerial appointments": "የሚኒስትር ቀጠሮ",
  "Executive briefings": "የስራ አስፈጻሚ ማብራሪያ",
  "Official correspondence": "ኦፊሴላዊ ደብዳቤ",
  "Meeting scheduling": "ስብሰባ ማዘጋጀት",
  "Recruitment enquiries": "የቅጥር ጥያቄ",
  "Staff records": "የሰራተኛ መዝገብ",
  "Leave applications": "የፈቃድ ጥያቄ",
  "Employee welfare": "የሰራተኛ ደህንነት",
  "Training programmes": "የስልጠና ፕሮግራም",
  "Certification requests": "የምስክር ወረቀት ጥያቄ",
  "Professional development": "የሙያ እድገት",
  "Meeting bookings": "የስብሰባ ቦታ ማስያዝ",
  "Financial reports": "የፋይናንስ ሪፖርት",
  "Accounts oversight": "የሂሳብ ክትትል",
  "Payslip queries": "የደመወዝ ጥያቄ",
  Allowances: "ጥቅማ ጥቅም",
  "Tax certificates": "የግብር ምስክር ወረቀት",
  "Tender submissions": "የጨረታ ማስገባት",
  "Supplier registration": "አቅራቢ ምዝገባ",
  "Contract enquiries": "የውል ጥያቄ",
  "Audit queries": "የኦዲት ጥያቄ",
  "Compliance advice": "የተግባር ምክር",
  "Budget submissions": "የበጀት ማስገባት",
  "Expenditure planning": "የወጪ እቅድ",
  "New licence applications": "አዲስ ፍቃድ ማመልከቻ",
  "Licence renewals": "የፍቃድ እድሳት",
  "Transfer of ownership": "የባለቤትነት ማስተላለፍ",
  "Status enquiries": "የሁኔታ ጥያቄ",
  "Concession mapping": "የመሬት ካርታ",
  "Boundary verification": "ወሰን ማረጋገጫ",
  "Cadastre records": "የካዳስተር መዝገብ",
  "Royalty assessment": "የሮያሊቲ ግምት",
  "Revenue collection": "ገቢ መሰብሰብ",
  "Payment schedules": "የክፍያ መርሃ ግብር",
  "Small-scale mining permits": "የጥቃቅን ማዕድን ፍቃድ",
  "Artisanal miner registration": "የባህላዊ አምራች ምዝገባ",
  "Cooperative support": "የህብረት ስራ ድጋፍ",
  "Inspection scheduling": "የቁጥጥር መርሃ ግብር",
  "Enforcement notices": "ማስከበሪያ ማስታወቂያ",
  "Compliance reporting": "የተግባር ሪፖርት",
  "Geological maps": "የጂኦሎጂ ካርታ",
  "Data archive access": "የመረጃ ማዕከል መዳረሻ",
  "Field survey requests": "የመስክ ጥናት ጥያቄ",
  "Sample submission": "የናሙና ማስረከቢያ",
  "Mineral analysis": "የማዕድን ትንተና",
  "Assay reports": "የፈተና ሪፖርት",
  "EIA submission": "የEIA ማስገባት",
  "Environmental monitoring reports": "የአካባቢ ክትትል ሪፖርት",
  "Compliance certificates": "የተግባር ምስክር ወረቀት",
  "Rehabilitation plans": "የማገገሚያ ዕቅድ",
  "Mine closure applications": "የማዕድን መዝጊያ ማመልከቻ",
  "Reclamation certificates": "የመልሶ ማልማት ምስክር ወረቀት",
  "GIS data requests": "የGIS መረጃ ጥያቄ",
  "Satellite imagery": "የሳተላይት ምስል",
  "Spatial analysis": "የስፓሺያል ትንተና",
  "Legal advisory": "የህግ ምክር",
  "Contract review": "የውል ግምገማ",
  "Statutory interpretation": "የህግ ትርጓሜ",
  "Media enquiries": "የመገናኛ ብዙሃን ጥያቄ",
  "Press releases": "የፕሬስ መግለጫ",
  "Ministry publications": "የሚኒስቴር ህትመቶች",
  "Internal communications": "የውስጥ ግንኙነት",
  "Systems access": "የስርዓት መዳረሻ",
  "Email accounts": "የኢሜል መለያ",
  "Network support": "የኔትወርክ ድጋፍ",
  "Policy briefings": "የፖሊሲ ማብራሪያ",
  "Research requests": "የጥናት ጥያቄ",
  "Legislative drafting": "የህግ ረቂቅ",
};

module.exports = {
  async up(queryInterface) {
    // ── Floors ─────────────────────────────────────────────
    const [floors] = await queryInterface.sequelize.query(
      "SELECT floor_id, floor_number FROM floors"
    );
    let floorCount = 0;
    for (const f of floors) {
      const nameAm = FLOOR_NAME_AM[Number(f.floor_number)];
      if (!nameAm) continue;
      await queryInterface.sequelize.query(
        "UPDATE floors SET name_am = $1, updated_at = NOW() WHERE floor_id = $2",
        { bind: [nameAm, f.floor_id] }
      );
      floorCount += 1;
    }
    console.log(`Translated ${floorCount} floors.`);

    // ── Offices (core fields) + services ──────────────────
    const [offices] = await queryInterface.sequelize.query(
      "SELECT office_id, room_number, services FROM offices"
    );
    let officeCount = 0;
    let servicesCount = 0;
    for (const o of offices) {
      const t = OFFICE_AM[o.room_number];
      if (!t) continue;

      await queryInterface.sequelize.query(
        `UPDATE offices SET
           name_am = $1,
           department_am = $2,
           description_am = $3,
           contact_person_am = $4,
           updated_at = NOW()
         WHERE office_id = $5`,
        {
          bind: [t.name, t.department, t.description, t.contact, o.office_id],
        }
      );
      officeCount += 1;

      // Build services_am aligned with the EN services array. Missing
      // translations fall back to the EN value (so the array length always
      // matches, satisfying the app validator).
      const enServices = Array.isArray(o.services) ? o.services : [];
      const amServices = enServices.map((en) => SERVICE_AM[en] ?? en);
      await queryInterface.sequelize.query(
        "UPDATE offices SET services_am = $1 WHERE office_id = $2",
        { bind: [amServices, o.office_id] }
      );
      servicesCount += amServices.length;
    }
    console.log(
      `Translated ${officeCount} offices (${servicesCount} service tags).`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE floors SET name_am = NULL"
    );
    await queryInterface.sequelize.query(
      `UPDATE offices SET
         name_am = NULL,
         department_am = NULL,
         description_am = NULL,
         contact_person_am = NULL,
         services_am = ARRAY[]::varchar[]`
    );
  },
};
