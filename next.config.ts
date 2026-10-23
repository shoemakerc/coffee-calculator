import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build to plain HTML/CSS/JS in `out/` so GitHub Pages can serve it.
  output: "export",
  // GitHub serves this repo at shoemakerc.github.io/coffee-calculator/,
  // right alongside the main site.
  basePath: "/coffee-calculator",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
