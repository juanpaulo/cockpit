import { connection } from "next/server";
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard";
import { Header } from "@/components/layout/header";
import { loadDashboard } from "@/lib/cockpit";

async function Overview() {
  await connection();
  const dashboard = await loadDashboard();
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
      <DashboardView d={dashboard} now={now} />
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Overview />
    </Suspense>
  );
}
