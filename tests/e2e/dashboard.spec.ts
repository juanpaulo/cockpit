import { expect, test } from "@playwright/test";

test("overview renders panels and needs-you from fixtures", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("NEEDS YOU")).toBeVisible();
  await expect(page.getByText("FLIGHT PLAN · TODAY")).toBeVisible();
  await expect(page.locator("#flight-plan").getByText(/NOW \d{2}:\d{2}/)).toBeVisible();
  await expect(page.locator("#comms").getByText("COMMS")).toBeVisible();
  await expect(page.getByText("NEEDS REPLY")).toBeVisible();
  await expect(page.getByText("Sunday lunch plans").first()).toBeVisible();
  await expect(page.getByText("MARKET")).toBeVisible();
  await expect(page.getByText("7203.T")).toBeVisible();
  await expect(page.getByText("HOME SYS")).toBeVisible();
  await expect(page.getByText("Greenhouse vent").first()).toBeVisible();
  await expect(page.getByText("GMAIL")).toBeVisible();
});

test("segment page scopes content to that segment", async ({ page }) => {
  await page.goto("/segment/family");
  await expect(page.getByText("Sunday lunch plans").first()).toBeVisible();
  await expect(page.getByText("7203.T")).not.toBeVisible();
});

test("unknown segment 404s", async ({ page }) => {
  const res = await page.goto("/segment/nope");
  expect(res?.status()).toBe(404);
});
