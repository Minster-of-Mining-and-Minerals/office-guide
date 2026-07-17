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
