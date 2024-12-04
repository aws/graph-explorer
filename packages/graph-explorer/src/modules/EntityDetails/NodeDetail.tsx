import { DisplayVertex, useWithTheme } from "@/core";
import useTranslations from "@/hooks/useTranslations";
import NeighborsList from "@/modules/common/NeighborsList/NeighborsList";
import EntityAttribute from "./EntityAttribute";
import defaultStyles from "./EntityDetail.styles";
import {
  RESERVED_ID_PROPERTY,
  RESERVED_TYPES_PROPERTY,
} from "@/utils/constants";
import { VertexRow } from "@/components";

export type VertexDetailProps = {
  node: DisplayVertex;
};

export default function NodeDetail({ node }: VertexDetailProps) {
  const t = useTranslations();
  const styleWithTheme = useWithTheme();

  return (
    <div className={styleWithTheme(defaultStyles())}>
      <VertexRow vertex={node} className="border-b p-3" />
      <NeighborsList id={node.id} />
      <div className={"properties"}>
        <div className={"title"}>Properties</div>
        <div className={"content"}>
          <EntityAttribute
            attribute={{
              name: RESERVED_ID_PROPERTY,
              displayLabel: node.isBlankNode
                ? "Blank node ID"
                : t("node-detail.node-id"),
              displayValue: node.displayId,
            }}
          />
          <EntityAttribute
            attribute={{
              name: RESERVED_TYPES_PROPERTY,
              displayLabel: t("node-detail.node-type"),
              displayValue: node.displayTypes,
            }}
          />
          {node.attributes.map(attribute => (
            <EntityAttribute key={attribute.name} attribute={attribute} />
          ))}
        </div>
      </div>
    </div>
  );
}
