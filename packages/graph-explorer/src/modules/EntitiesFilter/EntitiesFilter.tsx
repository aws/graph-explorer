import type { PanelHeaderCloseButtonProps } from "@/components";
import {
  CheckboxList,
  Divider,
  Panel,
  PanelContent,
  PanelHeader,
  PanelHeaderActions,
  PanelHeaderCloseButton,
  PanelTitle,
} from "@/components";
import useTranslations from "@/hooks/useTranslations";
import useFiltersConfig from "./useFiltersConfig";
import { PropsWithChildren } from "react";

export type EntitiesFilterProps = Pick<PanelHeaderCloseButtonProps, "onClose">;

const EntitiesFilter = ({ onClose }: EntitiesFilterProps) => {
  const t = useTranslations();

  const {
    selectedVertexTypes,
    vertexTypes,
    onChangeVertexTypes,
    onChangeAllVertexTypes,
    selectedConnectionTypes,
    connectionTypes,
    onChangeConnectionTypes,
    onChangeAllConnectionTypes,
  } = useFiltersConfig();

  return (
    <Panel variant="sidebar">
      <PanelHeader>
        <PanelTitle>Entities Filter</PanelTitle>
        <PanelHeaderActions>
          <PanelHeaderCloseButton onClose={onClose} />
        </PanelHeaderActions>
      </PanelHeader>
      <PanelContent>
        {connectionTypes.length > 0 && (
          <CheckboxListContainer>
            <CheckboxList
              title={t("entities-filter.edge-types")}
              selectedIds={selectedConnectionTypes}
              checkboxes={connectionTypes}
              onChange={onChangeConnectionTypes}
              onChangeAll={onChangeAllConnectionTypes}
            />
          </CheckboxListContainer>
        )}
        <Divider />
        {vertexTypes.length > 0 && (
          <CheckboxListContainer>
            <CheckboxList
              title={t("entities-filter.node-types")}
              selectedIds={selectedVertexTypes}
              checkboxes={vertexTypes}
              onChange={onChangeVertexTypes}
              onChangeAll={onChangeAllVertexTypes}
            />
          </CheckboxListContainer>
        )}
      </PanelContent>
    </Panel>
  );
};

function CheckboxListContainer(props: PropsWithChildren) {
  return <div className="w-full px-3 py-2">{props.children}</div>;
}

export default EntitiesFilter;
