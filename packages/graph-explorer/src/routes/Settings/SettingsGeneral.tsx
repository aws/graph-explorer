import { useAtom } from "jotai";
import localforage from "localforage";
import { CogIcon, SaveAllIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
  Button,
  Group,
  GroupHeader,
  GroupItem,
  GroupTitle,
  ImportantBlock,
  Input,
  LabelledSetting,
  NotInProduction,
  SettingsPageDescription,
  SettingsPageHeader,
  SettingsPageIcon,
  SettingsPageTitle,
  SettingsPage,
  Switch,
} from "@/components";
import { addRemoveAnimationProps } from "@/components/CommonAnimationProps";
import {
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
  diagnosticLoggingAtom,
  showDebugActionsAtom,
} from "@/core";
import { saveLocalForageToFile } from "@/core/StateProvider/localDb";

import LoadConfigButton from "./LoadConfigButton";

export default function SettingsGeneral() {
  const [isDebugOptionsEnabled, setIsDebugOptionsEnabled] =
    useAtom(showDebugActionsAtom);

  const [allowLoggingDbQuery, setAllowLoggingDbQuery] = useAtom(
    allowLoggingDbQueryAtom,
  );

  const [diagnosticLogging, setDiagnosticLogging] = useAtom(
    diagnosticLoggingAtom,
  );

  const [defaultNeighborExpansionLimit, setDefaultNeighborExpansionLimit] =
    useAtom(defaultNeighborExpansionLimitAtom);

  const [
    defaultNeighborExpansionLimitEnabled,
    setDefaultNeighborExpansionLimitEnabled,
  ] = useAtom(defaultNeighborExpansionLimitEnabledAtom);

  return (
    <SettingsPage>
      <SettingsPageHeader>
        <SettingsPageIcon>
          <CogIcon />
        </SettingsPageIcon>
        <SettingsPageTitle>General Settings</SettingsPageTitle>
        <SettingsPageDescription>
          Control how the canvas behaves, manage your configuration data, and
          configure diagnostic settings.
        </SettingsPageDescription>
      </SettingsPageHeader>

      <Group>
        <GroupHeader>
          <GroupTitle>Canvas Behavior</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            htmlFor="defaultNeighborExpansionLimitEnabled"
            label="Default limit for neighbor expansion"
            description="Applies when expanding nodes with double click or with the expand button. This value can be overridden at the connection level and in the expand sidebar."
          >
            <Switch
              id="defaultNeighborExpansionLimitEnabled"
              value="defaultNeighborExpansionLimitEnabled"
              checked={defaultNeighborExpansionLimitEnabled}
              onCheckedChange={isSelected => {
                setDefaultNeighborExpansionLimitEnabled(Boolean(isSelected));
              }}
            />
          </LabelledSetting>
        </GroupItem>

        <AnimatePresence initial={false}>
          {defaultNeighborExpansionLimitEnabled ? (
            <motion.div {...addRemoveAnimationProps} key="defaultNeighborLimit">
              <GroupItem className="bg-neutral-subtle/50">
                <LabelledSetting
                  htmlFor="defaultNeighborExpansionLimit"
                  label="Neighbor expansion limit"
                  description="Maximum number of neighbors to expand per expansion."
                >
                  <Input
                    id="defaultNeighborExpansionLimit"
                    aria-label="Default neighbor expansion limit"
                    className="max-w-64"
                    type="number"
                    value={defaultNeighborExpansionLimit}
                    onChange={e =>
                      setDefaultNeighborExpansionLimit(
                        parseInt(e.target.value) ?? 0,
                      )
                    }
                    min={0}
                  />
                </LabelledSetting>
              </GroupItem>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </Group>

      <Group>
        <GroupHeader>
          <GroupTitle>Manage Configuration Data</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            label="Save configuration data"
            description="You can save your current configuration to a file, including all connections, styles, loaded schemas, etc."
          >
            <Button
              className="min-w-28"
              onClick={async () => await saveLocalForageToFile(localforage)}
            >
              <SaveAllIcon />
              Save
            </Button>
          </LabelledSetting>
        </GroupItem>
        <GroupItem>
          <LabelledSetting
            label="Load configuration data"
            description="Restore previously saved configuration data."
          >
            <LoadConfigButton />
          </LabelledSetting>
          <ImportantBlock>
            <p>
              Loading configuration data will overwrite all of your current data
              with the data within the configuration file.
            </p>
          </ImportantBlock>
        </GroupItem>
      </Group>

      <Group>
        <GroupHeader>
          <GroupTitle>Diagnostics</GroupTitle>
        </GroupHeader>
        <GroupItem>
          <LabelledSetting
            htmlFor="isDiagnosticLoggingEnabled"
            label="Diagnostic logging"
            description="Enables verbose logging to the browser console for troubleshooting."
          >
            <Switch
              id="isDiagnosticLoggingEnabled"
              value="isDiagnosticLoggingEnabled"
              checked={diagnosticLogging}
              onCheckedChange={isSelected => {
                setDiagnosticLogging(Boolean(isSelected));
              }}
            />
          </LabelledSetting>
        </GroupItem>
        <GroupItem>
          <LabelledSetting
            htmlFor="isLoggingDbQueryEnabled"
            label="Enable database query logging on proxy server"
            description="Logs the generated database queries to the servers logger. If you have encountered an issue this might be helpful with diagnosing the root cause."
          >
            <Switch
              id="isLoggingDbQueryEnabled"
              value="isLoggingDbQueryEnabled"
              checked={allowLoggingDbQuery}
              onCheckedChange={isSelected => {
                setAllowLoggingDbQuery(Boolean(isSelected));
              }}
            />
          </LabelledSetting>
          <ImportantBlock>
            <p>
              This <b>will not</b> log any data returned by the database
              queries. However, the node & edge labels, ID values, and any value
              filters will be present in the queries.
            </p>
          </ImportantBlock>
        </GroupItem>

        <NotInProduction>
          <GroupItem>
            <LabelledSetting
              htmlFor="isDebugOptionsEnabled"
              label="Show debug actions"
              description="Shows debug actions in various places around the app such as buttons to delete the schema or reset the last sync time."
            >
              <Switch
                id="isDebugOptionsEnabled"
                value="isDebugOptionsEnabled"
                checked={isDebugOptionsEnabled}
                onCheckedChange={isSelected => {
                  setIsDebugOptionsEnabled(Boolean(isSelected));
                }}
              />
            </LabelledSetting>
          </GroupItem>
        </NotInProduction>
      </Group>
    </SettingsPage>
  );
}
