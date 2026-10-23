import shared from "./site-shared.json";

/**
 * The main site lives in its own repo (shoemakerc/shoemakerc.github.io).
 * Its name, nav and footer links come from site-shared.json, which
 * scripts/sync-site.mjs refreshes from the site on every dev and build.
 * This app is served under it at /coffee-calculator/, so links back out
 * are full URLs: next/link would add the basePath to them.
 */
export const site = {
  ...shared,
  appUrl: "https://shoemakerc.github.io/coffee-calculator/",
  source: "https://github.com/shoemakerc/coffee-calculator",
};

export const siteLink = (path: string) => `${site.url}${path}`;
