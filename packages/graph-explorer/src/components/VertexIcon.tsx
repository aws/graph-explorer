import {
  fade,
  useVertexPreference,
  type ImmutableVertexPreference,
} from "@/core";
import SVG from "react-inlinesvg";
import { cn } from "@/utils";
import { SearchResultSymbol } from "./SearchResult";

interface Props {
  vertexStyle: ImmutableVertexPreference;
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
  const vertexPreferences = useVertexPreference(vertexType);
  return <VertexIcon vertexStyle={vertexPreferences} className={className} />;
}

export function VertexSymbol({
  vertexStyle,
  className,
}: {
  vertexStyle: ImmutableVertexPreference;
  className?: string;
}) {
  return (
    <SearchResultSymbol
      className={cn("bg-primary-main/20 text-primary-main", className)}
      style={{
        background: fade(vertexStyle.color, 0.2),
      }}
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
  const vertexPreferences = useVertexPreference(vertexType);
  return <VertexSymbol vertexStyle={vertexPreferences} className={className} />;
}

export default VertexIcon;
