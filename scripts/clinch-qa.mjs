import { chromium } from "playwright";

const base = process.argv[2] || "http://127.0.0.1:8080";
const shot = (name) => `/workspace/screenshots/${name}`;
// Must match the DESK_PIN the server under test was started with.
const deskPin = process.env.DESK_PIN;
if (!deskPin) {
  throw new Error("Set DESK_PIN to the value the target server is running with before running this QA script.");
}

const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

async function run(name, viewport, fn) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await fn(page);
  if (errors.length) {
    console.error(`[${name}] errors`, errors);
    throw new Error(`${name} had console/page errors`);
  }
  await page.close();
  console.log(`[${name}] ok`);
}

await run("home-locker", { width: 1280, height: 800 }, async (page) => {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText();
  if (!/The Archduke/i.test(text) || !/Oden Enough/i.test(text)) {
    await page.screenshot({ path: shot("home-missing-roster.png"), fullPage: true });
    throw new Error("Home is missing the Period 10 locker");
  }
  if ((text.match(/The Archduke|Surefoot|Walk-It-In|Mass Appeal/g) || []).length < 4) {
    throw new Error("Home locker looks thin: " + text.slice(0, 200));
  }
  await page.screenshot({ path: shot("app-builder-preview.png"), fullPage: true });
});

await run("desk-unlock-and-reset", { width: 1280, height: 900 }, async (page) => {
  await page.goto(`${base}/desk`, { waitUntil: "networkidle" });
  await page.locator("#desk-pin").fill(deskPin);
  await page.getByRole("button", { name: "Unlock desk" }).click();
  await page.getByText("Desk unlocked.").waitFor({ timeout: 8000 });
  await page.getByRole("button", { name: "Reset locker" }).click();
  await page.getByText("Locker reset").waitFor({ timeout: 15000 });
  const text = await page.locator("body").innerText();
  if (!/36 on the book/i.test(text) && !/36 people/i.test(text)) {
    // badge says "36 on the book"
    if (!/36/.test(text)) {
      await page.screenshot({ path: shot("desk-reset.png"), fullPage: true });
      throw new Error("Reset did not show 36 people: " + text.slice(0, 300));
    }
  }
  await page.screenshot({ path: shot("desk-reset.png"), fullPage: true });
});

await run("add-new-hire", { width: 1280, height: 800 }, async (page) => {
  await page.goto(`${base}/desk`, { waitUntil: "networkidle" });
  const pin = page.locator("#desk-pin");
  if (await pin.count()) {
    await pin.fill(deskPin);
    const unlock = page.getByRole("button", { name: /Unlock desk|Re-lock check/ });
    await unlock.click();
    await page.waitForTimeout(400);
  }
  await page.getByRole("button", { name: "roster" }).click();
  await page.getByText("Add anyone").waitFor();
  const form = page.locator("form").filter({ hasText: "Add anyone" });
  const inputs = form.locator("input");
  await inputs.nth(0).fill("Remy");
  await inputs.nth(1).fill("Sato");
  await inputs.nth(2).fill("Side Door");
  await page.getByRole("button", { name: "Add fighter" }).click();
  await page.getByText("Added to the book.").waitFor({ timeout: 8000 });
  await page.getByText("Side Door").waitFor();
  await page.screenshot({ path: shot("roster-added.png") });
});

await run("open-week-and-score", { width: 1280, height: 900 }, async (page) => {
  await page.goto(`${base}/desk`, { waitUntil: "networkidle" });
  const pin = page.locator("#desk-pin");
  if (await pin.count()) {
    await pin.fill(deskPin);
    await page.getByRole("button", { name: /Unlock desk|Re-lock check/ }).click();
    await page.waitForTimeout(400);
  }
  const start = page.getByRole("button", { name: "Seed and open week 1" });
  if (await start.count()) {
    await start.click();
    await page.getByText("Circuit is live").waitFor({ timeout: 20000 });
  }
  await page.goto(`${base}/score`, { waitUntil: "networkidle" });
  const firstMetric = page.locator("table button").first();
  await firstMetric.click();
  await page.getByRole("button", { name: "Save sheet" }).click();
  await page.getByText("Sheet saved.").waitFor({ timeout: 8000 });
  await page.screenshot({ path: shot("score-sheet.png"), fullPage: true });
});

await run("lock-week", { width: 1280, height: 800 }, async (page) => {
  await page.goto(`${base}/desk`, { waitUntil: "networkidle" });
  await page.locator("#desk-pin").fill(deskPin);
  await page.getByRole("button", { name: /Unlock desk|Re-lock check/ }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: "Lock scores" }).click();
  await page.getByText("Week locked").waitFor({ timeout: 8000 });
  await page.goto(`${base}/score`, { waitUntil: "networkidle" });
  const text = await page.locator("body").innerText();
  if (!/locked/i.test(text)) {
    throw new Error("Scoresheet did not show locked state");
  }
  await page.screenshot({ path: shot("score-locked.png") });
});

await run("mobile-board", { width: 390, height: 844 }, async (page) => {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
  });
  await page.screenshot({ path: shot("mobile-board.png"), fullPage: true });
  if (overflow) throw new Error("Horizontal overflow on mobile board");
});

await browser.close();
console.log("all qa passed");
