// @ts-check
/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Application Dictionary",
  tagline: "The help and manual for the administrator windows every application shares",
  url: "https://businessappwithai.github.io",
  baseUrl: "/application-dictionary/",
  onBrokenLinks: "warn",
  markdown: { format: "detect", mermaid: true, hooks: { onBrokenMarkdownLinks: "warn" } },
  themes: ["@docusaurus/theme-mermaid"],
  presets: [
    [
      "classic",
      {
        docs: { routeBasePath: "/", sidebarPath: "./sidebars.js" },
        blog: false,
        theme: { customCss: "./src/css/custom.css" },
      },
    ],
  ],
  themeConfig: {
    navbar: {
      title: "Application Dictionary",
      items: [{ type: "docSidebar", sidebarId: "manual", position: "left", label: "Manual" }],
    },
    footer: { style: "dark", copyright: "Application Dictionary manual — common to every generated application." },
    colorMode: { respectPrefersColorScheme: true },
  },
};

module.exports = config;
