import { PublicKiosk } from "@/components/signage/PublicKiosk";

export default async function FloorOfficeGuidePage({
  params,
}: {
  params: Promise<{ floornumber: string }>;
}) {
  const p = await params;
  return <PublicKiosk initialFloor={Number(p.floornumber)} />;
}
