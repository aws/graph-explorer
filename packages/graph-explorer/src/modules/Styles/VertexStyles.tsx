import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Virtuoso } from "react-virtuoso";
import { Fragment } from "react/jsx-runtime";

import { Button, Divider, NoNodeTypesEmptyState } from "@/components";
import {
  useDisplayVertexTypeConfigs,
  useHiddenSchemaTypes,
  type VertexType,
} from "@/core";
import { cn } from "@/utils";

import { VertexStyleRow } from "./VertexStyleRow";

export type VertexStylesProps = {
  /** Shows a per-row eye toggle to hide vertex types from the Schema view. */
  showVisibilityToggle?: boolean;
};

/** Styling list for every vertex type, shown on the Nodes tab. */
export function VertexStyles({ showVisibilityToggle }: VertexStylesProps) {
  const vtConfigs = useDisplayVertexTypeConfigs().values().toArray();

  if (vtConfigs.length === 0) {
    return <NoNodeTypesEmptyState />;
  }

  return (
    <Virtuoso
      className="h-full grow"
      data={vtConfigs}
      itemContent={(index, vtConfig) => (
        <Fragment key={vtConfig.type}>
          {index !== 0 ? <Divider /> : null}
          {showVisibilityToggle ? (
            <SchemaVertexStyleRow
              vertexType={vtConfig.type}
              className="px-3 pt-2 pb-3"
            />
          ) : (
            <VertexStyleRow
              vertexType={vtConfig.type}
              className="px-3 pt-2 pb-3"
            />
          )}
        </Fragment>
      )}
    />
  );
}

/**
 * Wraps VertexStyleRow with an eye toggle that hides the vertex type from
 * the Schema view, without changing the shared row also rendered by the
 * main Graph view's Styles panel.
 */
function SchemaVertexStyleRow({
  vertexType,
  className,
}: {
  vertexType: VertexType;
  className?: string;
}) {
  const { isHidden, toggleType } = useHiddenSchemaTypes();
  const hidden = isHidden(vertexType);

  return (
    <div
      className={cn(
        "flex flex-row items-start gap-2",
        hidden && "opacity-50",
        className,
      )}
    >
      <VertexStyleRow vertexType={vertexType} className="grow" />
      <Button
        variant="ghost"
        size="icon-small"
        tooltip={
          hidden
            ? `Show ${vertexType} in schema view`
            : `Hide ${vertexType} from schema view`
        }
        onClick={() => toggleType(vertexType)}
      >
        {hidden ? <EyeOffIcon /> : <EyeIcon />}
      </Button>
    </div>
  );
}
