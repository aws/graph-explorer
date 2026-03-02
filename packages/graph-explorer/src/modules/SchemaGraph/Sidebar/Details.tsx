import type { ComponentPropsWithRef } from "react";

import { ListIcon } from "lucide-react";

import {
  Chip,
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  toHumanString,
} from "@/components";
import {
  type DisplayConfigAttribute,
  type EdgeConnection,
  type EdgeType,
  useDisplayEdgeTypeConfig,
  useDisplayVertexTypeConfig,
  useVertexPreferences,
  type VertexType,
} from "@/core";
import { useTranslations } from "@/hooks";
import { ASCII, cn } from "@/utils";

/** Container for a detail section with consistent vertical spacing. */
export function Details({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div className={cn("space-y-3", className)} {...props} />;
}

/** Groups a title and optional description or value with tight spacing. */
export function DetailsHeader({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return <div className={cn("space-y-1", className)} {...props} />;
}

/** Title text for detail sections */
export function DetailsTitle({
  className,
  ...props
}: ComponentPropsWithRef<"h2">) {
  return (
    <h2
      className={cn("text-foreground text-base/7 font-bold", className)}
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

/**
 * Displays a list of schema attributes with their inferred data types.
 * Shows an empty state when no attributes exist.
 */
export function PropertiesDetails({
  attributes,
}: {
  attributes: DisplayConfigAttribute[];
}) {
  const t = useTranslations();

  return (
    <Details>
      <DetailsHeader>
        <DetailsTitle className="flex gap-2">
          {t("properties")}
          <Chip variant="neutral-subtle" className="ml-auto">
            {toHumanString(attributes.length)}
          </Chip>
        </DetailsTitle>
      </DetailsHeader>
      <div>
        {attributes.length === 0 ? (
          <EmptyState className="pt-8" size="small">
            <EmptyStateIcon variant="subtle">
              <ListIcon />
            </EmptyStateIcon>
            <EmptyStateContent>
              <EmptyStateTitle>No {t("properties")}</EmptyStateTitle>
              <EmptyStateDescription>
                This item has no {t("properties").toLocaleLowerCase()}.
              </EmptyStateDescription>
            </EmptyStateContent>
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {attributes.map(attr => (
              <li
                key={attr.name}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <DetailsValue>{attr.displayLabel}</DetailsValue>
                <div className="text-muted-foreground bg-muted border-neutral-subtle-hover place-self-end rounded-md border px-2 py-1.5 text-right font-mono text-sm leading-none lowercase">
                  {attr.dataType}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Details>
  );
}

/**
 * Renders an edge connection as "SourceType → EdgeType → TargetType" with the
 * selected vertex type highlighted.
 */
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
