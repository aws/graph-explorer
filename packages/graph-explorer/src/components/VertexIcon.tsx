import { fade, VertexTypeConfig } from "@/core";
import RemoteSvgIcon from "./RemoteSvgIcon";
import { cn } from "@/utils";

const VertexIcon = ({
  iconUrl,
  iconImageType,
  className,
}: {
  iconUrl?: string;
  iconImageType?: string;
  className?: string;
}) => {
  if (!iconUrl) {
    return null;
  }

  if (iconImageType === "image/svg+xml") {
    return <RemoteSvgIcon src={iconUrl} className={cn("size-6", className)} />;
  }

  return <img src={iconUrl} className={cn("size-6", className)} />;
};

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
