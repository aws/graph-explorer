import { VertexTypeConfig } from "@/core";

export type VertexIconConfig = Pick<
  VertexTypeConfig,
  "type" | "iconUrl" | "iconImageType" | "color"
>;

export const ICONS_CACHE: Map<string, string> = new Map();

export async function renderNode(
  vtConfig: VertexIconConfig
): Promise<string | undefined> {
  if (!vtConfig.iconUrl) {
    return;
  }

  if (vtConfig.iconImageType !== "image/svg+xml") {
    return vtConfig.iconUrl;
  }

  // To avoid multiple requests, cache icons under the same URL
  const cacheKey = `${vtConfig.iconUrl}::${vtConfig.color || "#128EE5"}`;
  if (ICONS_CACHE.get(cacheKey)) {
    return ICONS_CACHE.get(cacheKey);
  }

  try {
    const response = await fetch(vtConfig.iconUrl);
    let iconText = await response.text();

    iconText = updateSize(iconText);
    iconText = embedSvgInsideCytoscapeSvgWrapper(iconText);
    iconText = applyCurrentColor(iconText, vtConfig.color || "#128EE5");
    iconText = encodeSvg(iconText);

    // Save to the cache
    ICONS_CACHE.set(cacheKey, iconText);
    return iconText;
  } catch (error) {
    // Ignore the error and move on
    console.error(
      `Failed to fetch the icon data for vertex ${vtConfig.type}`,
      error
    );
    return;
  }
}

/**
 * Embeds the given SVG content inside an SVG wrapper that is designed to work well with Cytoscape rendering.
 * @param svgContent The SVG content to embed
 * @returns SVG string
 */
function embedSvgInsideCytoscapeSvgWrapper(svgContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>
<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg">
  ${svgContent}
</svg>`;
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

  doc.documentElement.setAttribute("width", "100%");
  doc.documentElement.setAttribute("height", "100%");

  const result = serializer.serializeToString(doc.documentElement);

  return result;
}

function encodeSvg(svgContent: string): string {
  return "data:image/svg+xml;utf8," + encodeURIComponent(svgContent);
}
