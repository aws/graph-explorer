import { useEffect, useRef } from "react";
import { Vertex } from "@/@types/entities";
import { DrawBoxWithAdornmentOptions } from "@/components/utils";
import drawBoxWithAdornment from "@/components/utils/canvas/drawBoxWithAdornment";
import type {
  AutoBoundingBox,
  BoundingBox,
} from "@/components/utils/canvas/types";
import type { CytoscapeCanvas, CytoscapeType } from "../Graph.model";
import getNodeBoundingBox from "../helpers/getNodeBoundingBox";
import getZoomLevel from "../helpers/getZoomLevel";
import { env } from "@/utils";

export type Badge = DrawBoxWithAdornmentOptions & {
  boundingBox: AutoBoundingBox;
  hidden?: boolean;
};

export type BadgeRenderer = (
  nodeData: Vertex,
  boundingBox: BoundingBox,
  options: {
    context: CanvasRenderingContext2D;
    zoomLevel: "small" | "medium" | "large";
  }
) => Array<Badge | undefined>;

export interface UseRenderBadgesProps {
  cy?: CytoscapeType;
  badgesEnabled: boolean;
  mounted: boolean;
  getNodeBadges?: BadgeRenderer;
  getGroupBadges?: BadgeRenderer;
  primaryNodeId?: string;
}

const DEFAULT_BADGE_STYLES: Omit<Badge, "boundingBox"> = {
  backgroundColor: "#4b8fe2",
  borderColor: "#ffffff",
  color: "#ffffff",
  borderWidth: 0,
  borderRadius: 2,
  paddingTop: 2,
  paddingRight: 2,
  paddingBottom: 2,
  paddingLeft: 2,
};

const renderSingleBadge = (context: CanvasRenderingContext2D, badge: Badge) => {
  if (badge.hidden) {
    return;
  }

  return drawBoxWithAdornment(context, badge.boundingBox, {
    ...DEFAULT_BADGE_STYLES,
    ...badge,
  });
};

const useRenderBadges = ({
  cy,
  badgesEnabled,
  mounted,
  getNodeBadges,
  getGroupBadges,
}: UseRenderBadgesProps) => {
  const layerRef = useRef<CytoscapeCanvas | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (cy && cy.cyCanvas) {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - zIndex is allowed
        layerRef.current = cy.cyCanvas({ zIndex: 20 });
        canvasRef.current = layerRef.current.getCanvas() ?? null;
      } catch (e) {
        if (env.DEV)
          console.error(
            "If you want to render badges you need to install the " +
              "cytoscape-canvas plugin first, see the documentation " +
              "for more information",
            e
          );
        return;
      }
    } else {
      layerRef.current = canvasRef.current = null;
    }
  }, [cy]);

  useEffect(() => {
    if (!cy) {
      return;
    }

    const container = cy.container();
    if (!container || !mounted || !getNodeBadges) {
      return;
    }
    if (layerRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const layer = layerRef.current;
      const context = canvas.getContext("2d");
      const onCanvasResize = () => {
        if (!context) {
          return;
        }
        layer.resetTransform(context);
        layer.clear(context);
        layer.setTransform(context);

        // Draw model elements
        cy.nodes().forEach(node => {
          const zoomLevel = getZoomLevel(cy);
          const nodeData = node.data() as Vertex;

          if (
            node.style("display") === "none" ||
            node.effectiveOpacity() === 0
          ) {
            return;
          }

          const nodeBoundingBox = getNodeBoundingBox(node);
          const badges = getNodeBadges(nodeData, nodeBoundingBox, {
            context,
            zoomLevel,
          });
          badges.forEach(badge => {
            if (!badge) {
              return;
            }

            renderSingleBadge(context, badge);
          });
        });
      };

      // Run once to render the initial badges and when the dependencies change
      onCanvasResize();

      // Wire up the resize event to re-render the badges
      cy.on("render", onCanvasResize);

      return () => {
        cy.off("render", onCanvasResize);
      };
    }
  }, [cy, badgesEnabled, mounted, getNodeBadges, getGroupBadges]);
};

export default useRenderBadges;
