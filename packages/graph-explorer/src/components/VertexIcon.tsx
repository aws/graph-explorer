import { useVertexPreferences, type VertexPreferences } from "@/core";
import SVG from "react-inlinesvg";
import { cn } from "@/utils";
import { SearchResultSymbol } from "./SearchResult";
import type { CSSProperties } from "react";

interface Props {
  vertexStyle: VertexPreferences;
  className?: string;
}

function VertexIcon({ vertexStyle, className }: Props) {
  if (vertexStyle.iconImageType === "image/svg+xml") {
    return (
      <SVG
        src={vertexStyle.iconUrl}
        className={cn("size-6 shrink-0", className)}
        style={{ color: vertexStyle.color }}
      />
    );
  }

  return (
    <img
      src={vertexStyle.iconUrl}
      className={cn("size-6 shrink-0", className)}
      style={{ color: vertexStyle.color }}
    />
  );
}

export function VertexIconByType({
  vertexType,
  className,
}: {
  vertexType: string;
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
  vertexType: string;
  className?: string;
}) {
  const vertexPreferences = useVertexPreferences(vertexType);
  return <VertexSymbol vertexStyle={vertexPreferences} className={className} />;
}

export default VertexIcon;
