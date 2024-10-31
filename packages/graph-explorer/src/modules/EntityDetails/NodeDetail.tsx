import difference from "lodash/difference";
import { useMemo } from "react";
import type { Vertex } from "@/types/entities";
import { useWithTheme } from "@/core";
import { useConfiguration } from "@/core/ConfigurationProvider";
import useTextTransform from "@/hooks/useTextTransform";
import useTranslations from "@/hooks/useTranslations";
import NeighborsList from "@/modules/common/NeighborsList/NeighborsList";
import EntityAttribute from "./EntityAttribute";
import defaultStyles from "./EntityDetail.styles";
import VertexHeader from "@/modules/common/VertexHeader";
import { useVertexTypeConfig } from "@/core/ConfigurationProvider/useConfiguration";
import { RESERVED_ID_PROPERTY } from "@/utils/constants";

export type VertexDetailProps = {
  hideNeighbors?: boolean;
  node: Vertex;
};

export default function NodeDetail({
  node,
  hideNeighbors = false,
}: VertexDetailProps) {
  const config = useConfiguration();
  const t = useTranslations();
  const styleWithTheme = useWithTheme();
  const textTransform = useTextTransform();

  const vertexConfig = useVertexTypeConfig(node.type);

  const sortedAttributes = useMemo(() => {
    const attributes =
      config?.getVertexTypeAttributes(node.types ?? [node.type]) || [];

    // const attributes = clone(vertexConfig?.attributes) || [];
    const unknownAttrKeys = difference(
      Object.keys(node.attributes),
      attributes.map(attr => attr.name)
    ).map(attrName => ({
      displayLabel: textTransform(attrName),
      name: attrName,
      dataType: "String",
    }));

    return [...attributes, ...unknownAttrKeys].sort((a, b) =>
      a.displayLabel.localeCompare(b.displayLabel)
    );
  }, [config, node.types, node.type, node.attributes, textTransform]);

  return (
    <div className={styleWithTheme(defaultStyles())}>
      <VertexHeader vertex={node} />
      {hideNeighbors != true && <NeighborsList vertex={node} />}
      <div className={"properties"}>
        <div className={"title"}>Properties</div>
        <div className={"content"}>
          <EntityAttribute
            value={
              config?.connection?.queryEngine === "sparql"
                ? textTransform(node.id)
                : node.id
            }
            attribute={{
              name: RESERVED_ID_PROPERTY,
              displayLabel: node.__isBlank
                ? "Blank node ID"
                : t("node-detail.node-id"),
            }}
          />
          <EntityAttribute
            value={
              vertexConfig.displayLabel ||
              (node.types ?? [node.type]).map(textTransform).join(", ")
            }
            attribute={{
              name: "types",
              displayLabel: t("node-detail.node-type"),
            }}
          />
          {sortedAttributes.map(attribute => (
            <EntityAttribute
              key={attribute.name}
              value={node.attributes[attribute.name]}
              attribute={attribute}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
