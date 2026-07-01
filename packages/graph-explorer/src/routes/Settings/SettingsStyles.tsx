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
  sharedEdgeStylesAtom,
  sharedVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

import LoadStylesButton from "./LoadStylesButton";
import ResetCustomStylesButton from "./ResetCustomStylesButton";
import ResetSharedStylesButton from "./ResetSharedStylesButton";
import SaveStylesButton from "./SaveStylesButton";

export default function SettingsStyles() {
  const sharedVertexStyles = useAtomValue(sharedVertexStylesAtom);
  const sharedEdgeStyles = useAtomValue(sharedEdgeStylesAtom);

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageIcon>
          <SwatchBookIcon />
        </SettingsPageIcon>
        <SettingsPageTitle>Styles</SettingsPageTitle>
        <SettingsPageDescription>
          Share your node and edge styling with others, or reset them back to
          defaults. Custom styles and shared styles are tracked separately.
        </SettingsPageDescription>
      </SettingsPageHeader>

      <Group>
        <GroupHeader>
          <GroupTitle>Style Sharing</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            label="Save styles to share"
            description="Save your current node and edge styling to a file. Share it with others or load it on another machine to get the same look."
          >
            <SaveStylesButton />
          </LabelledSetting>
        </GroupItem>
        <GroupItem className="space-y-2">
          <LabelledSetting
            label="Load shared styles"
            description="Load styles from a file to become your new shared styles. Your custom styles are left untouched."
          >
            <LoadStylesButton />
          </LabelledSetting>
          <SharedStylesStatus
            vertexCount={sharedVertexStyles.size}
            edgeCount={sharedEdgeStyles.size}
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
            description="Clear all per-type style customizations you've made. Shared styles remain."
          >
            <ResetCustomStylesButton />
          </LabelledSetting>
        </GroupItem>
        <GroupItem>
          <LabelledSetting
            label="Reset shared styles"
            description="Remove the shared styles. Your custom styles remain."
          >
            <ResetSharedStylesButton />
          </LabelledSetting>
        </GroupItem>
      </Group>
    </SettingsPage>
  );
}

function SharedStylesStatus({
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
        {vertexCount + edgeCount === 1 ? "type has" : "types have"} shared
        styles
      </p>
    </div>
  );
}
