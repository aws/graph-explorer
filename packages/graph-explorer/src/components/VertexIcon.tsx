import type { CSSProperties } from "react";

import { DynamicIcon } from "lucide-react/dynamic";
import SVG from "react-inlinesvg";

import {
  useVertexPreferences,
  type VertexPreferences,
  type VertexType,
} from "@/core";
import { cn } from "@/utils";
import { getLucideName, isValidLucideIconName } from "@/utils/lucideIcons";

import { SearchResultSymbol } from "./SearchResult";

interface Props {
  vertexStyle: VertexPreferences;
  className?: string;
  alt?: string;
}

function VertexIcon({ vertexStyle, className, alt }: Props) {
  const altText = alt ?? `${vertexStyle.displayLabel ?? vertexStyle.type} icon`;

  const lucideIconName = getLucideName(vertexStyle.iconUrl);

  if (lucideIconName) {
    if (isValidLucideIconName(lucideIconName)) {
      return (
        <DynamicIcon
          name={lucideIconName}
          className={cn("size-6 shrink-0", className)}
          style={{ color: vertexStyle.color }}
        />
      );
    } else {
      // Unknown lucide ref — don't fall through to img/SVG paths
      return null;
    }
  }

  if (vertexStyle.iconImageType === "image/svg+xml") {
    return (
      <SVG
        src={vertexStyle.iconUrl}
        className={cn("size-6 shrink-0", className)}
        style={{ color: vertexStyle.color }}
        title={altText}
      />
    );
  }

  return (
    <img
      src={vertexStyle.iconUrl}
      alt={altText}
      className={cn("size-6 shrink-0", className)}
      style={{ color: vertexStyle.color }}
    />
  );
}

export function VertexIconByType({
  vertexType,
  className,
}: {
  vertexType: VertexType;
  className?: string;
}) {
  const vertexPreferences = useVertexPreferences(vertexType);
  return <VertexIcon vertexStyle={vertexPreferences} className={className} />;
}

export function VertexSymbol({
  vertexStyle,
  className,
}: {
  vertexStyle: VertexPreferences;
  className?: string;
}) {
  return (
    <SearchResultSymbol
      className={cn("text-primary-main bg-(--bg-color)", className)}
      style={
        {
          // Defines the background color with the configured amount of transparency added
          "--bg-color": `color-mix(in srgb, ${vertexStyle.color} ${vertexStyle.backgroundOpacity * 100}%, transparent)`,
        } as CSSProperties
      }
    >
      <VertexIcon vertexStyle={vertexStyle} className="size-full" />
    </SearchResultSymbol>
  );
}

export function VertexSymbolByType({
  vertexType,
  className,
}: {
  vertexType: VertexType;
  className?: string;
}) {
  const vertexPreferences = useVertexPreferences(vertexType);
  return <VertexSymbol vertexStyle={vertexPreferences} className={className} />;
}

export default VertexIcon;
