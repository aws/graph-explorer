import { useRecoilState } from "recoil";
import { showDebugActionsAtom, showRecoilStateLoggingAtom } from "../../core";
import {
  Button,
  Checkbox,
  PageHeading,
  SectionTitle,
  Paragraph,
  SaveIcon,
  ImportantBlock,
  NotInProduction,
} from "../../components";
import { SettingsSection, SettingsSectionContainer } from "./SettingsSection";
import { saveLocalForageToFile } from "../../core/StateProvider/localDb";
import localforage from "localforage";
import LoadConfigButton from "./LoadConfigButton";
import { APP_NAME } from "../../utils/constants";

export default function SettingsGeneral() {
  const [isStateLoggingEnabled, setIsStateLoggingEnabled] = useRecoilState(
    showRecoilStateLoggingAtom
  );
  const [isDebugOptionsEnabled, setIsDebugOptionsEnabled] =
    useRecoilState(showDebugActionsAtom);

  return (
    <>
      <PageHeading>General Settings</PageHeading>

      <SettingsSectionContainer>
        <SettingsSection className="items-start">
          <SectionTitle>Save Configuration Data</SectionTitle>
          <Paragraph className="max-w-paragraph">
            You can save your current configuration to a file, including all
            connections, styles, loaded schemas, etc.
          </Paragraph>
          <Button
            icon={<SaveIcon />}
            onPress={async () => await saveLocalForageToFile(localforage)}
          >
            Save Configuration
          </Button>
        </SettingsSection>
        <SettingsSection className="items-start">
          <SectionTitle>Load Configuration Data</SectionTitle>
          <Paragraph className="max-w-paragraph">
            Restore previously saved configuration data.
          </Paragraph>
          <ImportantBlock className="max-w-paragraph mb-4">
            Loading configuration data will overwrite all of your current data
            with the data within the configuration file.
          </ImportantBlock>
          <LoadConfigButton />
        </SettingsSection>

        <NotInProduction>
          <SettingsSection>
            <div className="max-w-paragraph">
              <SectionTitle>Debug Options</SectionTitle>
              <Paragraph>
                These options are available for diagnosing issues that may come
                up while using {APP_NAME}. They can be risky to leave enabled
                full time, so we recommend leaving these disabled.
              </Paragraph>
            </div>
            <div>
              <Checkbox
                value="isStateLoggingEnabled"
                isSelected={isStateLoggingEnabled}
                onChange={isSelected => {
                  setIsStateLoggingEnabled(isSelected);
                }}
              >
                Enable Recoil state logging
              </Checkbox>
              <Checkbox
                value="isDebugOptionsEnabled"
                isSelected={isDebugOptionsEnabled}
                onChange={isSelected => {
                  setIsDebugOptionsEnabled(isSelected);
                }}
              >
                Show debug actions
              </Checkbox>
            </div>
          </SettingsSection>
        </NotInProduction>
      </SettingsSectionContainer>
    </>
  );
}
