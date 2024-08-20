import { PropsWithChildren } from "react";
import { InfoIcon } from "@/components/icons";
import Tooltip from "./Tooltip";
import { useTheme } from "@/core";

export default function InfoTooltip({ children }: PropsWithChildren) {
  const [theme] = useTheme();

  return (
    <Tooltip text={<div style={{ maxWidth: 300 }}>{children}</div>}>
      <div
        style={{
          display: "flex",
          gap: 2,
          alignItems: "center",
          justifyItems: "center",
        }}
      >
        <InfoIcon
          color={theme.theme.palette.text.secondary}
          style={{ width: 22, height: 22 }}
        />
      </div>
    </Tooltip>
  );
}
