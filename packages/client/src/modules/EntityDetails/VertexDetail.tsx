import difference from "lodash/difference";
import { useMemo } from "react";
import type { Vertex } from "../../@types/entities";
import { VertexIcon } from "../../components";
import Chip from "../../components/Chip";
import { useWithTheme, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import fade from "../../core/ThemeProvider/utils/fade";
import useDisplayNames from "../../hooks/useDisplayNames";
import useTextTransform from "../../hooks/useTextTransform";
import labelsByEngine from "../../utils/labelsByEngine";
import defaultStyles from "./EntityDetail.styles";
import EntityAttribute from "./internalComponents/EntityAttribute";

export type VertexDetailProps = {
  classNamePrefix?: string;
  enableDisplayAs?: boolean;
  disableConnections?: boolean;
  vertex: Vertex;
};

const VertexDetail = ({
  classNamePrefix = "ft",
  enableDisplayAs = false,
  vertex,
  disableConnections = false,
}: VertexDetailProps) => {
  const config = useConfiguration();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const textTransform = useTextTransform();

  const labels = labelsByEngine[config?.connection?.queryEngine || "gremlin"];
  const vertexConfig = useMemo(() => {
    return config?.getVertexTypeConfig(vertex.data.__v_type);
  }, [config, vertex.data.__v_type]);

  const sortedAttributes = useMemo(() => {
    const attributes =
      config?.getVertexTypeAttributes(vertex.data.__v_types) || [];

    // const attributes = clone(vertexConfig?.attributes) || [];
    const unknownAttrKeys = difference(
      Object.keys(vertex.data.attributes),
      attributes.map(attr => attr.name)
    ).map(attrName => ({
      displayLabel: textTransform(attrName),
      name: attrName,
      dataType: "String",
    }));

    return [...attributes, ...unknownAttrKeys].sort((a, b) =>
      a.displayLabel.localeCompare(b.displayLabel)
    );
  }, [config, textTransform, vertex.data.__v_types, vertex.data.attributes]);

  const displayLabels = useMemo(() => {
    return vertex.data.__v_types
      .map(type => {
        const vtConfig = config?.getVertexTypeConfig(type);
        return vtConfig?.displayLabel || textTransform(vtConfig?.type);
      })
      .filter(Boolean)
      .join(", ");
  }, [config, textTransform, vertex.data.__v_types]);

  const getDisplayNames = useDisplayNames();
  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <div className={pfx("header")}>
        {vertexConfig?.iconUrl && (
          <div
            className={pfx("icon")}
            style={{
              background: fade(vertexConfig.color, 0.2),
              color: vertexConfig.color,
            }}
          >
            <VertexIcon
              iconUrl={vertexConfig?.iconUrl}
              iconImageType={vertexConfig?.iconImageType}
            />
          </div>
        )}
        <div className={pfx("content")}>
          <div className={pfx("title")}>
            {displayLabels || vertex.data.__v_type}
          </div>
          <div>{getDisplayNames(vertex).name}</div>
        </div>
      </div>
      {disableConnections != true && (
        <div className={pfx("connections")}>
          <div className={pfx("title")}>
            Neighbors{" "}
            <Chip className={pfx("chip")}>
              {vertex.data.__totalNeighborCount}
            </Chip>
          </div>
          <div className={pfx("content")}>
            <div className={pfx("item")}>
              Outgoing: <span>{vertex.data.__fetchedOutEdgeCount}</span>
            </div>
            <div className={pfx("item")}>
              Incoming: <span>{vertex.data.__fetchedInEdgeCount}</span>
            </div>
          </div>
        </div>
      )}
      <div className={pfx("properties")}>
        <div className={pfx("title")}>Properties</div>
        <div className={pfx("content")}>
          <EntityAttribute
            vertex={vertex}
            value={
              config?.connection?.queryEngine === "sparql"
                ? textTransform(vertex.data.__v_id)
                : vertex.data.__v_id
            }
            enableDisplayAs={enableDisplayAs}
            attribute={{
              name: "__v_id",
              displayLabel: labels["node-id"],
            }}
            classNamePrefix={classNamePrefix}
          />
          <EntityAttribute
            vertex={vertex}
            value={
              vertexConfig?.displayLabel ||
              vertex.data.__v_types.map(textTransform).join(", ")
            }
            enableDisplayAs={enableDisplayAs}
            attribute={{
              name: "__v_types",
              displayLabel: labels["node-type"],
            }}
            classNamePrefix={classNamePrefix}
          />
          {sortedAttributes.map(attribute => (
            <EntityAttribute
              key={attribute.name}
              vertex={vertex}
              value={vertex.data.attributes[attribute.name]}
              enableDisplayAs={enableDisplayAs}
              attribute={attribute}
              classNamePrefix={classNamePrefix}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default VertexDetail;
