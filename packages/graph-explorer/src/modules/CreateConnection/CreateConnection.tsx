import type { QueryEngine } from "@shared/types";

import { useQueryClient } from "@tanstack/react-query";
import { useAtomCallback } from "jotai/utils";
import { ChevronRightIcon } from "lucide-react";
import { useCallback, useState } from "react";

import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  FormItem,
  InfoTooltip,
  InputField,
  Label,
  SelectField,
  TextAreaField,
} from "@/components";
import { DialogBody, DialogFooter } from "@/components/Dialog";
import { createNewConfigurationId, type RawConfiguration } from "@/connections";
import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  type ConfigurationContextProps,
  schemaAtom,
} from "@/core";
import useResetState from "@/core/StateProvider/useResetState";
import { logger } from "@/utils";

import {
  type ConnectionFormValues,
  createNewConnectionForm,
  hasAdvancedOverrides,
  mapToConnection,
  mapConfigurationToConnectionForm,
  queryEngineSchema,
  serviceTypeSchema,
  updateConnectionForm,
  validateConnectionForm,
} from "./connectionFormModel";

const CONNECTIONS_OP: {
  label: string;
  value: QueryEngine;
}[] = [
  { label: "Gremlin - PG (Property Graph)", value: "gremlin" },
  { label: "OpenCypher - PG (Property Graph)", value: "openCypher" },
  { label: "SPARQL - RDF (Resource Description Framework)", value: "sparql" },
];

export type CreateConnectionProps = {
  existingConfig?: ConfigurationContextProps;
  /**
   * Seeds a new connection form with prefilled, fully editable values. Unlike
   * `existingConfig`, this stays in "add" mode and does not run the
   * meaningful-change reset logic.
   */
  initialValues?: ConnectionFormValues;
  onClose(outcome: CreateConnectionOutcome): void;
};

/** Whether the form closed by saving the connection or by the user backing out. */
export type CreateConnectionOutcome = "saved" | "cancelled";

