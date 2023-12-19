import { useMemo } from "react";
import { useRecoilValue } from "recoil";
import type { ModuleContainerHeaderProps } from "../../components";
import { GridIcon, ModuleContainer, ModuleContainerHeader } from "../../components";
import GraphIcon from "../../components/icons/GraphIcon";
import PanelEmptyState from "../../components/PanelEmptyState/PanelEmptyState";
import useTranslations from "../../hooks/useTranslations";
import { nodesSelectedIdsAtom } from "../../core/StateProvider/nodes";
import { edgesSelectedIdsAtom } from "../../core/StateProvider/edges";
import MultiDetailsContent from "./MultiDetailsContent";

export type MultiDetailsProp = Omit<
    ModuleContainerHeaderProps,
    "title" | "sidebar"
> & {
    title?: ModuleContainerHeaderProps["title"];
};


const MultiDetails = ({title = "Multi-Details", ...headerProps }: MultiDetailsProp) =>{
    const t = useTranslations();
    const nodesSelectedIds = useRecoilValue(nodesSelectedIdsAtom)
    const edgesSelectedIds = useRecoilValue(edgesSelectedIdsAtom)

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
        {nodesSelectedIds.size >= 1 && (
             <MultiDetailsContent vertex={""}/>
        )}
        </ModuleContainer>
    );
};

export default MultiDetails;