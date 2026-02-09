import { useAtom } from "jotai";
import localforage from "localforage";
import { SaveAllIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import {
  Button,
  FormItem,
  ImportantBlock,
  Input,
  Label,
  LabelledSetting,
  NotInProduction,
  PageHeading,
  SettingsSection,
  SettingsSectionContainer,
  ToggleSetting,
} from "@/components";
import { addRemoveAnimationProps } from "@/components/CommonAnimationProps";
import {
  allowLoggingDbQueryAtom,
  defaultNeighborExpansionLimitAtom,
  defaultNeighborExpansionLimitEnabledAtom,
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

  const [defaultNeighborExpansionLimit, setDefaultNeighborExpansionLimit] =
    useAtom(defaultNeighborExpansionLimitAtom);

  const [
    defaultNeighborExpansionLimitEnabled,
    setDefaultNeighborExpansionLimitEnabled,
  ] = useAtom(defaultNeighborExpansionLimitEnabledAtom);

  return (
    <SettingsSectionContainer>
      <PageHeading>General Settings</PageHeading>
      <SettingsSection>
        <ToggleSetting
          label="Default limit for neighbor expansion"
          description="Applies when expanding nodes with double click or with the expand button. This value can be overridden at the connection level and in the expand sidebar."
          id="defaultNeighborExpansionLimitEnabled"
          value="defaultNeighborExpansionLimitEnabled"
          checked={defaultNeighborExpansionLimitEnabled}
          onCheckedChange={isSelected => {
            setDefaultNeighborExpansionLimitEnabled(Boolean(isSelected));
          }}
        />
        <AnimatePresence initial={false}>
          {defaultNeighborExpansionLimitEnabled ? (
            <motion.div {...addRemoveAnimationProps} key="defaultNeighborLimit">
              <FormItem>
                <Label className="text-text-primary text-base leading-none font-medium text-pretty">
                  Neighbor expansion limit
                </Label>
                <Input
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
              </FormItem>
            </motion.div>
          ) : null}
        </AnimatePresence>

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
          <p>
            This <b>will not</b> log any data returned by the database queries.
            However, the node & edge labels, ID values, and any value filters
            will be present in the queries.
          </p>
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
