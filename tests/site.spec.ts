import { test, expect } from "@playwright/test";

test("SVG notebook grid pauses offscreen and stays static with reduced motion", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const effect = page.locator("svg.hero-grid");
  await expect(effect).toBeVisible();
  await expect(effect).toHaveAttribute("data-running", "true");
  await expect(effect.locator(".hero-grid-sweep")).toHaveCSS("animation-play-state", "running");
  await page.getByRole("button", { name: "Pause backgrounds" }).click();
  await expect(effect).toHaveAttribute("data-running", "false");
  await expect(effect.locator(".hero-grid-sweep")).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("button", { name: "Play backgrounds" }).click();
  await expect(effect).toHaveAttribute("data-running", "true");
  await page.locator(".site-footer").scrollIntoViewIfNeeded();
  await expect(effect).toHaveAttribute("data-running", "false");
  await page.locator(".hero-content").scrollIntoViewIfNeeded();
  await expect(effect).toHaveAttribute("data-running", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(effect).toBeVisible();
  await expect(effect).toHaveAttribute("data-running", "false");
  await expect(effect.locator(".hero-grid-sweep")).toHaveCSS("animation-name", "none");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A chance to grow.");
  await page.getByRole("link", { name: "Explore our programs" }).click();
  await expect(page).toHaveURL(/\/programs$/);
  expect(errors).toEqual([]);
});

test("esports backgrounds rotate while hero copy stays fixed and respect pause and reduced motion", async ({ page }) => {
  await page.clock.install();
  await page.goto("/");
  const backgrounds = page.locator(".hero-background img");
  await expect.poll(() => backgrounds.evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)), { timeout: 30000 }).toBe(true);
  const headline = await page.locator(".hero-content").innerText();
  const before = await page.locator(".hero-photo.is-active").getAttribute("src");
  await page.clock.fastForward(7000);
  await expect(page.locator(".hero-photo.is-active")).not.toHaveAttribute("src", before!);
  await expect(page.locator(".hero-content")).toHaveText(headline, { useInnerText: true });
  await page.getByRole("button", { name: "Pause backgrounds" }).click();
  const paused = await page.locator(".hero-photo.is-active").getAttribute("src");
  await page.clock.fastForward(14000);
  await expect(page.locator(".hero-photo.is-active")).toHaveAttribute("src", paused!);
  await page.getByRole("button", { name: "Show esports image 3" }).click();
  await expect(page.locator(".hero-image-tools .photo-credit")).toContainText("ELLA DON");
  await expect(page.locator(".hero-content")).toHaveText(headline, { useInnerText: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.getByRole("button", { name: "Pause backgrounds" })).toHaveCount(0);
  await page.clock.fastForward(14000);
  await expect(page.getByRole("button", { name: "Show esports image 1" })).toHaveAttribute("aria-pressed", "true");
});

