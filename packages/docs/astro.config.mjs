import starlight from "@astrojs/starlight";

// @ts-check
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://aws.github.io",
  base: "/graph-explorer",
  integrations: [
    starlight({
      title: "Docs with Tailwind",
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
        {
          label: "Guides",
          items: [{ autogenerate: { directory: "guides" } }],
        },
        {
          label: "References",
          items: [{ autogenerate: { directory: "references" } }],
        },
      ],
      customCss: ["./src/styles/global.css"],
    }),
  ],
});
