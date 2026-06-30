import { useAtomValue } from "jotai";
import { SwatchBookIcon, TriangleAlertIcon } from "lucide-react";

import {
  Group,
  GroupHeader,
  GroupItem,
  GroupMedia,
  GroupTitle,
  LabelledSetting,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageIcon,
  SettingsPageTitle,
  SettingsPage,
} from "@/components";
import {
  importedEdgeStylesAtom,
  importedVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

import ExportStylesButton from "./ExportStylesButton";
import ImportStylesButton from "./ImportStylesButton";
import ResetCustomStylesButton from "./ResetCustomStylesButton";
import ResetImportedDefaultsButton from "./ResetImportedDefaultsButton";

export default function SettingsStyles() {
  const importedVertexStyles = useAtomValue(importedVertexStylesAtom);
  const importedEdgeStyles = useAtomValue(importedEdgeStylesAtom);

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageIcon>
          <SwatchBookIcon />
        </SettingsPageIcon>
        <SettingsPageTitle>Styles</SettingsPageTitle>
        <SettingsPageDescription>
          Share your node and edge styling with others, or reset them back to
          defaults. Custom styles and imported defaults are tracked separately.
        </SettingsPageDescription>
      </SettingsPageHeader>

      <Group>
        <GroupHeader>
          <GroupTitle>Style Sharing</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            label="Export styles"
            description="Save your current node and edge styling to a file. Share it with others or import it on another machine to get the same look."
          >
            <ExportStylesButton />
          </LabelledSetting>
        </GroupItem>
        <GroupItem className="space-y-2">
          <LabelledSetting
            label="Import default styles"
            description="Load styles from a file to become your new imported defaults. Your custom styles are left untouched."
          >
            <ImportStylesButton />
          </LabelledSetting>
          <ImportedStylesStatus
            vertexCount={importedVertexStyles.size}
            edgeCount={importedEdgeStyles.size}
          />
        </GroupItem>
      </Group>

      <Group variant="danger">
        <GroupHeader>
          <GroupMedia>
            <TriangleAlertIcon />
          </GroupMedia>
          <GroupTitle>Danger Zone</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            label="Reset custom styles"
            description="Clear all per-type style customizations you've made. Imported defaults remain."
          >
            <ResetCustomStylesButton />
          </LabelledSetting>
        </GroupItem>
        <GroupItem>
          <LabelledSetting
            label="Reset imported defaults"
            description="Remove the imported default styles. Your custom styles remain."
          >
            <ResetImportedDefaultsButton />
          </LabelledSetting>
        </GroupItem>
      </Group>
    </SettingsPage>
  );
}

function ImportedStylesStatus({
  vertexCount,
  edgeCount,
}: {
  vertexCount: number;
  edgeCount: number;
}) {
  if (vertexCount === 0 && edgeCount === 0) return null;

  const parts: string[] = [];
  if (vertexCount > 0) {
    parts.push(`${vertexCount} vertex`);
  }
  if (edgeCount > 0) {
    parts.push(`${edgeCount} edge`);
  }

  return (
    <div className="flex gap-2 text-sm" role="status">
      <div className="grid h-lh place-items-center">
        <span className="bg-primary-main size-2 rounded-full" />
      </div>
      <p className="text-text-secondary">
        {parts.join(" and ")}{" "}
        {vertexCount + edgeCount === 1 ? "type has" : "types have"} imported
        default styles
      </p>
    </div>
  );
}
