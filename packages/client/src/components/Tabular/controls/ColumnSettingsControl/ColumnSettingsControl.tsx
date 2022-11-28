import { VFC } from "react";
import { useTabularControl } from "../../TabularControlsProvider";
import ExternalColumnSettingsControl from "./ExternalColumnSettingsControl";

type ExportControlProps = {
  classNamePrefix?: string;
  className?: string;
  omittedColumnsIds?: string[];
};

export const ColumnSettingsControl: VFC<ExportControlProps> = props => {
  const { instance } = useTabularControl();

  if (!instance) {
    return null;
  }

  return <ExternalColumnSettingsControl instance={instance} {...props} />;
};

export default ColumnSettingsControl;
