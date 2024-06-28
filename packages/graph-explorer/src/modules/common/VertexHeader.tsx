import { useMemo } from "react";
import { Vertex } from "../../@types/entities";
import { VertexIcon } from "../../components";
import { useConfiguration, fade, ThemeStyleFn, useWithTheme } from "../../core";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";
import { css } from "@emotion/css";

const defaultStyles: ThemeStyleFn = ({ theme }) => css`
  position: sticky;
  top: 0;
  z-index: 1;
  background: ${theme.palette.background.default};
  display: flex;
  padding: ${theme.spacing["4x"]};
  align-items: center;
  column-gap: ${theme.spacing["2x"]};
  border-bottom: solid 1px ${theme.palette.border};
  word-break: break-word;

  .icon {
    display: flex;
    justify-content: center;
    align-items: center;
    background: ${fade(theme.palette.primary.main, 0.2)};
    color: ${theme.palette.primary.main};
    font-size: 2em;
    border-radius: 24px;
    min-width: 36px;
    min-height: 36px;
  }

  .content {
    .title {
      font-weight: bold;
      word-break: break-word;
    }
  }
`;

export default function VertexHeader({ vertex }: { vertex: Vertex }) {
  const styleWithTheme = useWithTheme();
  const config = useConfiguration();
  const textTransform = useTextTransform();
  const displayLabels = useMemo(() => {
    return (vertex.data.types ?? [vertex.data.type])
      .map(type => {
        return (
          config?.getVertexTypeConfig(type)?.displayLabel || textTransform(type)
        );
      })
      .filter(Boolean)
      .join(", ");
  }, [config, textTransform, vertex.data.type, vertex.data.types]);
  const getDisplayNames = useDisplayNames();
  const { name } = getDisplayNames(vertex);
  const vtConfig = config?.getVertexTypeConfig(vertex.data.type);

  return (
    <div className={styleWithTheme(defaultStyles)}>
      {vtConfig?.iconUrl && (
        <div
          className={"icon"}
          style={{
            background: fade(vtConfig?.color, 0.2),
            color: vtConfig.color,
          }}
        >
          <VertexIcon
            iconUrl={vtConfig?.iconUrl}
            iconImageType={vtConfig?.iconImageType}
          />
        </div>
      )}
      <div className={"content"}>
        <div className={"title"}>{displayLabels || vertex.data.type}</div>
        <div>{name}</div>
      </div>
    </div>
  );
}
