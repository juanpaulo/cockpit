import { expect, test } from "@playwright/test";

test("overview renders segments and instruments from fixtures", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Cockpit" })).toBeVisible();
  await expect(page.getByText("Sunday lunch plans")).toBeVisible();
  await expect(page.getByText("7203.T")).toBeVisible();
  await expect(page.getByText("Solar power")).toBeVisible();
});

test("segment page scopes content to that segment", async ({ page }) => {
  await page.goto("/segment/family");
  await expect(page.getByText("Sunday lunch plans")).toBeVisible();
  await expect(page.getByText("7203.T")).not.toBeVisible();
});

test("unknown segment 404s", async ({ page }) => {
  const res = await page.goto("/segment/nope");
  expect(res?.status()).toBe(404);
});
