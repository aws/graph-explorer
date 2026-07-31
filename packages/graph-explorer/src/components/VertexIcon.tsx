import DOMPurify from "dompurify";
import { DynamicIcon } from "lucide-react/dynamic";
import SVG from "react-inlinesvg";

import { useVertexStyle, type VertexStyle, type VertexType } from "@/core";
import { cn } from "@/utils";
import { getLucideName, isValidLucideIconName } from "@/utils/lucideIcons";

function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}

interface Props {
  vertexStyle: VertexStyle;
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
        preProcessor={sanitizeSvg}
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
  const vertexStyle = useVertexStyle(vertexType);
  return <VertexIcon vertexStyle={vertexStyle} className={className} />;
}

export default VertexIcon;
