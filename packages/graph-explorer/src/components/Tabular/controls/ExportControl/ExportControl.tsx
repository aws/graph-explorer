import { FunctionComponent } from "react";

import { useTabularControl } from "../../TabularControlsProvider";
import { ExternalExportControl } from "./ExternalExportControl";

type ExportControlProps = {
  classNamePrefix?: string;
  className?: string;
  omittedColumnsIds?: string[];
};

export const ExportControl: FunctionComponent<ExportControlProps> = props => {
  const { instance } = useTabularControl();

  if (!instance) {
    return null;
  }

  return <ExternalExportControl instance={instance} {...props} />;
};

export default ExportControl;
