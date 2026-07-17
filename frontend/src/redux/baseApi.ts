import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";
import { performLogout } from "@/utils/logout";

/**
 * RTK Query base. Every outgoing request is stamped with the NextAuth
 * session's `accessToken` so the backend `authenticateToken` middleware
 * accepts it. Missing session → no header → backend replies 401 →
 * `baseQueryWithReauth` runs `performLogout()` so the user gets a
 * clean re-login instead of a broken UI.
 */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_BASE_URL}`,
  prepareHeaders: async (headers) => {
    try {
      const session = await getSession();
      const token = (session as any)?.accessToken;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
    } catch {
      // Session lookup can fail during SSR or when the auth service
      // isn't reachable — proceed without the header; the request will
      // 401 and the reauth wrapper below will handle cleanup.
    }
    headers.set("accept", "application/json");
    // Intentionally NOT setting `content-type` here. RTK Query's
    // `fetchBaseQuery` sets `application/json` automatically when the
    // body is a plain object, and correctly OMITS it for `FormData`
    // (so the browser adds the multipart boundary). Setting it here
    // would break every multipart upload (announcement media, etc.).
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const status = result.error.status;
    // 401 = missing/invalid token, 403 = expired token from
    // authenticateToken middleware. Treat both as "the session is no
    // good anymore" and force a clean re-login. Any legitimate 403
    // (e.g. permission denied on a route the user genuinely lacks
    // access to) should return a different `data.message` — refine
    // this later if we start applying `checkPermission` broadly.
    if (status === 401) {
      // eslint-disable-next-line no-console
      console.warn("[baseApi] 401 — forcing logout");
      // Fire-and-forget; navigation is a hard nav so subsequent
      // requests won't run against the same page.
      void performLogout("/login");
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Roles",
    "Permissions",
    "Floors",
    "Offices",
    "SignageSummary",
    "Theme",
    "Announcements",
    "DisplayMode",
  ],
  endpoints: () => ({}),
});