test("server renders both languages with indexing enabled and without stale fundraising claims", async ({ page, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("A place to play.");
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  expect(new URL(canonical!).href).toBe("https://odongfoundation.org/");
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("A chance to grow.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator("main")).not.toContainText(/Annual Fundraising Goal|162,500,000|250,000,000|65% Complete/);
  await page.getByRole("link", { name: "Beralih ke Bahasa Indonesia" }).click();
  await expect(page).toHaveURL(/\/id$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kesempatan untuk tumbuh.");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  expect(errors).toEqual([]);
});

test("headless CMS articles render on the server and search/pagination work", async ({ page, request }) => {
  await page.goto("/blog");
  await expect(page.locator(".post-card").first()).toBeVisible();
  const title = await page.locator(".post-card h3").first().innerText();
  const articleUrl = await page.locator(".post-card h3 a").first().getAttribute("href");
  expect(articleUrl).toMatch(/^\/blog-post\//);
  await page.getByRole("searchbox").fill("zzzz-no-matching-story");
  await expect(page.getByRole("heading", { name: "No stories found" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".post-card").first()).toBeVisible();
  if (await page.getByRole("button", { name: "Next", exact: true }).count()) {
    await page.getByRole("button", { name: "Next", exact: true }).click();
    await expect(page.getByRole("button", { name: "Previous", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Previous", exact: true }).click();
  }
  const response = await request.get(articleUrl!);
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain("BlogPosting");
  expect(html).toContain('class="article-body"');
  await page.goto(articleUrl!);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  await expect(page.locator(".article-body p").first()).not.toBeEmpty();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "index, follow");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://odongfoundation.org" + articleUrl);
  expect((await request.get("/blog-post/nonexistent-odong-article-test")).status()).toBe(404);
});

test("contact creates a WhatsApp draft without sending and preselects volunteer", async ({ page }) => {
  await page.addInitScript(() => {
    window.open = (url) => { (window as unknown as { draft: string }).draft = String(url); return null; };
  });
  await page.goto("/contact?subject=volunteer");
  await expect(page.locator("#subject")).toHaveValue("volunteer");
  await page.getByLabel("Full Name").fill("Local Preview Test");
  await page.getByLabel("Email Address").fill("preview@example.com");
  await page.locator("#phone").fill("+6281234567890");
  await page.getByLabel("Message", { exact: true }).fill("Testing the local draft only; no message will be sent.");
  await page.getByRole("button", { name: /WhatsApp/ }).click();
  const draft = await page.evaluate(() => (window as unknown as { draft: string }).draft);
  expect(draft).toContain("https://wa.me/6282247723858?text=");
  expect(decodeURIComponent(draft)).toContain("Subject: volunteer");
  await expect(page.getByRole("status").filter({ hasText: "Open WhatsApp" })).toBeVisible();
  await expect(page.locator("#donate")).not.toContainText(/65%|162,500,000|250,000,000/);
});

test("mobile menu, donation anchor, and layouts fit a small screen", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open menu" }).click();
  await expect(page.getByRole("button", { name: "Close menu" })).toHaveAttribute("aria-expanded", "true");
  await page.locator("#main-navigation").getByRole("link", { name: "Programs", exact: true }).click();
  await expect(page).toHaveURL(/\/programs$/);
  await expect(page.getByRole("button", { name: "Open menu" })).toHaveAttribute("aria-expanded", "false");
  for (const path of ["/", "/programs", "/about", "/contact", "/blog", "/id"]) {
    await page.goto(path);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("legacy URLs redirect, missing routes return 404, and sitemap includes CMS articles", async ({ request }) => {
  const redirect = await request.get("/about.html", { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe("/about");
  expect((await request.get("/not-a-real-page")).status()).toBe(404);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).toContain("https://odongfoundation.org/blog-post/");
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  const directives = await robots.text();
  expect(directives).toContain("User-Agent: *\nAllow: /");
  expect(directives).toContain("Sitemap: https://odongfoundation.org/sitemap.xml");
  expect(directives).not.toContain("Disallow:");
  for (const path of ["/", "/id", "/about", "/programs", "/contact", "/blog"]) {
    const response = await request.get(path);
    expect(response.headers()["x-robots-tag"] || "").not.toMatch(/noindex|nofollow|none/i);
    const html = await response.text();
    expect(html).toContain('name="robots" content="index, follow"');
    expect(html).not.toMatch(/<meta[^>]+(?:noindex|nofollow|noai|noimageai)/i);
  }
});

test("partner logo backlinks and new email are present on the public pages", async ({ page }) => {
  await page.goto("/");
  for (const [name, url] of [
    ["American Spaces Indonesia", "https://atamerica.or.id/id/beranda/"],
    ["Akademi Garudaku", "https://garudaku.com/"],
    ["NASEF", "https://www.nasef.org/"],
  ]) {
    const link = page.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", url);
    expect(await link.getAttribute("rel")).not.toContain("nofollow");
  }
  await expect(page.locator('a[href="mailto:putri@odongfoundation.org"]')).toBeVisible();
  await expect(page.locator("body")).not.toContainText("yayasan.odong@outlook.com");
});
