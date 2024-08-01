import { cx } from "@emotion/css";
import type { PropsWithChildren } from "react";
import { useWithTheme } from "../../../core";
import styles from "../Workspace.styles";

import mapApiVertex from "../../../connector/gremlin/mappers/mapApiVertex";
import useEntities from "../../../hooks/useEntities";
import { useFetchNode } from "../../../hooks";
import mapApiEdge from "../../../connector/gremlin/mappers/mapApiEdge";
import { useRecoilValue } from "recoil";
import { activeConnectionSelector } from "../../../core/connector";
import mapOpenCypherVertex from "../../../connector/openCypher/mappers/mapApiVertex";
import mapOpenCypherEdge from "../../../connector/openCypher/mappers/mapApiEdge";
import { GEdge, GVertex, GPath } from "../../../connector/gremlin/types";
import type { Vertex } from "../../../@types/entities";
import type { Edge } from "../../../@types/entities";

export type WorkspaceTopBarContentProps = {
  className?: string;
};

const WorkspaceTopBarContent = ({
  className,
  children,
}: PropsWithChildren<WorkspaceTopBarContentProps>) => {
  const stylesWithTheme = useWithTheme();

  const fetchNodeData = useFetchNode();
  const [, setEntities] = useEntities();
  const activeConnection = useRecoilValue(activeConnectionSelector);

  const callFetchGremlin = async (event: any) => {
    if (event.key === "Enter") {
      const query = { query: event.target.value };
      const results: {
        vertices: Vertex[];
        edges: Edge[];
        selectNewEntities: string;
      } = {
        vertices: [],
        edges: [],
        selectNewEntities: "nodes",
      };
      const options: RequestInit = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "graph-db-connection-url": activeConnection?.graphDbUrl,
          "aws-neptune-region": activeConnection?.awsRegion,
          "service-type": activeConnection?.serviceType,
        } as HeadersInit,
        body: JSON.stringify(query),
      };
      let url = "";
      if (activeConnection?.queryEngine === "gremlin") {
        url = activeConnection?.url + "/gremlin";
      } else if (activeConnection?.queryEngine === "sparql") {
        url = activeConnection?.url + "/sparql";
      } else if (activeConnection?.queryEngine === "openCypher") {
        url = activeConnection?.url + "/openCypher";
      } else {
        window.alert("Query engine not supported");
      }
      type GremlinResponse = GVertex | GEdge | GPath;
      await fetch(url, options)
        .then(res => res.json())
        .then(data => {
          //Process raw gremlin query
          if (activeConnection?.queryEngine === "gremlin") {
            data.result.data["@value"].forEach((element: GremlinResponse) => {
              //Process nodes,edges and path queries
              if (element["@type"] === "g:Vertex") {
                results.vertices.push(mapApiVertex(element));
              } else if (element["@type"] === "g:Edge") {
                results.edges.push(mapApiEdge(element));
              } else if (element["@type"] === "g:Path") {
                element["@value"].objects["@value"].forEach(item => {
                  if (item["@type"] === "g:Vertex") {
                    results.vertices.push(mapApiVertex(item));
                  }
                  if (item["@type"] === "g:Edge") {
                    results.edges.push(mapApiEdge(item));
                  }
                });
              }
            });
          }
          //Process raw openCypherQueries
          if (activeConnection?.queryEngine === "openCypher") {
            data.results.forEach((element: GremlinResponse) => {
              if (Array.isArray(Object.values(element)[0])) {
                Object.values(element)[0].forEach((item: any) => {
                  if (item && item["~entityType"] === "node")
                    results.vertices.push(mapOpenCypherVertex(item));
                  if (item && item["~entityType"] === "relationship")
                    results.edges.push(mapOpenCypherEdge(item, "", ""));
                });
              } else {
                if (Object.keys(element).length > 1) {
                  Object.values(element).forEach(item => {
                    if (item && item["~entityType"] === "node")
                      results.vertices.push(mapOpenCypherVertex(item));
                    if (item && item["~entityType"] === "relationship")
                      results.edges.push(mapOpenCypherEdge(item, "", ""));
                  });
                } else {
                  const responseItem: any = Object.values(element)[0];
                  if (responseItem && responseItem["~entityType"] === "node") {
                    results.vertices.push(mapOpenCypherVertex(responseItem));
                  }
                  if (
                    responseItem &&
                    responseItem["~entityType"] === "relationship"
                  ) {
                    results.edges.push(mapOpenCypherEdge(responseItem, "", ""));
                  }
                }
              }
            });
          }
        })
        .catch(err => {
          // eslint-disable-next-line no-console
          console.log(err);
        });
      if (results.vertices.length) {
        fetchNodeData(results.vertices);
      }
      if (results.edges.length) {
        setEntities({
          nodes: results.vertices,
          edges: results.edges,
          selectNewEntities: "nodes",
        });
      } else return false;
    }
  };
  const shouldRenderInput =
    activeConnection?.queryEngine === "gremlin" ||
    activeConnection?.queryEngine === "openCypher";
  const AdditionalInput = shouldRenderInput && (
    <input
      type="text"
      placeholder={`Enter ${activeConnection?.queryEngine} query and press enter`}
      className={cx(
        stylesWithTheme(styles.additionalInputStyles),
        "gremlin-query-input"
      )}
      onKeyDown={callFetchGremlin}
    />
  );

  return (
    <div
      className={cx(
        stylesWithTheme(styles.topBarTitleContent),
        "top-bar-content",
        className
      )}
    >
      {children}
      {AdditionalInput}
    </div>
  );
};

WorkspaceTopBarContent.displayName = "WorkspaceTopBarContent";

export default WorkspaceTopBarContent;
