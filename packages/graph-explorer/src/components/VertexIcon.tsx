import { DisplayVertexStyle, fade } from "@/core";
import SVG from "react-inlinesvg";
import { cn } from "@/utils";

interface Props {
  vertexStyle: DisplayVertexStyle;
  className?: string;
}

function VertexIcon({ vertexStyle, className }: Props) {
  if (vertexStyle.iconImageType === "image/svg+xml") {
    return (
      <SVG src={vertexStyle.iconUrl} className={cn("size-6", className)} />
    );
  }

  return <img src={vertexStyle.iconUrl} className={cn("size-6", className)} />;
}

export function VertexSymbol({
  vertexStyle,
  className,
}: {
  vertexStyle: DisplayVertexStyle;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "text-primary-main bg-primary-main/20 grid size-[36px] shrink-0 place-content-center rounded-full p-2 text-[2em]",
        className
      )}
      style={{
        background: fade(vertexStyle.color, 0.2),
        color: vertexStyle.color,
      }}
    >
      <VertexIcon vertexStyle={vertexStyle} className="size-full" />
    </div>
  );
}

export default VertexIcon;
