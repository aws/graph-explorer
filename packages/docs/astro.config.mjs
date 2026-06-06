import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://aws.github.io",
  base: "/graph-explorer",
  integrations: [
    starlight({
      title: "Graph Explorer",
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
      },
      components: {
        Head: "./src/components/Head.astro",
        Header: "./src/components/Header.astro",
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
          autogenerate: { directory: "getting-started" },
        },
        { label: "Features", autogenerate: { directory: "features" } },
        { label: "Guides", autogenerate: { directory: "guides" } },
        { label: "References", autogenerate: { directory: "references" } },
      ],
    }),
  ],
});
