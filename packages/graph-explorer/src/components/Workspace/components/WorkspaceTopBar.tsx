import { cn, groupChildrenByType } from "@/utils";
import type { PropsWithChildren, ReactElement } from "react";
import NavBarLogo from "./NavBarLogo";
import WorkspaceTopBarAdditionalControls from "./WorkspaceTopBarAdditionalControls";
import WorkspaceTopBarContent from "./WorkspaceTopBarContent";
import WorkspaceTopBarTitle from "./WorkspaceTopBarTitle";
import WorkspaceTopBarVersion from "./WorkspaceTopBarVersion";

export type WorkspaceTopBarProps = {
  className?: string;
  logoVisible?: boolean;
};

interface WorkspaceTopBarComposition {
  Title: typeof WorkspaceTopBarTitle;
  AdditionalControls: typeof WorkspaceTopBarAdditionalControls;
  Content: typeof WorkspaceTopBarContent;
  Version: typeof WorkspaceTopBarVersion;
}

const WorkspaceTopBar = ({
  className,
  children,
  logoVisible,
}: PropsWithChildren<WorkspaceTopBarProps>) => {
  const childrenByType = groupChildrenByType(
    children,
    [
      WorkspaceTopBarTitle.displayName || WorkspaceTopBarTitle.name,
      WorkspaceTopBarContent.displayName || WorkspaceTopBarContent.name,
      WorkspaceTopBarAdditionalControls.displayName ||
        WorkspaceTopBarAdditionalControls.name,
      WorkspaceTopBarVersion.displayName || WorkspaceTopBarVersion.name,
    ],
    "rest"
  );

  return (
    <div
      className={cn(
        "border-divider bg-background-default text-text-primary flex flex-col border-b",
        className
      )}
    >
      <div
        className={cn(
          "bg-background-default text-text-primary flex min-h-[3.5rem] items-center gap-3",
          logoVisible ? "pr-2" : "px-2"
        )}
      >
        {logoVisible ? <NavBarLogo /> : null}
        {
          childrenByType[
            WorkspaceTopBarTitle.displayName || WorkspaceTopBarTitle.name
          ]
        }
        {childrenByType[
          WorkspaceTopBarContent.displayName || WorkspaceTopBarContent.name
        ] ?? <div className="grow" />}
        {
          childrenByType[
            WorkspaceTopBarVersion.displayName || WorkspaceTopBarVersion.name
          ]
        }
        {
          childrenByType[
            WorkspaceTopBarAdditionalControls.displayName ||
              WorkspaceTopBarAdditionalControls.name
          ]
        }
      </div>
      {childrenByType.rest?.length > 0 ? (
        <div className="border-divider text-text-primary flex w-full items-center border-t bg-black">
          {childrenByType.rest}
        </div>
      ) : null}
    </div>
  );
};

WorkspaceTopBar.displayName = "WorkspaceTopBar";

WorkspaceTopBar.Title = WorkspaceTopBarTitle;
WorkspaceTopBar.AdditionalControls = WorkspaceTopBarAdditionalControls;
WorkspaceTopBar.Content = WorkspaceTopBarContent;
WorkspaceTopBar.Version = WorkspaceTopBarVersion;

export default WorkspaceTopBar as ((
  props: PropsWithChildren<WorkspaceTopBarProps>
) => ReactElement<any>) &
  WorkspaceTopBarComposition & { displayName: string };
