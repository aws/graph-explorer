import { FunctionComponent } from "react";
import { useTabularControl } from "@/components/Tabular/TabularControlsProvider";
import ExternalColumnSettingsControl from "./ExternalColumnSettingsControl";

type ExportControlProps = {
  className?: string;
  omittedColumnsIds?: string[];
};

export const ColumnSettingsControl: FunctionComponent<
  ExportControlProps
> = props => {
  const { instance } = useTabularControl();

  if (!instance) {
    return null;
  }

  return <ExternalColumnSettingsControl instance={instance} {...props} />;
};

export default ColumnSettingsControl;
