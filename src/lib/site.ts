/**
 * The main site lives in its own repo (shoemakerc/shoemakerc.github.io).
 * This app is served under it at /coffee-calculator/, so links back out
 * are full URLs: next/link would add the basePath to them.
 */
export const site = {
  name: "Chris Shoemaker",
  url: "https://shoemakerc.github.io",
  appUrl: "https://shoemakerc.github.io/coffee-calculator/",
  source: "https://github.com/shoemakerc/coffee-calculator",
  nav: [
    { label: "Writing", path: "/music/" },
    { label: "Listening", path: "/#listening" },
    { label: "Reading", path: "/reading/" },
    { label: "Projects", path: "/projects/" },
    { label: "About", path: "/about/" },
  ],
  links: [
    { label: "Email", href: "mailto:chriskimshoemaker@gmail.com" },
    { label: "GitHub", href: "https://github.com/shoemakerc" },
    { label: "Spotify", href: "https://open.spotify.com/user/someguy_886" },
    { label: "RateYourMusic", href: "https://rateyourmusic.com/~shoeman27" },
    { label: "Last.fm", href: "https://www.last.fm/user/shoeman27" },
    { label: "Goodreads", href: "https://www.goodreads.com/user/show/166556608" },
  ],
};

export const siteLink = (path: string) => `${site.url}${path}`;
