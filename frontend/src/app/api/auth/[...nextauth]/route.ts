// NextAuth v5 requires a catch-all `[...nextauth]` route so it can
// respond to every path under `/api/auth/*` — the SDK internally
// dispatches on the segment (`/session`, `/callback/credentials`,
// `/signin`, `/signout`, `/csrf`, etc.). Previously this lived at
// `app/api/auth/route.ts` which only matched the bare `/api/auth`
// URL, so `useSession()` (which hits `/api/auth/session`) 404'd.
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
