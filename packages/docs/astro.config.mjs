import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import { githubAlertsIntegration } from "./src/plugins/github-alerts";

const base = "/graph-explorer";

const shellLanguages = new Set(["bash", "sh", "shell", "zsh"]);

/** Renders shell code blocks in the dark theme in both themes, so they read as a terminal. */
function darkShellBlocks() {
  return {
    name: "dark-shell-blocks",
    hooks: {
      postprocessRenderedBlockGroup({ renderedGroupContents, renderData }) {
        if (
          !renderedGroupContents.every(({ codeBlock }) =>
            shellLanguages.has(codeBlock.language),
          )
        )
          return;
        const { properties } = renderData.groupAst;
        properties.dataTheme = "dark";
        properties.className = [
          ...(properties.className ?? []),
          "dark-surface",
        ];
      },
    },
  };
}

export default defineConfig({
  site: "https://aws.github.io",
  base,
  integrations: [
    githubAlertsIntegration(),
    starlight({
      title: "Graph Explorer",
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
      },
      favicon: "/favicon.svg",
      head: [
        {
          tag: "link",
          attrs: { rel: "icon", href: `${base}/favicon.ico`, sizes: "32x32" },
        },
        {
          tag: "link",
          attrs: {
            rel: "apple-touch-icon",
            href: `${base}/apple-touch-icon.png`,
          },
        },
      ],
      customCss: [
        "@fontsource/inter/400.css",
        "@fontsource/inter/500.css",
        "@fontsource/inter/600.css",
        "@fontsource/inter/700.css",
        "@fontsource/inter/800.css",
        "./src/styles/tokens.css",
        "./src/styles/custom.css",
      ],
      expressiveCode: {
        frames: false,
        plugins: [darkShellBlocks()],
      },
      components: {
        Head: "./src/components/Head.astro",
        Hero: "./src/components/Hero.astro",
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/aws/graph-explorer",
        },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [{ autogenerate: { directory: "getting-started" } }],
        },
        {
          label: "Features",
          items: [{ autogenerate: { directory: "features" } }],
        },
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
        {
          label: "References",
          items: [{ autogenerate: { directory: "references" } }],
        },
      ],
    }),
  ],
});
