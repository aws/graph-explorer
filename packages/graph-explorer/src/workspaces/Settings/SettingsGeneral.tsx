import { useRecoilState } from "recoil";
import {
  allowLoggingDbQueryAtom,
  showDebugActionsAtom,
  showQueryEditorAtom,
  showRecoilStateLoggingAtom,
} from "@/core";
import {
  Button,
  PageHeading,
  SectionTitle,
  Paragraph,
  SaveIcon,
  ImportantBlock,
  NotInProduction,
  Checkbox,
  Label,
} from "@/components";
import { SettingsSection, SettingsSectionContainer } from "./SettingsSection";
import { saveLocalForageToFile } from "@/core/StateProvider/localDb";
import localforage from "localforage";
import LoadConfigButton from "./LoadConfigButton";
import { APP_NAME } from "@/utils/constants";
import { ComponentPropsWithoutRef } from "react";

export default function SettingsGeneral() {
  const [isStateLoggingEnabled, setIsStateLoggingEnabled] = useRecoilState(
    showRecoilStateLoggingAtom
  );
  const [isDebugOptionsEnabled, setIsDebugOptionsEnabled] =
    useRecoilState(showDebugActionsAtom);

  const [allowLoggingDbQuery, setAllowLoggingDbQuery] = useRecoilState(
    allowLoggingDbQueryAtom
  );

  const [showQueryEditor, setShowQueryEditor] =
    useRecoilState(showQueryEditorAtom);

  return (
    <>
      <PageHeading>General Settings</PageHeading>

      <SettingsSectionContainer>
        <SettingsSection className="items-start">
          <SectionTitle>Logging</SectionTitle>
          <Paragraph className="max-w-paragraph">
            If you have encountered an issue it may be helpful to enable server
            side logging of the database queries used by Graph Explorer.
          </Paragraph>
          <ImportantBlock className="max-w-paragraph mb-4">
            This <b>will not</b> log any data returned by the database queries.
            However, the node & edge labels, ID values, and any value filters
            will be present in the queries.
          </ImportantBlock>
          <CheckboxSetting
            id="isLoggingDbQueryEnabled"
            value="isLoggingDbQueryEnabled"
            checked={allowLoggingDbQuery}
            onCheckedChange={isSelected => {
              setAllowLoggingDbQuery(Boolean(isSelected));
            }}
            label="Enable database query logging on proxy server"
            description="Logs the generated database queries to the servers logger."
          />
        </SettingsSection>

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
              <SectionTitle>Experimental</SectionTitle>
              <Paragraph>
                These options are only available in development mode since they
                are under active development.
              </Paragraph>
            </div>
            <div className="flex flex-col gap-4">
              <CheckboxSetting
                id="showQueryEditor"
                checked={showQueryEditor}
                onCheckedChange={isSelected => {
                  setShowQueryEditor(Boolean(isSelected));
                }}
                label="Show query editor"
                description="Shows the query editor UI in the search sidebar."
              />
            </div>
          </SettingsSection>
          <SettingsSection>
            <div className="max-w-paragraph">
              <SectionTitle>Debug Options</SectionTitle>
              <Paragraph>
                These options are available for diagnosing issues that may come
                up while using {APP_NAME}. They can be risky to leave enabled
                full time, so we recommend leaving these disabled.
              </Paragraph>
            </div>
            <div className="flex flex-col gap-4">
              <CheckboxSetting
                id="isStateLoggingEnabled"
                value="isStateLoggingEnabled"
                checked={isStateLoggingEnabled}
                onCheckedChange={isSelected => {
                  setIsStateLoggingEnabled(Boolean(isSelected));
                }}
                label="Enable Recoil state logging"
                description="Logs all state changes to the browser console."
              />
              <CheckboxSetting
                id="isDebugOptionsEnabled"
                value="isDebugOptionsEnabled"
                checked={isDebugOptionsEnabled}
                onCheckedChange={isSelected => {
                  setIsDebugOptionsEnabled(Boolean(isSelected));
                }}
                label="Show debug actions"
                description="Shows debug actions in various places around the app such as buttons to delete the schema or reset the last sync time."
              />
            </div>
          </SettingsSection>
        </NotInProduction>
      </SettingsSectionContainer>
    </>
  );
}

function CheckboxSetting(
  props: ComponentPropsWithoutRef<typeof Checkbox> & {
    label: string;
    description?: string;
  }
) {
  return (
    <div className="max-w-paragraph flex flex-row gap-3">
      <div className="flex h-7 items-center">
        <Checkbox {...props} />
      </div>
      <div className="flex flex-col gap-1">
        <Label
          htmlFor={props.id}
          className="text-text-primary min-h-7 text-pretty text-base"
        >
          {props.label}
        </Label>
        {props.description ? (
          <p className="text-text-secondary text-pretty text-base">
            {props.description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
