import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard";
import { Header } from "@/components/layout/header";
import { currentProfile } from "@/lib/auth/current-profile";
import { loadAppConfig } from "@/lib/config/app-config";
import { loadDashboard } from "@/lib/cockpit";
import { visibleSegments } from "@/lib/profiles/model";

export const instant = false;

async function SegmentView({ id }: { id: string }) {
  await connection();
  const dashboard = await loadDashboard(id);
  const now = new Date(dashboard.fetchedAt);
  return (
    <>
      <Header
        segments={dashboard.segments}
        weather={dashboard.weather}
        nextEvent={dashboard.nextEvent}
        nowEvent={dashboard.nowEvent}
        now={now}
      />
      <DashboardView d={dashboard} now={now} scoped />
    </>
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = loadAppConfig();
  const profile = currentProfile(config);
  const valid = profile && visibleSegments(config.segments, profile).some((s) => s.id === id);
  if (!valid) notFound();

  return (
    <Suspense fallback={null}>
      <SegmentView id={id} />
    </Suspense>
  );
}
