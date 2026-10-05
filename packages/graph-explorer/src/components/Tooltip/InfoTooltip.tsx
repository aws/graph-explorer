import type { PropsWithChildren } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components";
import { InfoIcon } from "@/components/icons";

export default function InfoTooltip({ children }: PropsWithChildren) {
  return (
    <Tooltip>
      <TooltipTrigger type="button">
        <InfoIcon className="text-muted-foreground size-6" />
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}
