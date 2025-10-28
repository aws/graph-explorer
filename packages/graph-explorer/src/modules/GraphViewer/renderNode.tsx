import type { VertexTypeConfig } from "@/core";
import { logger } from "@/utils";
import {
  keepPreviousData,
  type QueryClient,
  queryOptions,
} from "@tanstack/react-query";

export type VertexIconConfig = Pick<
  VertexTypeConfig,
  "type" | "iconUrl" | "iconImageType" | "color"
>;

const iconQueryOptions = (url: string) =>
  queryOptions({
    queryKey: ["icon", url],
    queryFn: async () => {
      logger.debug("Fetching icon", url);
      const response = await fetch(url);
      return await response.text();
    },
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });

const iconStyledQueryOptions = (iconData: string, color: string) =>
  queryOptions({
    queryKey: ["icon-style", iconData, color],
    queryFn: () => {
      let iconText = iconData;
      iconText = updateSize(iconText);
      iconText = embedSvgInsideCytoscapeSvgWrapper(iconText);
      iconText = applyCurrentColor(iconText, color);
      iconText = encodeSvg(iconText);
      logger.debug("Styling icon", iconText);
      return iconText;
    },
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

export async function renderNode(
  client: QueryClient,
  vtConfig: VertexIconConfig
): Promise<string | null> {
  if (!vtConfig.iconUrl) {
    return null;
  }

  if (vtConfig.iconImageType !== "image/svg+xml") {
    return vtConfig.iconUrl;
  }

  try {
    const iconData = await client.fetchQuery(
      iconQueryOptions(vtConfig.iconUrl)
    );
    const iconStyled = await client.fetchQuery(
      iconStyledQueryOptions(iconData, vtConfig.color || "#128EE5")
    );
    return iconStyled;
  } catch (e) {
    logger.error("Failed to retrieve and style the icon", e, vtConfig.iconUrl);
    return null;
  }
}

/**
 * Embeds the given SVG content inside an SVG wrapper that is designed to work well with Cytoscape rendering.
 * @param svgContent The SVG content to embed
 * @returns SVG string
 */
function embedSvgInsideCytoscapeSvgWrapper(svgContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>
${svgContent}`;
}

/**
 * Replaces `currentColor` with the given color to make sure the SVG applies the right color in Cytoscape.
 * @param svgContent
 * @param color
 * @returns
 */
function applyCurrentColor(svgContent: string, color: string) {
  return svgContent.replace(/currentColor/gm, color);
}

function updateSize(svgContent: string): string {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();

  const doc = parser.parseFromString(svgContent, "application/xml");

  doc.documentElement.setAttribute("width", "24");
  doc.documentElement.setAttribute("height", "24");

  const result = serializer.serializeToString(doc.documentElement);

  return result;
}

function encodeSvg(svgContent: string): string {
  return "data:image/svg+xml;utf8," + encodeURIComponent(svgContent);
}
