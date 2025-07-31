import {
  PageHeading,
  SendIcon,
  SettingsSection,
  SettingsSectionContainer,
  buttonStyles,
  LabelledSetting,
} from "@/components";
import { env } from "@/utils";
import { APP_NAME } from "@/utils/constants";

export default function SettingsAbout() {
  return (
    <SettingsSectionContainer>
      <PageHeading>{APP_NAME}</PageHeading>
      <SettingsSection>
        <LabelledSetting
          label="App version"
          description={__GRAPH_EXP_VERSION__}
        />
        <LabelledSetting
          label="Provide Feedback"
          description={`If you have any ideas for future features for ${APP_NAME}, or encounter an issue, please let us know.`}
        >
          <a
            href={env.GRAPH_EXP_FEEDBACK_URL}
            className={buttonStyles({ variant: "default" })}
          >
            <SendIcon />
            Send
          </a>
        </LabelledSetting>
      </SettingsSection>
    </SettingsSectionContainer>
  );
}
