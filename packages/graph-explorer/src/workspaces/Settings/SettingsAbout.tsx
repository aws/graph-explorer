import {
  Button,
  PageHeading,
  SectionTitle,
  Paragraph,
  SendIcon,
} from "../../components";
import { env } from "../../utils";
import { APP_NAME } from "../../utils/constants";
import { SettingsSection, SettingsSectionContainer } from "./SettingsSection";

export default function SettingsAbout() {
  return (
    <>
      <PageHeading>{APP_NAME}</PageHeading>
      <SettingsSectionContainer>
        <SettingsSection>
          <Paragraph>Version: {__GRAPH_EXP_VERSION__}</Paragraph>
        </SettingsSection>
        <SettingsSection>
          <div className="max-w-paragraph">
            <SectionTitle>Feedback</SectionTitle>
            <Paragraph>
              If you have any ideas for future features for {APP_NAME}, or
              encounter an issue, please let us know.
            </Paragraph>
          </div>
          <a href={env.GRAPH_EXP_FEEDBACK_URL} className="self-start">
            <Button icon={<SendIcon />}>Provide Feedback</Button>
          </a>
        </SettingsSection>
      </SettingsSectionContainer>
    </>
  );
}
