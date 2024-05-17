import difference from "lodash/difference";
import { useMemo } from "react";
import type { Vertex } from "../../@types/entities";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { useConfiguration } from "../../core/ConfigurationProvider";
import useTextTransform from "../../hooks/useTextTransform";
import useTranslations from "../../hooks/useTranslations";
import NeighborsList from "../common/NeighborsList/NeighborsList";
import EntityAttribute from "./EntityAttribute";
import defaultStyles from "./EntityDetail.styles";
import VertexHeader from "../common/VertexHeader";

export type VertexDetailProps = {
  classNamePrefix?: string;
  hideNeighbors?: boolean;
  node: Vertex;
};

export default function NodeDetail({
  classNamePrefix = "ft",
  node,
  hideNeighbors = false,
}: VertexDetailProps) {
  const config = useConfiguration();
  const t = useTranslations();
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const textTransform = useTextTransform();

  const vertexConfig = useMemo(() => {
    return config?.getVertexTypeConfig(node.data.type);
  }, [config, node.data.type]);

  const sortedAttributes = useMemo(() => {
    const attributes =
      config?.getVertexTypeAttributes(node.data.types ?? [node.data.type]) ||
      [];

    // const attributes = clone(vertexConfig?.attributes) || [];
    const unknownAttrKeys = difference(
      Object.keys(node.data.attributes),
      attributes.map(attr => attr.name)
    ).map(attrName => ({
      displayLabel: textTransform(attrName),
      name: attrName,
      dataType: "String",
    }));

    return [...attributes, ...unknownAttrKeys].sort((a, b) =>
      a.displayLabel.localeCompare(b.displayLabel)
    );
  }, [
    config,
    node.data.types,
    node.data.type,
    node.data.attributes,
    textTransform,
  ]);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <VertexHeader vertex={node} classNamePrefix={classNamePrefix} />
      {hideNeighbors != true && (
        <NeighborsList vertex={node} classNamePrefix={classNamePrefix} />
      )}
      <div className={pfx("properties")}>
        <div className={pfx("title")}>Properties</div>
        <div className={pfx("content")}>
          <EntityAttribute
            value={
              config?.connection?.queryEngine === "sparql"
                ? textTransform(node.data.id)
                : node.data.id
            }
            attribute={{
              name: "id",
              displayLabel: node.data.__isBlank
                ? "Blank node ID"
                : t("node-detail.node-id"),
            }}
            classNamePrefix={classNamePrefix}
          />
          <EntityAttribute
            value={
              vertexConfig?.displayLabel ||
              (node.data.types ?? [node.data.type])
                .map(textTransform)
                .join(", ")
            }
            attribute={{
              name: "types",
              displayLabel: t("node-detail.node-type"),
            }}
            classNamePrefix={classNamePrefix}
          />
          {sortedAttributes.map(attribute => (
            <EntityAttribute
              key={attribute.name}
              value={node.data.attributes[attribute.name]}
              attribute={attribute}
              classNamePrefix={classNamePrefix}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
