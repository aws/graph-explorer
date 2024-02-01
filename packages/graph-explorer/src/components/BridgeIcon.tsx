import RemoteSvgIcon from "./RemoteSvgIcon";

const BridgeIcon = ({
  iconUrl,
  iconImageType,
}: {
  iconUrl?: string;
  iconImageType?: string;
}) => {
  if (!iconUrl) {
    return null;
  }

  if (iconImageType === "image/svg+xml") {
    return (
      <div style={{ width: 24, height: 24, display: "flex" }}>
        <RemoteSvgIcon src={iconUrl} />
      </div>
    );
  }

  return <img width={24} height={24} src={iconUrl} />;
};

export default BridgeIcon;
