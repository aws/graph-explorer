import { useAtom } from "jotai";
import { allowLoggingDbQueryAtom, showDebugActionsAtom } from "@/core";
import {
  Button,
  PageHeading,
  ImportantBlock,
  NotInProduction,
  SettingsSectionContainer,
  SettingsSection,
  ToggleSetting,
  LabelledSetting,
} from "@/components";
import { saveLocalForageToFile } from "@/core/StateProvider/localDb";
import localforage from "localforage";
import LoadConfigButton from "./LoadConfigButton";
import { SaveAllIcon } from "lucide-react";

export default function SettingsGeneral() {
  const [isDebugOptionsEnabled, setIsDebugOptionsEnabled] =
    useAtom(showDebugActionsAtom);

  const [allowLoggingDbQuery, setAllowLoggingDbQuery] = useAtom(
    allowLoggingDbQueryAtom
  );

  return (
    <SettingsSectionContainer>
      <PageHeading>General Settings</PageHeading>
      <SettingsSection>
        <LabelledSetting
          label="Save configuration data"
          description="You can save your current configuration to a file, including all connections, styles, loaded schemas, etc."
        >
          <Button
            icon={<SaveAllIcon />}
            className="min-w-28"
            onPress={async () => await saveLocalForageToFile(localforage)}
          >
            Save
          </Button>
        </LabelledSetting>
        <LabelledSetting
          label="Load configuration data"
          description="Restore previously saved configuration data."
        >
          <LoadConfigButton />
        </LabelledSetting>
        <ImportantBlock>
          Loading configuration data will overwrite all of your current data
          with the data within the configuration file.
        </ImportantBlock>

        <ToggleSetting
          id="isLoggingDbQueryEnabled"
          value="isLoggingDbQueryEnabled"
          checked={allowLoggingDbQuery}
          onCheckedChange={isSelected => {
            setAllowLoggingDbQuery(Boolean(isSelected));
          }}
          label="Enable database query logging on proxy server"
          description="Logs the generated database queries to the servers logger. If you have encountered an issue this might be helpful with diagnosing the root cause."
        />
        <ImportantBlock>
          This <b>will not</b> log any data returned by the database queries.
          However, the node & edge labels, ID values, and any value filters will
          be present in the queries.
        </ImportantBlock>
        <NotInProduction>
          <ToggleSetting
            id="isDebugOptionsEnabled"
            value="isDebugOptionsEnabled"
            checked={isDebugOptionsEnabled}
            onCheckedChange={isSelected => {
              setIsDebugOptionsEnabled(Boolean(isSelected));
            }}
            label="Show debug actions"
            description="Shows debug actions in various places around the app such as buttons to delete the schema or reset the last sync time."
          />
        </NotInProduction>
      </SettingsSection>
    </SettingsSectionContainer>
  );
}
