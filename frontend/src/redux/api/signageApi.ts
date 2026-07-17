import { baseApi } from "../baseApi";
import type { OfficeGuideContent, SignageSummary } from "../types/signage";

export const signageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSignageSummary: builder.query<SignageSummary, void>({
      query: () => "/dashboard/signage-summary",
      transformResponse: (response: any): SignageSummary => response.data,
      providesTags: ["SignageSummary"],
    }),
    getOfficeGuide: builder.query<OfficeGuideContent, void>({
      query: () => "/public/office-guide",
      transformResponse: (response: any): OfficeGuideContent => response.data,
      // Tagged so the kiosk page can trigger a refetch via socket
      // `signage:content:updated` events (see /office-guide/page.tsx).
      providesTags: [{ type: "Floors", id: "PUBLIC_GUIDE" }],
    }),
  }),
});

export const { useGetSignageSummaryQuery, useGetOfficeGuideQuery } = signageApi;
