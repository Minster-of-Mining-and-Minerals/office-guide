export interface Floor {
  floor_id: string;
  floor_number: number;
  name: string;
  name_am: string | null;
  map_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FloorSummary {
  floor_id: string;
  floor_number: number;
  name: string;
  name_am?: string | null;
}

export interface Office {
  office_id: string;
  floor_id: string;
  name: string;
  name_am: string | null;
  department: string | null;
  department_am: string | null;
  /** Officer / receptionist visitors should ask for on arrival. */
  contact_person: string | null;
  contact_person_am: string | null;
  room_number: string;
  description: string | null;
  description_am: string | null;
  display_order: number;
  /** Short list of services this office provides (used on the guide). */
  services: string[];
  /** Amharic sibling; MUST be the same length + same index order as `services`. */
  services_am: string[];
  created_at: string;
  updated_at: string;
  floor?: FloorSummary;
}

export interface Paginated<T> {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  results: T[];
}

export interface ListParams {
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: "ASC" | "DESC";
  all?: boolean;
}

export interface FloorListParams extends ListParams {
  is_active?: boolean;
}

export interface OfficeListParams extends ListParams {
  floor_id?: string;
}

export interface SignageSummary {
  total_floors: number;
  total_offices: number;
}

export interface FloorPayload {
  floor_id: string;
  floor_number: number;
  name: string;
  name_am: string | null;
  map_image_url: string | null;
}

/** Payload for the public /office-guide scrollable page. */
export interface OfficeGuideContent {
  server_time: string;
  floors: (FloorPayload & { offices: Office[] })[];
}

export type FloorCreatePayload = {
  floor_number: number;
  name: string;
  name_am: string;
  map_image_url?: string | null;
  is_active?: boolean;
};
export type FloorUpdatePayload = Partial<FloorCreatePayload>;

export type OfficeCreatePayload = {
  floor_id: string;
  name: string;
  name_am: string;
  department?: string | null;
  department_am?: string | null;
  contact_person?: string | null;
  contact_person_am?: string | null;
  room_number: string;
  description?: string | null;
  description_am?: string | null;
  display_order?: number;
  services?: string[];
  services_am?: string[];
};
export type OfficeUpdatePayload = Partial<OfficeCreatePayload>;

/**
 * Announcements displayed full-screen on the kiosk when the display mode
 * setting includes announcements. The `media_url` is a relative path such
 * as `/uploads/announcements/xxxxx.mp4` — resolve it against the API host
 * (usually `NEXT_PUBLIC_BASE_URL` with a trailing `/api` stripped) before
 * loading it in an `<img>` or `<video>`.
 */
export type AnnouncementMediaType = "image" | "video";

/** Floor an announcement is assigned to (subset of `Floor`). */
export interface AnnouncementFloorRef {
  floor_id: string;
  floor_number: number;
  name: string;
  name_am?: string | null;
}

/** What the kiosk does with an announcement right now (computed by the API). */
export type AnnouncementStatus = "live" | "scheduled" | "ended" | "hidden";

export type AnnouncementStatusCounts = Record<AnnouncementStatus | "all", number>;

export interface Announcement {
  announcement_id: string;
  /** true = plays on every floor, including floors added later. */
  all_floors: boolean;
  /** Chosen floors when `all_floors` is false, sorted by floor number. */
  floors: AnnouncementFloorRef[];
  status: AnnouncementStatus;
  title: string;
  message: string | null;
  media_type: AnnouncementMediaType | null;
  media_url: string | null;
  duration_seconds: number;
  display_order: number;
  audio_enabled: boolean;
  is_visible: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnouncementListParams extends ListParams {
  is_visible?: boolean;
  status?: AnnouncementStatus;
  /** A floor's id (announcements that play there), or "all" for all-floor ones. */
  floor_id?: string;
}

export interface AnnouncementList extends Paginated<Announcement> {
  counts: AnnouncementStatusCounts;
}

export interface PublicAnnouncementsPayload {
  server_time: string;
  announcements: Announcement[];
}

/**
 * Kiosk display mode — persisted in `app_settings` under the
 * `display_mode` key. Drives what /office-guide shows.
 */
export type DisplayModeValue =
  | "guide_only"
  | "announcements_only"
  | "both";

export interface DisplayMode {
  mode: DisplayModeValue;
  /** Seconds between guide/announcement swap when mode === "both". */
  rotation_seconds: number;
}

export type DisplayModeUpdatePayload = Partial<DisplayMode>;
