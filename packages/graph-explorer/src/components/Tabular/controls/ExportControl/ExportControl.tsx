import type { FunctionComponent } from "react";

import { useTabularControl } from "@/components/Tabular/TabularControlsProvider";

import { ExternalExportControl } from "./ExternalExportControl";

type ExportControlProps = {
  className?: string;
};

export const ExportControl: FunctionComponent<ExportControlProps> = props => {
  const { instance } = useTabularControl();

  if (!instance) {
    console.error("ExportControl: No instance found");
    return null;
  }

  return <ExternalExportControl instance={instance} {...props} />;
};

export default ExportControl;