const CreateConnection = ({
  existingConfig,
  initialValues,
  onClose,
}: CreateConnectionProps) => {
  const queryClient = useQueryClient();

  const configId = existingConfig?.id;

  const onSave = useAtomCallback(
    useCallback(
      (_get, set, data: ConnectionFormValues) => {
        if (!configId) {
          const newConfigId = createNewConfigurationId();
          const newConfig: RawConfiguration = {
            id: newConfigId,
            displayLabel: data.name,
            connection: mapToConnection(data),
          };
          logger.log("Saving new connection", { newConfigId, newConfig });
          set(configurationAtom, prevConfigMap => {
            const updatedConfig = new Map(prevConfigMap);
            updatedConfig.set(newConfigId, newConfig);
            return updatedConfig;
          });
          set(activeConfigurationAtom, newConfigId);
          return;
        }

        set(configurationAtom, prev => {
          const updated = new Map(prev);
          const currentConfig = updated.get(configId);
          const updatedConfig: RawConfiguration = {
            ...currentConfig,
            id: configId,
            displayLabel: data.name,
            connection: mapToConnection(data),
          };
          logger.log("Updating existing connection", {
            configId,
            currentConfig,
            updatedConfig,
          });
          updated.set(configId, updatedConfig);
          return updated;
        });

        const original = existingConfig?.connection;
        const dbUrlChange = original?.graphDbUrl !== data.graphDbUrl;
        const typeChange = original?.queryEngine !== data.queryEngine;

        if (dbUrlChange || typeChange) {
          logger.log(
            "Clearing cached schema and previous graph session because connection to database meaningfully changed",
            { original, updated: data },
          );

          // Force a sync of the schema by deleting the existing schema cache, which is now invalid
          set(schemaAtom, prevSchemaMap => {
            const updatedSchema = new Map(prevSchemaMap);
            updatedSchema.delete(configId);
            return updatedSchema;
          });

          // Delete previous session data
          set(allGraphSessionsAtom, prev => {
            const updatedGraphs = new Map(prev);
            logger.log("Deleting previous graph session");
            updatedGraphs.delete(configId);
            return updatedGraphs;
          });

          // Reseting all query state. Using `removeQueries()` to ensure initial data is recalculated.
          // This ensures dependent queries execute in the right order
          queryClient.removeQueries();
        }
      },
      [configId, existingConfig, queryClient],
    ),
  );

  const [form, setForm] = useState<ConnectionFormValues>(() =>
    existingConfig
      ? mapConfigurationToConnectionForm(existingConfig)
      : (initialValues ?? createNewConnectionForm(new Date())),
  );
  const [showErrors, setShowErrors] = useState(false);

  const setField =
    <Field extends keyof ConnectionFormValues>(field: Field) =>
    (value: ConnectionFormValues[Field]) =>
      setForm(prev => updateConnectionForm(prev, field, value));
  // A number field reports `null` once it is cleared, despite its typing.
  const setNumberField =
    (field: "fetchTimeoutMs" | "nodeExpansionLimit") =>
    (value: number | null) =>
      setField(field)(value ?? undefined);
  const setCheckedField =
    (
      field:
        | "awsAuthEnabled"
        | "fetchTimeoutEnabled"
        | "nodeExpansionLimitEnabled"
        | "directConnection",
    ) =>
    (checked: boolean | "indeterminate") =>
      setField(field)(checked === true);

  const validation = validateConnectionForm(form);
  const errors = showErrors && !validation.valid ? validation.errors : null;

  const reset = useResetState();
  const onSubmit = () => {
    if (!validation.valid) {
      setShowErrors(true);
      return;
    }

    onSave(validation.values);
    reset();
    onClose("saved");
  };

  return (
    <>
      <DialogBody className="gap-6">
        <FormItem>
          <Label>Name</Label>
          <InputField
            aria-label="Name"
            value={form.name}
            onChange={setField("name")}
            errorMessage={errors?.name}
            validationState={errors?.name ? "invalid" : "valid"}
          />
        </FormItem>
        <FormItem>
          <Label>Query Language</Label>
          <SelectField
            aria-label="Query Language"
            options={CONNECTIONS_OP}
            value={form.queryEngine}
            onValueChange={value =>
              setField("queryEngine")(queryEngineSchema.parse(value))
            }
            disabled={
              !form.directConnection && form.serviceType === "neptune-graph"
            }
          />
        </FormItem>
        <FormItem>
          <Label>
            Database URL
            <InfoTooltip>
              Provide the endpoint URL for your graph database, e.g., an Amazon
              Neptune cluster endpoint, a Gremlin Server URL, or a SPARQL
              endpoint. Unless you connect directly from the browser, the Graph
              Explorer server connects to this endpoint, so it must be reachable
              from the host where Graph Explorer runs.
            </InfoTooltip>
          </Label>
          <TextAreaField
            aria-label="Database URL"
            data-autofocus={true}
            value={form.graphDbUrl}
            onChange={setField("graphDbUrl")}
            errorMessage={errors?.graphDbUrl}
            placeholder="https://neptune-cluster.amazonaws.com:8182"
            validationState={errors?.graphDbUrl ? "invalid" : "valid"}
          />
        </FormItem>

        {!form.directConnection && (
          <Label className="cursor-pointer">
            <Checkbox
              value="awsAuthEnabled"
              checked={form.awsAuthEnabled}
              onCheckedChange={setCheckedField("awsAuthEnabled")}
            />
            AWS IAM Auth Enabled
          </Label>
        )}
        {!form.directConnection && form.awsAuthEnabled && (
          <>
            <FormItem>
              <Label>AWS Region</Label>
              <InputField
                aria-label="AWS Region"
                data-autofocus={true}
                value={form.awsRegion}
                onChange={setField("awsRegion")}
                errorMessage={errors?.awsRegion}
                placeholder="us-east-1"
                validationState={errors?.awsRegion ? "invalid" : "valid"}
              />
            </FormItem>
            <FormItem>
              <Label>Service Type</Label>
              <SelectField
                aria-label="Service Type"
                options={[
                  { label: "Neptune DB", value: "neptune-db" },
                  { label: "Neptune Analytics", value: "neptune-graph" },
                ]}
                value={form.serviceType}
                onValueChange={value =>
                  setField("serviceType")(serviceTypeSchema.parse(value))
                }
              />
            </FormItem>
          </>
        )}
        <Collapsible
          defaultOpen={hasAdvancedOverrides(form)}
          className="group flex flex-col gap-6"
        >
          {/* Renders its own button rather than `asChild` onto a div, so the
              disclosure stays keyboard operable and announces its expanded state. */}
          <CollapsibleTrigger className="group/advanced-trigger focus-visible:ring-primary/50 text-foreground flex w-fit cursor-pointer flex-row items-center gap-2 rounded-md text-sm leading-tight font-medium focus-visible:ring-[3px] focus-visible:outline-hidden">
            <ChevronRightIcon className="text-muted-foreground size-5 shrink-0 transition-transform duration-200 ease-in-out group-data-open/advanced-trigger:rotate-90" />
            Advanced options
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-6">
            <FormItem>
              <Label className="cursor-pointer">
                <Checkbox
                  value="fetchTimeoutEnabled"
                  checked={form.fetchTimeoutEnabled}
                  onCheckedChange={setCheckedField("fetchTimeoutEnabled")}
                />
                <span className="flex items-center gap-2">
                  Enable Fetch Timeout
                  <InfoTooltip>
                    Large datasets may require a large amount of time to fetch.
                    If the timeout is exceeded, the request will be cancelled.
                  </InfoTooltip>
                </span>
              </Label>
            </FormItem>
            {form.fetchTimeoutEnabled && (
              <FormItem>
                <Label>Fetch Timeout (ms)</Label>
                <InputField
                  aria-label="Fetch Timeout (ms)"
                  type="number"
                  value={form.fetchTimeoutMs}
                  onChange={setNumberField("fetchTimeoutMs")}
                  min={0}
                />
              </FormItem>
            )}
            <FormItem>
              <Label className="cursor-pointer">
                <Checkbox
                  value="nodeExpansionLimitEnabled"
                  checked={form.nodeExpansionLimitEnabled}
                  onCheckedChange={setCheckedField("nodeExpansionLimitEnabled")}
                />
                <span className="flex items-center gap-2">
                  Override Default Neighbor Expansion Limit
                  <InfoTooltip>
                    Large datasets may require a default limit to the amount of
                    neighbors that are returned during any single expansion.
                  </InfoTooltip>
                </span>
              </Label>
            </FormItem>
            {form.nodeExpansionLimitEnabled && (
              <FormItem>
                <Label>Neighbor Expansion Limit</Label>
                <InputField
                  aria-label="Neighbor Expansion Limit"
                  type="number"
                  value={form.nodeExpansionLimit}
                  onChange={setNumberField("nodeExpansionLimit")}
                  min={0}
                />
              </FormItem>
            )}
            <FormItem>
              <Label className="cursor-pointer">
                <Checkbox
                  value="directConnection"
                  checked={form.directConnection}
                  onCheckedChange={setCheckedField("directConnection")}
                />
                <span className="flex items-center gap-2">
                  Connect directly from the browser (deprecated)
                  <InfoTooltip>
                    The browser sends requests to the database itself instead of
                    through the Graph Explorer server. The database must allow
                    cross-origin requests from this page, and IAM authentication
                    is not available. This option will be removed in a future
                    release.
                  </InfoTooltip>
                </span>
              </Label>
            </FormItem>
          </CollapsibleContent>
        </Collapsible>
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={() => onClose("cancelled")}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onSubmit}>
          {!configId ? "Add Connection" : "Update Connection"}
        </Button>
      </DialogFooter>
    </>
  );
};

export default CreateConnection;
