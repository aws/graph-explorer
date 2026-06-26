import { InfoIcon } from "lucide-react";

import {
  Button,
  Group,
  GroupHeader,
  GroupItem,
  GroupTitle,
  LabelledSetting,
  NavBarLogo,
  SendIcon,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageIcon,
  SettingsPageTitle,
  SettingsPage,
} from "@/components";
import { env } from "@/utils";
import { LABELS } from "@/utils/constants";

export default function SettingsAbout() {
  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageIcon>
          <InfoIcon />
        </SettingsPageIcon>
        <SettingsPageTitle>About</SettingsPageTitle>
        <SettingsPageDescription>
          Version details and feedback form.
        </SettingsPageDescription>
      </SettingsPageHeader>

      <Group>
        <GroupItem className="flex flex-row items-center gap-6 space-y-0">
          <div className="drop-shadow-primary-foreground/20 size-15 overflow-clip rounded-2xl drop-shadow-lg">
            <NavBarLogo />
          </div>
          <div>
            <p className="text-foreground text-xl font-bold">
              {LABELS.APP_NAME}
            </p>
            <p className="text-muted-foreground font-base text-base">
              App version:{" "}
              <span className="text-foreground font-medium">
                {__GRAPH_EXP_VERSION__}
              </span>
            </p>
          </div>
        </GroupItem>
      </Group>
      <Group>
        <GroupHeader>
          <GroupTitle>Feedback</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            label="Provide Feedback"
            description={`If you have any ideas for future features for ${LABELS.APP_NAME}, or encounter an issue, please let us know.`}
          >
            <Button asChild>
              <a href={env.GRAPH_EXP_FEEDBACK_URL}>
                <SendIcon />
                Send
              </a>
            </Button>
          </LabelledSetting>
        </GroupItem>
      </Group>
    </SettingsPage>
  );
}
