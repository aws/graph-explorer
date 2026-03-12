import { useAtom, useAtomValue, useSetAtom } from "jotai";
import localforage from "localforage";
import {
  DownloadIcon,
  RotateCcwIcon,
  SaveAllIcon,
  UploadIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { toast } from "sonner";

import {
  Button,
  FileButton,
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
  defaultStylingAtom,
  showDebugActionsAtom,
  userStylingAtom,
} from "@/core";
import { saveLocalForageToFile } from "@/core/StateProvider/localDb";

import LoadConfigButton from "./LoadConfigButton";
import { useExportStylingFile } from "./useExportStylingFile";
import { useImportStylingFile } from "./useImportStylingFile";

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

  const exportStyling = useExportStylingFile();
  const importStyling = useImportStylingFile();
  const defaultStyling = useAtomValue(defaultStylingAtom);
  const setUserStyling = useSetAtom(userStylingAtom);

  const resetAllStyling = useCallback(() => {
    if (defaultStyling) {
      setUserStyling(defaultStyling);
    } else {
      setUserStyling({});
    }
    toast.success("Styling Reset", {
      description: "All styling has been reset to defaults",
    });
  }, [defaultStyling, setUserStyling]);

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

        <LabelledSetting
          label="Export styling"
          description="Export your current node and edge styling as a defaultStyling.json file. This file can be shared or Docker-mounted to provide team-wide styling defaults."
        >
          <Button className="min-w-28" onClick={exportStyling}>
            <DownloadIcon />
            Export
          </Button>
        </LabelledSetting>
        <LabelledSetting
          label="Import styling"
          description="Import a defaultStyling.json file to apply styling. This is an alternative to mounting the file in Docker."
        >
          <FileButton
            className="min-w-28"
            accept=".json"
            onChange={file => {
              if (file) {
                void importStyling(file);
              }
            }}
          >
            <UploadIcon />
            Import
          </FileButton>
        </LabelledSetting>
        <LabelledSetting
          label="Reset all styling"
          description="Reset all node and edge styling back to defaults. If a defaultStyling.json is mounted, those values will be restored. Otherwise, styling reverts to the application defaults."
        >
          <Button
            className="min-w-28"
            variant="danger"
            onClick={resetAllStyling}
          >
            <RotateCcwIcon />
            Reset
          </Button>
        </LabelledSetting>
        <ImportantBlock>
          <p>
            Importing styling will replace your current node and edge styling.
            Resetting will revert all types to their default appearance.
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
