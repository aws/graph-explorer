import { DynamicIcon } from "lucide-react/dynamic";

import { useVertexStyle, type VertexStyle, type VertexType } from "@/core";
import {
  classifyIconSource,
  type IconSource,
  toIconImageUrl,
  useResolvedIcon,
} from "@/core/icons";
import { cn } from "@/utils";
import { isValidLucideIconName } from "@/utils/lucideIcons";

interface Props {
  vertexStyle: VertexStyle;
  className?: string;
  alt?: string;
}

function VertexIcon({ vertexStyle, className, alt }: Props) {
  const source = classifyIconSource(vertexStyle);
  const altText = alt ?? `${vertexStyle.displayLabel ?? vertexStyle.type} icon`;

  switch (source.kind) {
    case "none":
      return null;
    case "lucide":
      // An unknown name renders nothing rather than falling through to an image.
      return isValidLucideIconName(source.name) ? (
        <DynamicIcon
          name={source.name}
          className={cn("size-6 shrink-0", className)}
          style={{ color: vertexStyle.color }}
        />
      ) : null;
    case "raster":
      return <IconImage src={source.url} alt={altText} className={className} />;
    case "svg":
      return (
        <SvgIcon
          source={source}
          color={vertexStyle.color}
          alt={altText}
          className={className}
        />
      );
  }
}

/**
 * Untrusted markup is drawn as an image document, where scripts are disabled
 * and nothing outside the icon can be styled or loaded. CSS cannot reach into
 * it either, so the color is baked in.
 */
function SvgIcon({
  source,
  color,
  alt,
  className,
}: {
  source: Extract<IconSource, { kind: "svg" }>;
  color: string;
  alt: string;
  className?: string;
}) {
  const resolved = useResolvedIcon(source);

  // Holds the icon's space so a list row does not shift when the icon lands.
  if (!resolved) {
    return <span className={cn("size-6 shrink-0", className)} />;
  }
  return (
    <IconImage
      src={toIconImageUrl(resolved, color)}
      alt={alt}
      className={className}
    />
  );
}

function IconImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      className={cn("size-6 shrink-0 object-contain", className)}
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
  const vertexStyle = useVertexStyle(vertexType);
  return <VertexIcon vertexStyle={vertexStyle} className={className} />;
}

export default VertexIcon;
