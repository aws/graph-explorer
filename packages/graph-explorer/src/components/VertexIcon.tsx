import { fade, VertexTypeConfig } from "@/core";
import SVG from "react-inlinesvg";
import { cn } from "@/utils";

interface Props {
  iconUrl?: string;
  iconImageType?: string;
  className?: string;
}

function VertexIcon({ iconUrl, iconImageType, className }: Props) {
  if (!iconUrl) {
    return null;
  }

  if (iconImageType === "image/svg+xml") {
    return <SVG src={iconUrl} className={cn("size-6", className)} />;
  }

  return <img src={iconUrl} className={cn("size-6", className)} />;
}

export function VertexSymbol({
  vtConfig,
  className,
}: {
  vtConfig: VertexTypeConfig;
  className?: string;
}) {
  if (!vtConfig.iconUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        "text-primary-main bg-primary-main/20 grid size-[36px] shrink-0 place-content-center rounded-full p-2 text-[2em]",
        className
      )}
      style={{
        background: fade(vtConfig.color, 0.2),
        color: vtConfig.color,
      }}
    >
      <VertexIcon
        iconUrl={vtConfig.iconUrl}
        iconImageType={vtConfig.iconImageType}
        className="size-full"
      />
    </div>
  );
}

export default VertexIcon;
