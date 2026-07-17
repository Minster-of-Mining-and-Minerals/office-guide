"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * Wipe-and-replace seeder for the real MMID directorate data.
 *
 * Source: `Core department code.docx` — 18 offices numbered 501–518, all on
 * floor 5, with authoritative Amharic names and contact persons. English
 * contact-person names are transliterations; English departments,
 * descriptions and service tags are inferred from each unit's role.
 *
 * Behaviour:
 *   1. Unpin every display (set `floor_id = NULL`) so the FK to `floors`
 *      is safe to delete against.
 *   2. `DELETE FROM offices`  ─ removes any prior mock offices.
 *   3. `DELETE FROM floors`   ─ removes any prior mock floors.
 *   4. Insert one floor: floor_number = 5, name = "Directorate".
 *   5. Insert the 18 real offices with full bilingual content.
 *
 * All 6 displays are preserved and end up in whole-building mode, which is
 * the intended kiosk configuration.
 */

const FLOOR = {
  floor_number: 5,
  name: "Directorate",
  name_am: "ዳይሬክቶሬት",
};

// Order matters — `display_order` is assigned from the array index below,
// so this list controls the order offices appear on the kiosk and guide.
// Grouped so related units sit next to each other visually.
const OFFICES = [
  // ─── Director General's office ────────────────────────────────
  {
    room: "501",
    name_en: "Director General",
    name_am: "ዋና ዳይሬክተር",
    dept_en: "Director General",
    dept_am: "ዋና ዳይሬክተር ጽ/ቤት",
    contact_en: "Dr. Bisrat Kebede",
    contact_am: "ዶ/ር ብስራት ከበደ",
    desc_en:
      "Head of the institute; sets strategic direction and represents MMID externally.",
    desc_am:
      "የኢንስቲትዩቱ ዋና ኃላፊ፤ ስትራቴጂክ አቅጣጫ የሚያስቀምጥ እና ተቋሙን በውጭ የሚወክል።",
    services_en: [
      "Executive appointments",
      "Strategic direction",
      "Institutional leadership",
    ],
    services_am: ["የዋና ዳይሬክተር ቀጠሮ", "ስትራቴጂክ አቅጣጫ", "ተቋማዊ አመራር"],
  },
  {
    room: "517",
    name_en: "Office of the Director General",
    name_am: "ዋና ዳይሬክተር ጽ/ቤት",
    dept_en: "Director General",
    dept_am: "ዋና ዳይሬክተር ጽ/ቤት",
    contact_en: "Mr. Tamiru Mersha",
    contact_am: "አቶ ታምሩ መርሻ",
    desc_en:
      "Coordinates the Director General's schedule, correspondence and visitors.",
    desc_am: "የዋና ዳይሬክተርን መርሃ ግብር፣ ደብዳቤ እና ጎብኚዎችን ያስተባብራል።",
    services_en: [
      "Appointment booking",
      "Official correspondence",
      "Visitor coordination",
    ],
    services_am: ["ቀጠሮ ማስያዝ", "ኦፊሴላዊ ደብዳቤ", "የጎብኚ ማስተባበር"],
  },

  // ─── Executive management ─────────────────────────────────────
  {
    room: "516",
    name_en: "Operations Chief Executive",
    name_am: "የሥራ አመራር ዋና ሥራ አስፈጻሚ",
    dept_en: "Executive Management",
    dept_am: "ሥራ አመራር",
    contact_en: "Mr. Sileshi W/Yohannes",
    contact_am: "አቶ ስለሺ ወ/ዮሐንስ",
    desc_en:
      "Oversees institute-wide operations and cross-sector coordination.",
    desc_am: "የተቋሙን አጠቃላይ ኦፕሬሽንና የዘርፎችን ማስተባበር የሚመራ።",
    services_en: [
      "Operations oversight",
      "Cross-sector coordination",
      "Executive briefings",
    ],
    services_am: ["የኦፕሬሽን ክትትል", "ዘርፎችን ማስተባበር", "የስራ አስፈጻሚ ማብራሪያ"],
  },

  // ─── Chemical & Energy Minerals ───────────────────────────────
  {
    room: "502",
    name_en: "Chemical & Energy Minerals Sector Lead Executive",
    name_am:
      "የኬሚካል እና የኃይል አመንጪ ማዕድናት ጥናት እና ምርምር ዘርፍ መሪ ሥራ አስፈጻሚ",
    dept_en: "Chemical & Energy Minerals",
    dept_am: "የኬሚካል እና የኃይል አመንጪ ማዕድናት",
    contact_en: "Mrs. Enatfanta Melaku",
    contact_am: "ወ/ሮ እናትፋንታ መላኩ",
    desc_en:
      "Leads the study and research programme for chemical and energy minerals.",
    desc_am: "የኬሚካልና የኃይል አመንጪ ማዕድናት ጥናትና ምርምር ፕሮግራምን የሚመራ።",
    services_en: [
      "Sector planning",
      "Research programme oversight",
      "Desk coordination",
    ],
    services_am: ["የዘርፍ ዕቅድ", "የምርምር ፕሮግራም ክትትል", "ዴስክ ማስተባበር"],
  },
  {
    room: "505",
    name_en: "Cement & Ceramics Minerals Research Desk",
    name_am: "የሲሚንቶና ሴራሚክ ማዕድናት ምርምር ዴስክ",
    dept_en: "Chemical & Energy Minerals",
    dept_am: "የኬሚካል እና የኃይል አመንጪ ማዕድናት",
    contact_en: "Mr. Nigat Mulat",
    contact_am: "አቶ ንጋት ሙላት",
    desc_en:
      "Field and laboratory research on cement and ceramic raw materials.",
    desc_am: "የሲሚንቶና ሴራሚክ ጥሬ ዕቃዎች የመስክና የላቦራቶሪ ምርምር።",
    services_en: [
      "Sample analysis",
      "Field surveys",
      "Technical reports",
      "Industry consultations",
    ],
    services_am: [
      "የናሙና ትንተና",
      "የመስክ ጥናት",
      "የቴክኒክ ሪፖርት",
      "የኢንዱስትሪ ምክክር",
    ],
  },
  {
    room: "509",
    name_en: "Energy Minerals Development Research Desk",
    name_am: "የኃይል አመንጪ ማዕድናት ልማት ምርምር ዴስክ",
    dept_en: "Chemical & Energy Minerals",
    dept_am: "የኬሚካል እና የኃይል አመንጪ ማዕድናት",
    contact_en: "Mr. Henok Tamrat",
    contact_am: "አቶ ሄኖክ ታምራት",
    desc_en:
      "Research on coal, geothermal and other energy-mineral development.",
    desc_am: "የከሰል፣ ጂኦተርማልና ሌሎች የኃይል-ማዕድናት ልማት ምርምር።",
    services_en: [
      "Resource assessments",
      "Feasibility studies",
      "Development advisory",
    ],
    services_am: ["የሀብት ግምገማ", "የአዋጭነት ጥናት", "የልማት ምክር"],
  },
  {
    room: "512",
    name_en: "Chemical & Fertilizer Development Research Desk",
    name_am: "የኬሚካልና ማዳበሪያ ልማት ምርምር ዴስክ",
    dept_en: "Chemical & Energy Minerals",
    dept_am: "የኬሚካል እና የኃይል አመንጪ ማዕድናት",
    contact_en: "Mr. Megersa Bedo",
    contact_am: "አቶ መገርሳ በዶ",
    desc_en: "Research on industrial chemicals and fertilizer feed minerals.",
    desc_am: "የኢንዱስትሪ ኬሚካሎችና የማዳበሪያ ግብዓት ማዕድናት ምርምር።",
    services_en: [
      "Chemical analysis",
      "Fertilizer research",
      "Industry advisory",
    ],
    services_am: ["የኬሚካል ትንተና", "የማዳበሪያ ምርምር", "የኢንዱስትሪ ምክር"],
  },

  // ─── Artisanal & Gemstone Minerals ────────────────────────────
  {
    room: "503",
    name_en: "Artisanal Development & Gemstones Sector Lead Executive",
    name_am: "የአርቲዝናል ልማትና ጌጣጌጥ ማዕድናት ልማት ምርምር መሪ ስራ አስፈጻሚ",
    dept_en: "Artisanal & Gemstone Minerals",
    dept_am: "አርቲዝናል እና ጌጣጌጥ ማዕድናት",
    contact_en: "Dr. Gera Techane",
    contact_am: "ዶ/ር ጌራ ተጫኔ",
    desc_en:
      "Leads artisanal and gemstone development research and grassroots support.",
    desc_am: "የአርቲዝናል እና የጌጣጌጥ ልማት ምርምርና ዝቅተኛ-ደረጃ ድጋፍ የሚመራ።",
    services_en: [
      "Sector planning",
      "Programme oversight",
      "Cooperative support",
    ],
    services_am: ["የዘርፍ ዕቅድ", "የፕሮግራም ክትትል", "የህብረት ስራ ድጋፍ"],
  },
  {
    room: "507",
    name_en: "Head of Artisanal Mineral Development & Research Desk",
    name_am: "የአርቲዝናል ማዕድን ልማትና ምርምር ዴስክ ኃላፊ",
    dept_en: "Artisanal & Gemstone Minerals",
    dept_am: "አርቲዝናል እና ጌጣጌጥ ማዕድናት",
    contact_en: "Mr. Tatek Tadesse",
    contact_am: "አቶ ታጠቅ ታደሰ",
    desc_en:
      "Supports artisanal and small-scale miners with research and technical guidance.",
    desc_am: "የአርቲዝናልና ጥቃቅን ማዕድን አምራቾችን በምርምርና በቴክኒክ ማገዝ።",
    services_en: [
      "Miner registration guidance",
      "Technical training",
      "Formalization support",
      "Cooperative support",
    ],
    services_am: [
      "የአምራች ምዝገባ ምክር",
      "የቴክኒክ ስልጠና",
      "የመደበኛነት ድጋፍ",
      "የህብረት ስራ ድጋፍ",
    ],
  },
  {
    room: "508",
    name_en: "Gemstone Development Research Desk",
    name_am: "የጌጣጌጥ ልማት ምርምር ዴስክ",
    dept_en: "Artisanal & Gemstone Minerals",
    dept_am: "አርቲዝናል እና ጌጣጌጥ ማዕድናት",
    contact_en: "Mr. Solomon Zeleke",
    contact_am: "አቶ ሰለሞን ዘለቀ",
    desc_en:
      "Gemstone quality assessment, valuation and value-addition research.",
    desc_am: "የጌጣጌጥ ጥራት ግምት፣ ግምገማና እሴት መጨመር ምርምር።",
    services_en: [
      "Gemstone identification",
      "Valuation advisory",
      "Value-addition support",
    ],
    services_am: ["የጌጣጌጥ ማንነት ማወቅ", "የግምት ምክር", "የእሴት መጨመር ድጋፍ"],
  },

  // ─── Construction Input Minerals ──────────────────────────────
  {
    room: "504",
    name_en: "Construction Input Minerals Sector Lead Executive",
    name_am: "የግንባታ ግብዓት ማዕድናት ልማት እና ምርምር መሪ ሥራ አስፈጻሚ",
    dept_en: "Construction Input Minerals",
    dept_am: "የግንባታ ግብዓት ማዕድናት",
    contact_en: "Mr. Simegn Degu Tesfaye",
    contact_am: "አቶ ስመኝ ደጉ ተስፋዬ",
    desc_en: "Leads research on minerals used as construction inputs.",
    desc_am:
      "እንደ ግንባታ ግብዓት የሚያገለግሉ ማዕድናት ላይ የሚደረግ ምርምር የሚመራ።",
    services_en: [
      "Sector planning",
      "Programme oversight",
      "Industry liaison",
    ],
    services_am: ["የዘርፍ ዕቅድ", "የፕሮግራም ክትትል", "የኢንዱስትሪ ግንኙነት"],
  },
  {
    room: "506",
    name_en: "Iron & Metal Minerals Research Desk",
    name_am: "የብረት ማዕድናት ምርምር ዴስክ",
    dept_en: "Construction Input Minerals",
    dept_am: "የግንባታ ግብዓት ማዕድናት",
    contact_en: "Mrs. Birtukan Yenealem",
    contact_am: "ወ/ሮ ብርቱካን የኔአለም",
    desc_en: "Research on iron and industrial-metal minerals.",
    desc_am: "የብረትና የኢንዱስትሪ ብረት ማዕድናት ምርምር።",
    services_en: [
      "Ore assessments",
      "Sample testing",
      "Beneficiation studies",
    ],
    services_am: ["የማዕድን ግምገማ", "የናሙና ፈተና", "የመልቀም ጥናት"],
  },
  {
    room: "515",
    name_en: "Marble, Granite & Glass Minerals Research Desk",
    name_am: "የማርብል፣ ግራናይት፣ መስታወት ማዕድናት ምርምር ዴስክ",
    dept_en: "Construction Input Minerals",
    dept_am: "የግንባታ ግብዓት ማዕድናት",
    contact_en: "Mrs. Frehiwot Gashaw",
    contact_am: "ወ/ሮ ፍሬህይወት ጋሻው",
    desc_en:
      "Dimension stone, silica sand and industrial mineral research.",
    desc_am: "የግንባታ ድንጋይ፣ ሲሊካ አሸዋና የኢንዱስትሪ ማዕድናት ምርምር።",
    services_en: [
      "Quarry assessments",
      "Quality testing",
      "Dimension-stone advisory",
    ],
    services_am: ["የቋሪ ግምገማ", "የጥራት ፈተና", "የግንባታ ድንጋይ ምክር"],
  },

  // ─── Strategic Affairs ────────────────────────────────────────
  {
    room: "510",
    name_en: "Strategic Affairs Executive",
    name_am: "ስትራቴጂክ ጉዳዮች ሥራ አስፈጻሚ",
    dept_en: "Strategic Affairs",
    dept_am: "ስትራቴጂክ ጉዳዮች",
    contact_en: "Mr. Getu Alemayehu",
    contact_am: "አቶ ጌቱ አለማየሁ",
    desc_en:
      "Strategic planning, performance monitoring and institutional reform.",
    desc_am: "የስትራቴጂክ ዕቅድ፣ የአፈጻጸም ክትትልና ተቋማዊ ማሻሻያ።",
    services_en: [
      "Strategic planning",
      "Performance monitoring",
      "Reform coordination",
    ],
    services_am: ["የስትራቴጂክ ዕቅድ", "የአፈጻጸም ክትትል", "የማሻሻያ ማስተባበር"],
  },

  // ─── Procurement & Finance ────────────────────────────────────
  {
    room: "511",
    name_en: "Procurement & Finance Executive",
    name_am: "የግዢና ፋይናንስ ሥራ አስፈጻሚ",
    dept_en: "Procurement & Finance",
    dept_am: "ግዢና ፋይናንስ",
    contact_en: "Ms. Bitsehit Kifle",
    contact_am: "ወ/ሪት ብፅሂት ክፍሌ",
    desc_en:
      "Heads institutional procurement, finance and budget oversight.",
    desc_am: "የተቋሙን ግዢ፣ ፋይናንስና በጀት ክትትል የሚመራ።",
    services_en: [
      "Budget oversight",
      "Financial reporting",
      "Procurement planning",
    ],
    services_am: ["የበጀት ክትትል", "የፋይናንስ ሪፖርት", "የግዢ ዕቅድ"],
  },
  {
    room: "513",
    name_en: "Procurement & Finance Team Work Unit",
    name_am: "የግዢና ፋይናንስ ቡድን ስራ ክፍል",
    dept_en: "Procurement & Finance",
    dept_am: "ግዢና ፋይናንስ",
    contact_en: "Mr. Kiflom Haftom & Ms. Edla Teklay",
    contact_am: "አቶ ክፍሎም ሀፍቶም እና ወ/ት እድላ ተክላይ",
    desc_en:
      "Day-to-day procurement processing, payments and vendor management.",
    desc_am: "ዕለታዊ የግዢ ሂደት፣ ክፍያዎችና የአቅራቢ አስተዳደር።",
    services_en: [
      "Tender submissions",
      "Payment processing",
      "Supplier registration",
      "Contract enquiries",
    ],
    services_am: ["የጨረታ ማስገባት", "የክፍያ ሂደት", "የአቅራቢ ምዝገባ", "የውል ጥያቄ"],
  },

  // ─── Capability & HR ──────────────────────────────────────────
  {
    room: "514",
    name_en: "Capability & Human Resource Management Executive",
    name_am: "የብቃትና የሰው ሀብት አስተዳደር ሥራ አስፈጻሚ",
    dept_en: "Capability & Human Resources",
    dept_am: "ብቃትና የሰው ሀብት አስተዳደር",
    contact_en: "Mrs. Yebergual Kebede",
    contact_am: "ወ/ሮ የብርጓል ከበደ",
    desc_en:
      "Heads recruitment, staff records, training and organisational development.",
    desc_am: "ቅጥር፣ የሰራተኛ መዝገብ፣ ስልጠናና ተቋማዊ ልማት የሚመራ።",
    services_en: [
      "Recruitment enquiries",
      "Staff records",
      "Training programmes",
      "Leave applications",
    ],
    services_am: [
      "የቅጥር ጥያቄ",
      "የሰራተኛ መዝገብ",
      "የስልጠና ፕሮግራም",
      "የፈቃድ ጥያቄ",
    ],
  },

  // ─── Legal & Communication ────────────────────────────────────
  {
    room: "518",
    name_en: "Legal Services & Communication Affairs Executive",
    name_am: "የህግ አገልግሎት እና የኮሙዩኒኬሽን ጉዳዮች ሥራ አስፈጻሚ",
    dept_en: "Legal & Communication",
    dept_am: "ህግ አገልግሎትና ኮሙዩኒኬሽን",
    contact_en: "Mrs. Selamawit Anteneh & Mr. Solomon Tesfa",
    contact_am: "ወ/ሮ ሰላማዊት አንተነህ እና አቶ ሰለሞን ተስፋ",
    desc_en:
      "Legal advisory, contract review and public/media communications.",
    desc_am: "የህግ ምክር፣ የውል ግምገማና የህዝብ/መገናኛ ብዙኃን ግንኙነት።",
    services_en: [
      "Legal advisory",
      "Contract review",
      "Media enquiries",
      "Press releases",
    ],
    services_am: [
      "የህግ ምክር",
      "የውል ግምገማ",
      "የመገናኛ ብዙኃን ጥያቄ",
      "የፕሬስ መግለጫ",
    ],
  },
];

