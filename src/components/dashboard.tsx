import type { Dashboard } from "@/lib/cockpit";
import {
  commsView,
  homeView,
  marketView,
  needs,
  planView,
  sourceHealth,
} from "@/lib/view";
import { CommsPanel } from "@/components/panels/comms";
import { FlightPlanPanel } from "@/components/panels/flight-plan";
import { HomeSysPanel } from "@/components/panels/home-sys";
import { MarketPanel } from "@/components/panels/market";
import { NeedsYou } from "@/components/panels/needs-you";
import { NextUpCard } from "@/components/panels/next-up";
import { SysStrip } from "@/components/panels/sys-strip";
import { BottomTabs } from "@/components/layout/bottom-tabs";

export function DashboardView({
  d,
  now,
  scoped,
}: {
  d: Dashboard;
  now: Date;
  /** On a segment page, only panels with content render. */
  scoped?: boolean;
}) {
  const items = d.items;
  const need = needs(items, now);
  const comms = commsView(items);
  const plan = planView(items, now);
  const market = marketView(items);
  const home = homeView(items);
  const sources = sourceHealth(d.results);
  const resultFor = (id: string) => d.results.find((r) => r.sensor.id === id)?.result;

  const gmailResult = resultFor("gmail");
  const taskResult = resultFor("notion-task");
  const calResult = resultFor("calendar");
  const mktResult = resultFor("investment");
  const haResult = resultFor("home-assistant");

  const showComms =
    !scoped ||
    comms.replies.length > 0 ||
    comms.fyi.length > 0 ||
    comms.tasks.length > 0 ||
    gmailResult?.ok === false ||
    taskResult?.ok === false;
  const showPlan = !scoped || plan.events.length > 0 || calResult?.ok === false;
  const showMarket =
    !scoped ||
    market.holdings.length > 0 ||
    market.keyDates.length > 0 ||
    mktResult?.ok === false;
  const showHome = !scoped || home.length > 0 || haResult?.ok === false;

  const tabs = [
    { id: "needs-you", label: "CAUT" },
    showPlan && { id: "flight-plan", label: "PLAN" },
    showComms && { id: "comms", label: "COMMS" },
    showHome && { id: "home-sys", label: "HOME" },
    showMarket && { id: "market", label: "MKT" },
  ].filter(Boolean) as { id: string; label: string }[];

  return (
    <>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3.5 pb-28 pt-4 sm:px-6 lg:pb-10">
        {(d.nowEvent ?? d.nextEvent) && (
          <NextUpCard event={(d.nowEvent ?? d.nextEvent)!} ongoing={!!d.nowEvent} />
        )}
        <NeedsYou items={need.items} overflow={need.overflow} />

        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-start">
          {showPlan && (
            <div className="order-1 lg:order-2">
              <FlightPlanPanel view={plan} result={calResult} />
            </div>
          )}
          {showComms && (
            <div className="order-2 lg:order-1">
              <CommsPanel view={comms} gmailResult={gmailResult} taskResult={taskResult} />
            </div>
          )}
          {(showMarket || showHome) && (
            <div className="order-3 grid gap-4 md:grid-cols-2 lg:flex lg:flex-col">
              {showMarket && (
                <div className="order-2 md:order-1">
                  <MarketPanel view={market} result={mktResult} />
                </div>
              )}
              {showHome && (
                <div className="order-1 md:order-2">
                  <HomeSysPanel devices={home} result={haResult} />
                </div>
              )}
            </div>
          )}
        </div>

        <SysStrip sources={sources} syncAt={d.fetchedAt} />
      </main>
      <BottomTabs targets={tabs} />
    </>
  );
}
