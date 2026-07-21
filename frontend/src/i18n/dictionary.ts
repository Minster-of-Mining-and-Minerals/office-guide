/**
 * Bilingual dictionary for user-facing strings on the public office-guide
 * page. Admin panel copy stays English-only.
 *
 * Add new keys as flat strings (no nesting). Both en + am must be present
 * for every key — TypeScript enforces this via the `Dict` type.
 */

export type Locale = "en" | "am";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "EN",
  am: "አማ",
};

const en = {
  // ── Global / brand ──
  ministry: "Ministry of Mining",
  officeGuide: "Office Guide",
  officeGuideSubtitle:
    "Find any office, room, department or floor in the building.",

  // ── Search ──
  searchPlaceholder: "Search office, service, person, room or floor…",
  clearSearch: "Clear search",

  // ── Filter bar ──
  floors: "Floors",
  allFloors: "All",
  clearFilters: "Clear filters",

  // ── Stats ──
  matches: "Matches",
  showing: "Showing",
  offices: "Offices",

  // ── Results summary ──
  showingLabel: "Showing",
  ofLabel: "of",
  officesLabel: "offices",
  forLabel: "for",
  onFloorLabel: "on",
  allNOffices: "All {count} offices across {floors} floors",

  // ── Card ──
  cardOffice: "Office",
  cardServices: "Services",
  cardMoreServices: "+{n} more",
  servicesShowLess: "Show less",
  cardNoServices: "No public services listed.",
  cardFloor: "Floor",
  cardServiceCountOne: "1 service",
  cardServiceCountMany: "{n} services",
  cardInfoOnly: "Info only",

  // ── Empty ──
  noMatchesTitle: "No offices match “{term}”.",
  noOfficesTitle: "No offices to show.",
  noMatchesSubtitle: "Try a different name, room number, department or floor.",

  // ── Footer / misc ──
  footerCopy: "© {year} Ministry of Mining · Office Guide",
  scrollToTop: "Scroll to top",

  // ── Loading / errors ──
  loading: "Loading…",
  unavailableTitle: "Office Guide unavailable",
  unavailableSubtitle: "Please try again in a moment.",

  // ── Locale toggle ──
  language: "Language",

  // ── Announcements (public carousel) ──
  announcements: "Announcements",
  noAnnouncementsTitle: "No announcements to show.",
  noAnnouncementsSubtitle:
    "The admin has not published any announcements yet.",
} as const;

type Dict = { [K in keyof typeof en]: string };

// A key-preserving translation for AM. Every key present in `en` must exist
// here — TypeScript enforces this with `Dict`.
const am: Dict = {
  ministry: "የማዕድን ሚኒስቴር",
  officeGuide: "የቢሮ መመሪያ",
  officeGuideSubtitle:
    "በህንፃው ውስጥ ያለ ማንኛውንም ቢሮ፣ ክፍል፣ ዲፓርትመንት ወይም ወለል ያፈላልጉ።",

  searchPlaceholder: "ቢሮ፣ አገልግሎት፣ ሰው፣ ክፍል ወይም ወለል ይፈልጉ…",
  clearSearch: "ፍለጋ አጽዳ",

  floors: "ወለሎች",
  allFloors: "ሁሉም",
  clearFilters: "ማጣሪያዎችን አጽዳ",

  matches: "ተመሳሳዮች",
  showing: "የሚታይ",
  offices: "ቢሮዎች",

  showingLabel: "የሚታዩ",
  ofLabel: "ከ",
  officesLabel: "ቢሮዎች",
  forLabel: "ለ",
  onFloorLabel: "በ",
  allNOffices: "ሁሉም {count} ቢሮዎች በ{floors} ወለሎች ላይ",

  cardOffice: "ቢሮ",
  cardServices: "አገልግሎቶች",
  cardMoreServices: "+{n} ተጨማሪ",
  servicesShowLess: "አሳንስ",
  cardNoServices: "የተዘረዘሩ ህዝባዊ አገልግሎቶች የሉም።",
  cardFloor: "ወለል",
  cardServiceCountOne: "1 አገልግሎት",
  cardServiceCountMany: "{n} አገልግሎቶች",
  cardInfoOnly: "መረጃ ብቻ",

  noMatchesTitle: "«{term}» የተባለ ቢሮ አልተገኘም።",
  noOfficesTitle: "የሚታይ ቢሮ የለም።",
  noMatchesSubtitle: "ሌላ ስም፣ የክፍል ቁጥር፣ ዲፓርትመንት ወይም ወለል ይሞክሩ።",

  footerCopy: "© {year} የማዕድን ሚኒስቴር · የቢሮ መመሪያ",
  scrollToTop: "ወደ ላይ ተመለስ",

  loading: "እየተጫነ ነው…",
  unavailableTitle: "የቢሮ መመሪያ አልተገኘም",
  unavailableSubtitle: "እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።",

  language: "ቋንቋ",

  announcements: "ማስታወቂያዎች",
  noAnnouncementsTitle: "ምንም ማስታወቂያ የለም።",
  noAnnouncementsSubtitle: "አስተዳዳሪው ገና ማስታወቂያ አላሳተመም።",
};

export type DictKey = keyof typeof en;

export const dictionary: Record<Locale, Dict> = { en, am };

/**
 * Simple `{placeholder}` interpolation. Missing placeholders are left as-is
 * so obvious mistakes show up during dev.
 */
export const interpolate = (
  template: string,
  vars?: Record<string, string | number>
): string => {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    key in vars ? String(vars[key]) : `{${key}}`
  );
};
