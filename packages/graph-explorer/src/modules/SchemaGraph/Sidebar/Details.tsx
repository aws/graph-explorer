import type { ComponentPropsWithRef, CSSProperties, ReactNode } from "react";

import { ListIcon } from "lucide-react";

import {
  Chip,
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  toHumanString,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components";
import {
  createEdgeConnectionId,
  type DisplayConfigAttribute,
  type EdgeConnection,
  type EdgeType,
  useDisplayEdgeTypeConfig,
  useDisplayVertexTypeConfig,
  useVertexStyle,
  type VertexType,
} from "@/core";
import { useTranslations } from "@/hooks";
import { ASCII, cn } from "@/utils";

import type { SchemaGraphSelectionItem } from "../SchemaGraph";

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
  children,
  ...props
}: ComponentPropsWithRef<"h2">) {
  return (
    <h2
      className={cn("text-foreground text-base/7 font-semibold", className)}
      {...props}
    >
      {children}
    </h2>
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
        "text-muted-foreground gx-wrap-break-word text-base leading-tight font-medium",
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
 * Decorative arrow between the parts of an edge connection. Hidden from assistive
 * technology so the type buttons keep clean accessible names.
 */
function EdgeConnectionSeparator() {
  return <span aria-hidden>{`${ASCII.NBSP}${ASCII.RARR} `}</span>;
}

/**
 * Renders an edge connection as "SourceType → EdgeType → TargetType" with the
 * selected vertex type highlighted.
 *
 * When `onSelectionChange` is provided, each vertex type and edge type becomes a
 * clickable button that invokes `onSelectionChange` with the corresponding selection
 * item, allowing the parent to update the schema graph selection.
 */
export function EdgeConnectionRow({
  selectedVertexType,
  edgeConnection,
  onSelectionChange,
  className,
  ...props
}: ComponentPropsWithRef<"div"> & {
  selectedVertexType?: VertexType;
  edgeConnection: EdgeConnection;
  onSelectionChange?: (item: SchemaGraphSelectionItem) => void;
}) {
  function selectionHandlerFor(item: SchemaGraphSelectionItem) {
    return onSelectionChange ? () => onSelectionChange(item) : undefined;
  }

  return (
    <p
      className={cn("text-muted-foreground text-base/7", className)}
      {...props}
    >
      <VertexTypeText
        vertexType={edgeConnection.sourceVertexType}
        selected={selectedVertexType === edgeConnection.sourceVertexType}
        onClick={selectionHandlerFor({
          type: "vertex-type",
          id: edgeConnection.sourceVertexType,
        })}
      />
      <EdgeConnectionSeparator />
      <EdgeTypeText
        edgeType={edgeConnection.edgeType}
        selected={selectedVertexType == null}
        onClick={selectionHandlerFor({
          type: "edge-connection",
          id: createEdgeConnectionId(edgeConnection),
        })}
      />
      <EdgeConnectionSeparator />
      <VertexTypeText
        vertexType={edgeConnection.targetVertexType}
        selected={selectedVertexType === edgeConnection.targetVertexType}
        onClick={selectionHandlerFor({
          type: "vertex-type",
          id: edgeConnection.targetVertexType,
        })}
      />
    </p>
  );
}

/**
 * Renders a type label. It becomes a tooltip-wrapped button when an `onClick` is
 * provided and the type is not already selected; the currently selected type is
 * never clickable and renders as a plain span. Decorative separators are rendered
 * by the parent as `aria-hidden` siblings, so the button text is the accessible name.
 *
 * The `data-selected` styling lives only on the span branch: a button is rendered
 * only when the type is not selected, so it never needs the selected variants.
 */
function ClickableTypeText({
  label,
  selected,
  onClick,
  className,
  style,
  children,
}: {
  label: string;
  selected: boolean;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  if (selected || !onClick) {
    return (
      <span
        className={className}
        data-selected={selected ? true : undefined}
        style={style}
      >
        {children}
      </span>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "hover:text-foreground hover:bg-primary-subtle focus-visible:ring-primary cursor-pointer bg-transparent p-0 font-[inherit] focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden",
            className,
          )}
          style={style}
          onClick={onClick}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>Change selection to {label}</TooltipContent>
    </Tooltip>
  );
}

function EdgeTypeText({
  selected,
  edgeType,
  onClick,
}: {
  edgeType: EdgeType;
  selected: boolean;
  onClick?: () => void;
}) {
  const { displayLabel } = useDisplayEdgeTypeConfig(edgeType);

  return (
    <ClickableTypeText
      label={displayLabel}
      selected={selected}
      onClick={onClick}
      className="data-selected:text-foreground italic data-selected:font-semibold"
    >
      {displayLabel}
    </ClickableTypeText>
  );
}

function VertexTypeText({
  selected,
  vertexType,
  onClick,
}: {
  vertexType: VertexType;
  selected: boolean;
  onClick?: () => void;
}) {
  const style = useVertexStyle(vertexType);
  const { displayLabel } = useDisplayVertexTypeConfig(vertexType);

  return (
    <ClickableTypeText
      label={displayLabel}
      selected={selected}
      onClick={onClick}
      className="data-selected:text-foreground underline decoration-2 underline-offset-4 data-selected:font-semibold"
      style={{ textDecorationColor: style.color }}
    >
      {displayLabel}
    </ClickableTypeText>
  );
}
