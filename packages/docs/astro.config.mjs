import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://aws.github.io",
  base: "/graph-explorer",
  integrations: [
    starlight({
      title: "Graph Explorer",
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
          autogenerate: { directory: "getting-started" },
        },
        { label: "Features", autogenerate: { directory: "features" } },
        { label: "Guides", autogenerate: { directory: "guides" } },
        { label: "References", autogenerate: { directory: "references" } },
      ],
    }),
  ],
});
