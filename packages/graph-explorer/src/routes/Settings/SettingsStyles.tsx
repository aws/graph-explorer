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

import LoadStylesButton from "./LoadStylesButton";
import ResetStylesButton from "./ResetStylesButton";
import SaveStylesButton from "./SaveStylesButton";

export default function SettingsStyles() {
  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageIcon>
          <SwatchBookIcon />
        </SettingsPageIcon>
        <SettingsPageTitle>Styles</SettingsPageTitle>
        <SettingsPageDescription>
          Share your node and edge styles with others, or reset them back to
          defaults.
        </SettingsPageDescription>
      </SettingsPageHeader>

      <Group>
        <GroupHeader>
          <GroupTitle>Style Sharing</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            label="Save styles to share"
            description="Save your current node and edge styles to a file. Share it with others or load it on another machine to get the same look."
          >
            <SaveStylesButton />
          </LabelledSetting>
        </GroupItem>
        <GroupItem>
          <LabelledSetting
            label="Load styles"
            description="Load styles from a file. New types are added and matching ones are replaced."
          >
            <LoadStylesButton />
          </LabelledSetting>
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
            label="Reset your styles"
            description="Clear all your node and edge styles, returning everything to the defaults."
          >
            <ResetStylesButton />
          </LabelledSetting>
        </GroupItem>
      </Group>
    </SettingsPage>
  );
}
