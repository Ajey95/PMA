/**
 * lib/ds/scraper.ts
 * PRD §7.3: "Build scraper tool returning clean JD text"
 * "Must remove noisy content (nav, footer, ads where possible)"
 */

import FirecrawlApp from "@mendable/firecrawl-js";

export interface ScrapedJd {
  text: string;
  title: string;
  company: string;
  url: string;
  charCount: number;
}

export async function scrapeJobDescription(url: string): Promise<ScrapedJd> {
  const empty: ScrapedJd = {
    text: "",
    title: "",
    company: "",
    url,
    charCount: 0,
  };

  try {
    const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

    // Phase 1: Try Firecrawl
    if (firecrawlApiKey) {
      console.log(`[scraper] Using Firecrawl to scrape ${url}`);
      try {
        const app = new FirecrawlApp({ apiKey: firecrawlApiKey });
        const scrapeResult = await app.scrapeUrl(url, {
          formats: ["markdown", "html"],
        });

        if (scrapeResult.success) {
          const mdText = scrapeResult.markdown || "";
          const html = scrapeResult.html || "";
          
          let title = "";
          let company = "";
          
          if (html) {
             const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
             const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
             const ogSiteName = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);

             title = ogTitle?.[1] ?? titleMatch?.[1] ?? "";
             company = ogSiteName?.[1] ?? "";
          }

          return {
            text: mdText.slice(0, 14000),
            title: title ? decodeEntities(title.trim()) : "Job Description",
            company: company ? decodeEntities(company.trim()) : "",
            url,
            charCount: mdText.length,
          };
        } else {
          console.warn(`[scraper] Firecrawl failed: ${scrapeResult.error}`);
        }
      } catch (fcErr) {
        console.warn(`[scraper] Firecrawl threw an error:`, fcErr);
      }
    }

    console.log(`[scraper] Falling back to standard fetch for ${url}`);
    
    // Phase 2: Fallback to basic fetch
    const response = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PMA-Scraper/1.0; +https://pma-app.vercel.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      console.warn(`[scraper] HTTP ${response.status} for ${url}`);
      return empty;
    }

    const html = await response.text();
    const text = cleanHtml(html);

    // Try to extract page title and company from common meta tags
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogSiteName = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i);

    const rawTitle = ogTitle?.[1] ?? titleMatch?.[1] ?? "";
    const company = ogSiteName?.[1] ?? "";

    return {
      text: text.slice(0, 14000),
      title: decodeEntities(rawTitle.trim()),
      company: decodeEntities(company.trim()),
      url,
      charCount: text.length,
    };
  } catch (err) {
    console.warn(`[scraper] Failed to fetch ${url}:`, err);
    return empty;
  }
}

// ── HTML cleaning pipeline ────────────────────────────────────────────────────

function cleanHtml(html: string): string {
  return html
    // Remove entire noisy tag blocks
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<aside[\s\S]*?<\/aside>/gi, " ")
    .replace(/<form[\s\S]*?<\/form>/gi, " ")
    .replace(/<button[\s\S]*?<\/button>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<figure[\s\S]*?<\/figure>/gi, " ")
    // Strip all remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode common HTML entities
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&bull;/g, "•")
    // Collapse whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