module.exports = {
  async up(queryInterface) {
    const t = await queryInterface.sequelize.transaction();
    try {
      // 1. Break the FK from displays → floors so we can wipe floors.
      await queryInterface.sequelize.query(
        "UPDATE displays SET floor_id = NULL, updated_at = NOW()",
        { transaction: t }
      );

      // 2. Wipe existing offices + floors. Sequenced so the floors delete
      //    isn't blocked by any office FKs even without cascade.
      await queryInterface.sequelize.query("DELETE FROM offices", {
        transaction: t,
      });
      await queryInterface.sequelize.query("DELETE FROM floors", {
        transaction: t,
      });

      // 3. Insert the single MMID directorate floor.
      const floorId = uuidv4();
      await queryInterface.sequelize.query(
        `INSERT INTO floors
           (floor_id, floor_number, name, name_am, is_active, map_image_url, created_at, updated_at)
         VALUES ($1, $2, $3, $4, TRUE, NULL, NOW(), NOW())`,
        {
          bind: [floorId, FLOOR.floor_number, FLOOR.name, FLOOR.name_am],
          transaction: t,
        }
      );

      // 4. Insert the 18 offices. display_order = array index so the visual
      //    ordering matches the grouping in this file (DG → Executive →
      //    each sector → strategic → procurement → HR → legal).
      for (let i = 0; i < OFFICES.length; i++) {
        const o = OFFICES[i];
        await queryInterface.sequelize.query(
          `INSERT INTO offices (
             office_id, floor_id, room_number, display_order,
             name,           name_am,
             department,     department_am,
             contact_person, contact_person_am,
             description,    description_am,
             services,       services_am,
             created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4,
             $5, $6,
             $7, $8,
             $9, $10,
             $11, $12,
             $13, $14,
             NOW(), NOW()
           )`,
          {
            bind: [
              uuidv4(),
              floorId,
              o.room,
              i,
              o.name_en,
              o.name_am,
              o.dept_en,
              o.dept_am,
              o.contact_en,
              o.contact_am,
              o.desc_en,
              o.desc_am,
              o.services_en,
              o.services_am,
            ],
            transaction: t,
          }
        );
      }

      await t.commit();
      console.log(
        `MMID directorate seed: 1 floor + ${OFFICES.length} offices.`
      );
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async down(queryInterface) {
    // Not truly reversible (the previous mock data is gone), but at least
    // clean out the rows we inserted so re-running the seeder is safe.
    await queryInterface.sequelize.query("DELETE FROM offices");
    await queryInterface.sequelize.query("DELETE FROM floors");
  },
};
