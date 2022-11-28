import { useRecoilValue } from "recoil";
import { useWithTheme, withClassNamePrefix } from "../../core";
import { edgesSelectedIdsAtom } from "../../core/StateProvider/edges";
import { nodesSelectedIdsAtom } from "../../core/StateProvider/nodes";
import { userLayoutAtom } from "../../core/StateProvider/userPreferences";
import EntityDetails from "../EntityDetails";
import GraphViewer from "../GraphViewer";
import defaultStyles from "./GraphViewerWithDetails.styles";

export type GraphViewerWithDetailsProps = {
  onNodeCustomize(nodeType?: string): void;
  onEdgeCustomize(edgeType?: string): void;
};

const GraphViewerWithDetails = ({
  onNodeCustomize,
  onEdgeCustomize,
}: GraphViewerWithDetailsProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix();
  const userLayout = useRecoilValue(userLayoutAtom);
  const nodesSelectedIds = useRecoilValue(nodesSelectedIdsAtom);
  const edgesSelectedIds = useRecoilValue(edgesSelectedIdsAtom);

  const nodeOrEdgeSelected =
    nodesSelectedIds.size + edgesSelectedIds.size === 1;

  return (
    <div
      className={styleWithTheme(defaultStyles("ft"))}
      style={{ position: "relative", height: "100%", width: "100%" }}
    >
      <GraphViewer
        onNodeCustomize={onNodeCustomize}
        onEdgeCustomize={onEdgeCustomize}
      />
      {userLayout.activeSidebarItem !== "details" && nodeOrEdgeSelected && (
        <div className={pfx("details-overlay")}>
          <EntityDetails noHeader={true} disableConnections={true} />
        </div>
      )}
    </div>
  );
};

export default GraphViewerWithDetails;
