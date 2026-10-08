import { z } from "zod";
import type { Readout } from "@/lib/readouts/types";
import type { Sensor, SensorResult } from "@/lib/sensors/types";
import { loadFixture } from "./loader";

const textProp = z.object({ title: z.array(z.object({ plain_text: z.string() })) });
const selectProp = z.object({ select: z.object({ name: z.string() }).nullable() });
const numberProp = z.object({ number: z.number() });
const dateProp = z.object({ date: z.object({ start: z.string() }).nullable() });

const holdingsSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      properties: z.object({
        Ticker: textProp,
        Exchange: selectProp,
        Quantity: numberProp,
        Currency: selectProp,
      }),
    }),
  ),
});

const keyDatesSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      url: z.string(),
      properties: z.object({
        Name: textProp,
        Date: dateProp,
        Type: selectProp,
      }),
    }),
  ),
});

// yahoo-finance2 quote shape (subset we use).
const quotesSchema = z.object({
  quotes: z.record(
    z.string(),
    z.object({
      regularMarketPrice: z.number(),
      currency: z.string(),
      regularMarketChangePercent: z.number().optional(),
    }),
  ),
});

const DAY_MS = 86_400_000;

function providerSymbol(ticker: string, exchange: string): string {
  return exchange === "TSE" ? `${ticker}.T` : ticker;
}

export class MockInvestmentSensor implements Sensor {
  readonly id = "investment" as const;
  readonly name = "Investments";

  async fetchReadouts({ now }: Parameters<Sensor["fetchReadouts"]>[0]): Promise<SensorResult> {
    const holdings = loadFixture("holdings", holdingsSchema, now).results;
    const keyDates = loadFixture("key-dates", keyDatesSchema, now).results;
    const { quotes } = loadFixture("market-quotes", quotesSchema, now);
    const usdJpy = quotes["USDJPY=X"]?.regularMarketPrice ?? 1;

    const readouts: Readout[] = [];
    let totalJpy = 0;
    let dayChangeJpy = 0;

    for (const h of holdings) {
      const p = h.properties;
      const ticker = p.Ticker.title[0]?.plain_text ?? "?";
      const exchange = p.Exchange.select?.name ?? "TSE";
      const symbol = providerSymbol(ticker, exchange);
      const quote = quotes[symbol];
      const qty = p.Quantity.number;
      const price = quote?.regularMarketPrice ?? 0;
      const fx = quote?.currency === "USD" ? usdJpy : 1;
      totalJpy += qty * price * fx;
      dayChangeJpy += qty * price * fx * ((quote?.regularMarketChangePercent ?? 0) / 100);

      readouts.push({
        id: `investment:holding:${h.id}`,
        source: "investment",
        segment: "",
        title: `${symbol}`,
        subtitle: quote
          ? `${qty} × ${quote.currency} ${price.toLocaleString()}`
          : `${qty} — no quote`,
        timestamp: now.toISOString(),
        url: `https://finance.yahoo.com/quote/${symbol}`,
        status: quote ? "advisory" : "caution",
        meta: {
          kind: "holding",
          exchange,
          quantity: qty,
          price,
          currency: quote?.currency,
          changePercent: quote?.regularMarketChangePercent,
        },
      });
    }

    readouts.unshift({
      id: "investment:total",
      source: "investment",
      segment: "",
      title: "Portfolio value",
      timestamp: now.toISOString(),
      url: "https://www.notion.so/",
      status: "advisory",
      meta: { kind: "total", valueJpy: totalJpy, dayChangeJpy },
    });

    const horizon = now.getTime() + 30 * DAY_MS;
    for (const d of keyDates) {
      const p = d.properties;
      const date = p.Date.date?.start;
      if (!date) continue;
      const at = new Date(date).getTime();
      if (at < now.getTime() || at > horizon) continue;
      readouts.push({
        id: `investment:key-date:${d.id}`,
        source: "investment",
        segment: "",
        title: p.Name.title[0]?.plain_text ?? "(untitled)",
        subtitle: p.Type.select?.name ?? undefined,
        timestamp: date,
        url: d.url,
        status: at - now.getTime() <= 7 * DAY_MS ? "caution" : "advisory",
        meta: { kind: "key-date", type: p.Type.select?.name },
      });
    }

    return { ok: true, readouts, fetchedAt: now.toISOString() };
  }
}
