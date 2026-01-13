import type { PropsWithChildren } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components";
import { InfoIcon } from "@/components/icons";

export default function InfoTooltip({ children }: PropsWithChildren) {
  return (
    <Tooltip>
      <TooltipTrigger>
        <InfoIcon className="text-text-secondary size-6" />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}
