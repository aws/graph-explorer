/**
 * SPIKE — throwaway. Renders the same vertex style two ways, side by side:
 *   - left: an SVG preview driven by cytoscape's own shape geometry
 *   - right: a real cytoscape instance rendering one node
 * Mounted at the top of the node style dialog so every style permutation can be
 * eyeballed against ground truth. Delete with the rest of the spike.
 */
import { useQueryClient } from "@tanstack/react-query";
import cytoscape, { type Core } from "cytoscape";
import { useEffect, useRef, useState } from "react";

import type { VertexStyle } from "@/core";

import { renderNode } from "@/modules/GraphViewer/renderNode";

import { getPolygonPoints, toSvgPoints } from "./spikeNodeShapes";

const SIZE = 96;

export function SpikeNodePreview({ style }: { style: VertexStyle }) {
  return (
    <div className="flex items-center justify-center gap-8 rounded-md border border-dashed border-gray-400 bg-gray-50 p-4">
      <PreviewCell label="SVG preview">
        <SvgNodePreview style={style} />
      </PreviewCell>
      <PreviewCell label="cytoscape (truth)">
        <CytoscapeNodePreview style={style} />
      </PreviewCell>
    </div>
  );
}

function PreviewCell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="grid place-items-center"
        style={{ width: SIZE, height: SIZE }}
      >
        {children}
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function SvgNodePreview({ style }: { style: VertexStyle }) {
  const iconDataUrl = useStyledIconDataUrl(style);
  const polygon = getPolygonPoints(style.shape);
  const strokeDash =
    style.borderStyle === "dashed"
      ? "6 4"
      : style.borderStyle === "dotted"
        ? "2 3"
        : undefined;

  const fill = style.color;
  const fillOpacity = style.backgroundOpacity;
  const stroke = style.borderWidth > 0 ? style.borderColor : "none";
  const strokeWidth = style.borderWidth;
  const clipId = `spike-clip-${style.type}`;

  // The shape element, rendered twice: once as the filled/stroked background,
  // once (fill only) as the clip path so the icon is clipped to the outline —
  // matching cytoscape's default `background-clip: 'node'`.
  const shapeEl = polygon ? (
    <polygon
      points={toSvgPoints(polygon, SIZE - strokeWidth * 2)}
      transform={`translate(${strokeWidth} ${strokeWidth})`}
    />
  ) : isRoundRectangle(style.shape) ? (
    <rect
      x={strokeWidth}
      y={strokeWidth}
      width={SIZE - strokeWidth * 2}
      height={SIZE - strokeWidth * 2}
      rx={SIZE * 0.15}
    />
  ) : (
    <ellipse
      cx={SIZE / 2}
      cy={SIZE / 2}
      rx={SIZE / 2 - strokeWidth}
      ry={SIZE / 2 - strokeWidth}
    />
  );

  return (
    <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <defs>
        <clipPath id={clipId}>{shapeEl}</clipPath>
      </defs>
      {/* Background fill + border */}
      <g
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDash}
      >
        {shapeEl}
      </g>
      {/* Icon fills the node box, clipped to the shape (as cytoscape does) */}
      {iconDataUrl ? (
        <image
          href={iconDataUrl}
          x={0}
          y={0}
          width={SIZE}
          height={SIZE}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : null}
    </svg>
  );
}

function isRoundRectangle(shape: string) {
  return (
    shape === "roundrectangle" ||
    shape === "round-rectangle" ||
    shape === "barrel" ||
    shape === "cut-rectangle"
  );
}

function CytoscapeNodePreview({ style }: { style: VertexStyle }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const iconDataUrl = useStyledIconDataUrl(style);

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      style: [],
      userZoomingEnabled: false,
      userPanningEnabled: false,
      autoungrabify: true,
    });
    cy.add({ group: "nodes", data: { id: "n", type: "Preview" } });
    cyRef.current = cy;
    return () => cy.destroy();
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.style([
      {
        selector: "node",
        style: {
          "background-image": iconDataUrl ?? undefined,
          "background-color": style.color,
          "background-opacity": style.backgroundOpacity,
          // In the graph the icon (24px) fills the node (24px). Reproduce that
          // "fill the node" ratio at this larger preview size so the cell is
          // faithful ground truth rather than a 24px icon lost on a 60px node.
          "background-width": "100%",
          "background-height": "100%",
          "border-color": style.borderColor,
          "border-width": style.borderWidth,
          "border-opacity": style.borderWidth > 0 ? 1 : 0,
          "border-style": style.borderStyle,
          shape: style.shape as never,
          width: 60,
          height: 60,
        },
      },
    ] as never);
    cy.center();
    cy.zoom(1);
    cy.center();
  }, [style, iconDataUrl]);

  return <div ref={containerRef} style={{ width: SIZE, height: SIZE }} />;
}

/** Runs the production icon pipeline (fetch → sanitize → recolor → data URL). */
function useStyledIconDataUrl(style: VertexStyle): string | null {
  const client = useQueryClient();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    renderNode(client, {
      type: style.type,
      iconUrl: style.iconUrl,
      iconImageType: style.iconImageType,
      color: style.color,
    })
      .then(result => {
        if (active) setDataUrl(result);
      })
      .catch(() => {
        if (active) setDataUrl(null);
      });
    return () => {
      active = false;
    };
  }, [client, style.iconUrl, style.iconImageType, style.color, style.type]);
  return dataUrl;
}
