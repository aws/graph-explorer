import { type FunctionComponent } from "react";

import { ExternalExportControl } from "./ExternalExportControl";
import { useTabularControl } from "@/components/Tabular/TabularControlsProvider";

type ExportControlProps = {
  className?: string;
};

export const ExportControl: FunctionComponent<ExportControlProps> = props => {
  const { instance } = useTabularControl();

  if (!instance) {
    return null;
  }

  return <ExternalExportControl instance={instance} {...props} />;
};

export default ExportControl;
