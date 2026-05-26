"use client";

import MapLayout from "./MapLayout";

export default function MapClientWrapper({ companyId }: { companyId?: string }) {
  return <MapLayout companyId={companyId} />;
}
