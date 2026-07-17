import CreateRole from "@/features/template/component/roleList/CreateRole";

/**
 * Edit-a-role route. `CreateRole` already detects the mode via `useParams`
 * and swaps its fetch / submit paths — this file is intentionally a thin
 * mount point so the route exists in the Next.js router.
 */
export default function EditRolePage() {
  return <CreateRole />;
}
