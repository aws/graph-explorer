import { type PropsWithChildren } from "react";
import { InfoIcon } from "@/components/icons";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components";

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
