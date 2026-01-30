import type { ComponentPropsWithRef } from "react";

import {
  type DisplayConfigAttribute,
  type EdgeConnection,
  type EdgeType,
  useDisplayEdgeTypeConfig,
  useDisplayVertexTypeConfig,
  useVertexPreferences,
  type VertexType,
} from "@/core";
import { ASCII, cn } from "@/utils";

/** Title text for detail sections */
export function DetailsTitle({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "text-text-primary text-base leading-tight font-bold",
        className,
      )}
      {...props}
    />
  );
}

/** Value text for detail sections */
export function DetailsValue({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "text-text-secondary gx-wrap-break-word text-base leading-tight font-medium",
        className,
      )}
      {...props}
    />
  );
}

/** List of attributes with name and data type */
export function AttributeList({
  attributes,
}: {
  attributes: DisplayConfigAttribute[];
}) {
  return (
    <ul className="space-y-2">
      {attributes.map(attr => (
        <li key={attr.name} className="grid grid-cols-2">
          <DetailsValue>{attr.displayLabel}</DetailsValue>
          <div className="text-muted-foreground bg-muted border-neutral-subtle-hover place-self-end rounded-md border px-2 py-1.5 text-right font-mono text-sm leading-none lowercase">
            {attr.dataType}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EdgeConnectionRow({
  selectedVertexType,
  edgeConnection,
  className,
  ...props
}: ComponentPropsWithRef<"div"> & {
  selectedVertexType?: VertexType;
  edgeConnection: EdgeConnection;
}) {
  return (
    <p
      className={cn("text-muted-foreground text-base/7", className)}
      {...props}
    >
      <VertexTypeText
        vertexType={edgeConnection.sourceVertexType}
        selected={selectedVertexType === edgeConnection.sourceVertexType}
      />
      <EdgeTypeText
        edgeType={edgeConnection.edgeType}
        selected={selectedVertexType == null}
      />
      <VertexTypeText
        vertexType={edgeConnection.targetVertexType}
        selected={selectedVertexType === edgeConnection.targetVertexType}
      />
    </p>
  );
}

function EdgeTypeText({
  selected,
  edgeType,
}: {
  edgeType: EdgeType;
  selected: boolean;
}) {
  const { displayLabel } = useDisplayEdgeTypeConfig(edgeType);
  return (
    <span
      className="data-selected:text-text-primary italic data-selected:font-bold"
      data-selected={selected ? true : undefined}
    >
      {`${ASCII.NBSP}${ASCII.RARR} ${displayLabel}${ASCII.NBSP}${ASCII.RARR} `}
    </span>
  );
}

function VertexTypeText({
  selected,
  vertexType,
}: {
  vertexType: VertexType;
  selected: boolean;
}) {
  const style = useVertexPreferences(vertexType);
  const { displayLabel } = useDisplayVertexTypeConfig(vertexType);

  return (
    <span
      className="data-selected:text-text-primary underline decoration-2 underline-offset-4 data-selected:font-bold"
      data-selected={selected ? true : undefined}
      style={{ textDecorationColor: style.color }}
    >
      {displayLabel}
    </span>
  );
}
