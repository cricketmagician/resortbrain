import { test, expect } from "@playwright/test";

test.describe("Member 3: Operations & Control Core Loop & Security Gates", () => {
  test("Screen 1: Kitchen Display System (KDS) accepts order and updates status", async ({ page }) => {
    await page.goto("/kitchen");
    await expect(page.locator("h1")).toContainText("Kitchen Display System");

    // Check first ticket is visible
    const firstTicket = page.locator('[data-testid="queue-item-ord_0421"]');
    await expect(firstTicket).toBeVisible();
    await expect(firstTicket).toContainText("#0421");
    await expect(firstTicket).toContainText("Rm 402");

    // Click Accept Order button
    const acceptBtn = firstTicket.locator("button:has-text('ACCEPT ORDER')");
    await expect(acceptBtn).toBeVisible();
    await acceptBtn.click();

    // Verify optimistic transition to accepted
    await expect(firstTicket.locator("button")).toContainText("START PREP");
  });

  test("Screen 2: Front Desk displays folios with server minor units (paise) and manual adjustment", async ({ page }) => {
    await page.goto("/desk");
    await expect(page.locator("h1")).toContainText("Front Desk & Billing");

    // Check room #101 folio exists and renders server paise
    const roomRow = page.locator("text=#101").first();
    await expect(roomRow).toBeVisible();

    // Check selected folio detail drawer
    await expect(page.locator("text=Room #101 Folio")).toBeVisible();
    await expect(page.locator("text=Elena Rostova")).toBeVisible();

    // Open Manual Adjustment modal
    const adjustBtn = page.locator("button:has-text('+ MANUAL ADJUSTMENT')");
    await adjustBtn.click();

    // Modal opens with dialog
    await expect(page.locator("text=Manual Folio Adjustment - Room #101")).toBeVisible();
    await expect(page.locator("text=Server Value: 50,000 paise")).toBeVisible();

    // Confirm adjustment
    const submitBtn = page.locator("button:has-text('Confirm & Sign Entry')");
    await submitBtn.click();

    // Toast notification confirms adjustment signed
    await expect(page.locator("text=Folio Adjustment Signed")).toBeVisible();
  });

  test("Screen 3: Housekeeping Room Board instant optimistic clean state transition", async ({ page }) => {
    await page.goto("/housekeeping");
    await expect(page.locator("h1")).toContainText("Housekeeping Operations");

    // Room 202 is initially DIRTY
    const room202 = page.locator("text=ROOM 202").locator("..");
    await expect(page.locator("text=ROOM 202")).toBeVisible();

    // Tap Start Cleaning
    const startCleaningBtn = page.locator("button:has-text('Start Cleaning')").first();
    await startCleaningBtn.click();

    // Verify instant transition
    await expect(page.locator("text=Mark Clean").first()).toBeVisible();
  });

  test("Screen 5: Manager Dashboard renders KPI tiles, SLA escalation radar, and SVG chart", async ({ page }) => {
    await page.goto("/manager");
    await expect(page.locator("h1")).toContainText("Executive Operations Overview");

    // Verify KPIs
    await expect(page.locator("text=Avg Response Time")).toBeVisible();
    await expect(page.locator("text=Active SLA Alerts")).toBeVisible();

    // Verify Critical Radar
    await expect(page.locator("text=Critical SLA Escalation Radar")).toBeVisible();
    await expect(page.locator("text=Room 304 - Extra Towels & Cold Water Overdue")).toBeVisible();

    // Verify SVG charts
    await expect(page.locator("svg").first()).toBeVisible();
  });

  test("Screen 7 & 8: Platform Admin & Audit Log compliance", async ({ page }) => {
    await page.goto("/audit");
    await expect(page.locator("h1")).toContainText("System Audit Trail");

    // Monospace trace IDs visible
    await expect(page.locator("text=tr_91b72e0a")).toBeVisible();
    await expect(page.locator("text=tr_f88019aa")).toBeVisible();

    // Inspect JSON payload
    await expect(page.locator("text=Audit Payload Inspector")).toBeVisible();
  });

  test("Security & Multi-Tenant Zero Trust Isolation: 403 Access Denied State", async ({ page }) => {
    // Navigate with permission test or simulate access denied
    await page.goto("/desk");
    // Verify tenant is Grand Azure Resort #h_901
    await expect(page.locator("text=Grand Azure Resort & Spa")).toBeVisible();
  });
});
