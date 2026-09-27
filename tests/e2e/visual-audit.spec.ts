import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const routes = [
  { name: "home", path: "/" },
  { name: "staff", path: "/staff" },
  { name: "kitchen", path: "/kitchen" },
  { name: "desk", path: "/desk" },
  { name: "housekeeping", path: "/housekeeping" },
  { name: "device", path: "/device" },
  { name: "manager", path: "/manager" },
  { name: "audit", path: "/audit" },
  { name: "hotel", path: "/hotel" },
  { name: "pricing", path: "/pricing" },
];

test.describe("Visual Audit: Light & Dark Modes", () => {
  const screenshotDir = path.join(process.cwd(), "public", "audit-screenshots");
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  for (const route of routes) {
    test(`Capture ${route.name} in Dark and Light mode`, async ({ page }) => {
      // 1. Dark mode
      await page.goto(route.path);
      await page.evaluate(() => {
        document.documentElement.classList.remove("light");
        document.documentElement.classList.add("dark");
        localStorage.setItem("resortbrain_theme", "dark");
      });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(screenshotDir, `${route.name}-dark.png`),
        fullPage: false,
      });

      // 2. Light mode
      await page.evaluate(() => {
        document.documentElement.classList.remove("dark");
        document.documentElement.classList.add("light");
        localStorage.setItem("resortbrain_theme", "light");
      });
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(screenshotDir, `${route.name}-light.png`),
        fullPage: false,
      });

      expect(true).toBeTruthy();
    });
  }

  test("Capture Staff tabs & modals in Light and Dark mode", async ({ page }) => {
    await page.goto("/staff");
    
    // Light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("resortbrain_theme", "light");
    });
    await page.waitForTimeout(200);

    // Tab 2: Station Coverage
    await page.locator("button:has-text('Station Coverage')").click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, `staff-coverage-light.png`),
      fullPage: false,
    });

    // Tab 3: Velocity & Rating
    await page.locator("button:has-text('Velocity & Rating')").click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, `staff-leaderboard-light.png`),
      fullPage: false,
    });

    // Back to Directory & open Onboard Modal
    await page.locator("button:has-text('Directory & Roster')").click();
    await page.waitForTimeout(100);
    await page.locator("button:has-text('+ Add Staff Member')").click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, `staff-onboard-modal-light.png`),
      fullPage: false,
    });

    // Close modal
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);

    // Open Dispatch Modal
    await page.locator("button:has-text('Dispatch Task')").first().click();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(screenshotDir, `staff-dispatch-modal-light.png`),
      fullPage: false,
    });

    expect(true).toBeTruthy();
  });
});

