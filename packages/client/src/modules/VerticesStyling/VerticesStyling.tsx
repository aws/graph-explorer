import type { ModuleContainerHeaderProps } from "../../components";
import { ModuleContainer, ModuleContainerHeader } from "../../components";
import { VerticesStylingContent } from "./VerticesStylingContent";

export type VerticesStylingProps = Omit<
  ModuleContainerHeaderProps,
  "title" | "sidebar"
> & {
  title?: ModuleContainerHeaderProps["title"];
};

const VerticesStyling = ({
  title = "Styling",
  ...headerProps
}: VerticesStylingProps) => {
  return (
    <ModuleContainer>
      <ModuleContainerHeader
        title={title}
        variant={"sidebar"}
        {...headerProps}
      />
      <VerticesStylingContent />
    </ModuleContainer>
  );
};

export default VerticesStyling;
