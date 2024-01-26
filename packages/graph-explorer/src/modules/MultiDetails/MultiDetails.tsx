import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import type { ModuleContainerHeaderProps } from "../../components";
import { GridIcon, ModuleContainer, ModuleContainerHeader } from "../../components";
import GraphIcon from "../../components/icons/GraphIcon";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import useTranslations from "../../hooks/useTranslations";
import { 
    nodesAtom,
    nodesSelectedIdsAtom, 
} from "../../core/StateProvider/nodes";
import {
    edgesAtom,
    edgesSelectedIdsAtom,
    edgesTypesFilteredAtom,
  } from "../../core/StateProvider/edges";
import { overDateAtom, overDateFlagAtom } from "../../core/StateProvider/overdate";
import MultiDetailsContent from "./MultiDetailsContent";

export type MultiDetailsProp = Omit<
    ModuleContainerHeaderProps,
    "title" | "sidebar"
> & {
    title?: ModuleContainerHeaderProps["title"];
};


const MultiDetails = ({title = "Multi-Details", ...headerProps }: MultiDetailsProp) =>{
    const t = useTranslations();
    const nodes = useRecoilValue(nodesAtom);
    const nodesSelectedIds = useRecoilValue(nodesSelectedIdsAtom)
    const edgesSelectedIds = useRecoilValue(edgesSelectedIdsAtom)

    const selectedNode = useMemo(() => {
        return nodes.find(node => nodesSelectedIds.has(node.data.id));
      }, [nodes, nodesSelectedIds]);
    
    const selectedItems = new Set<string>(['test']);
    const odFlag = useRecoilValue(overDateFlagAtom);
    const overDate = useRecoilValue(overDateAtom);

    return (
        <ModuleContainer>
            <ModuleContainerHeader
            title={title}
            variant={"sidebar"}
            {...headerProps}
        />
        {nodesSelectedIds.size === 0 && edgesSelectedIds.size === 0 && (
            <PanelEmptyState
                icon={<GridIcon />}
                title={t("multi-details.no-selection-title")}
                subtitle={t("multi-details.no-selection-subtitle")}
            />
        )}
        {nodesSelectedIds.size >= 1 && selectedItems && selectedNode && (
            <MultiDetailsContent 
            graphItems={selectedItems}
            vertex={selectedNode}
            odFlag={odFlag}
            overDate={overDate}/>
        )}
        </ModuleContainer>
    );
};

export default MultiDetails;