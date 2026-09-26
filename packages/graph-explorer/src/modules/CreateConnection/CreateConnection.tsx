import type {
  ConnectionConfig,
  NeptuneServiceType,
  QueryEngine,
} from "@shared/types";

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
import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  type ConfigurationContextProps,
  createNewConfigurationId,
  type RawConfiguration,
  schemaAtom,
} from "@/core";
import { isDirectConnection } from "@/core/StateProvider/configuration";
import useResetState from "@/core/StateProvider/useResetState";
import { formatDate, isAbsoluteHttpUrl, logger } from "@/utils";
import {
  DEFAULT_FETCH_TIMEOUT,
  DEFAULT_NODE_EXPAND_LIMIT,
} from "@/utils/constants";

type ConnectionForm = {
  name?: string;
  graphDbUrl?: string;
  directConnection: boolean;
  queryEngine?: QueryEngine;
  awsAuthEnabled?: boolean;
  serviceType?: NeptuneServiceType;
  awsRegion?: string;
  fetchTimeoutEnabled: boolean;
  fetchTimeoutMs?: number;
  nodeExpansionLimitEnabled: boolean;
  nodeExpansionLimit?: number;
};

function normalizeUrlField(value: string | undefined) {
  return value?.replace(/[\r\n]/g, "").trim();
}

function graphDbUrlError(form: ConnectionForm): string | undefined {
  const graphDbUrl = normalizeUrlField(form.graphDbUrl);
  if (!graphDbUrl) {
    return "URL is required";
  }
  // The browser resolves anything else against this page or as a scheme.
  if (form.directConnection && !isAbsoluteHttpUrl(graphDbUrl)) {
    return "A direct connection needs a full URL starting with http:// or https://";
  }
}

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
  initialValues?: Partial<ConnectionForm>;
  onClose(): void;
};

function mapToConnection(data: Required<ConnectionForm>): ConnectionConfig {
  // A direct request never reaches the Proxy Server that would sign it.
  const routing = data.directConnection
    ? { proxyConnection: false }
    : {
        awsAuthEnabled: data.awsAuthEnabled,
        serviceType: data.serviceType,
        awsRegion: data.awsRegion,
      };
  return {
    graphDbUrl: data.graphDbUrl,
    queryEngine: data.queryEngine,
    ...routing,
    fetchTimeoutMs: data.fetchTimeoutEnabled ? data.fetchTimeoutMs : undefined,
    nodeExpansionLimit: data.nodeExpansionLimitEnabled
      ? data.nodeExpansionLimit
      : undefined,
  };
}

/**
 * Whether the advanced disclosure should start open. A connection that already
 * overrides one of these settings would otherwise hide that fact behind a
 * collapsed section, so editing it looks like the defaults are in force.
 */
function hasAdvancedOverrides(form: ConnectionForm): boolean {
  return (
    form.fetchTimeoutEnabled ||
    form.nodeExpansionLimitEnabled ||
    form.directConnection
  );
}

/**
 * Maps a connection into form values under the given name. The caller picks the
 * name because only it knows the fallback: a stored connection falls back to
 * its id, and a connection that hasn't been saved has no id.
 */
export function mapToConnectionForm(
  name: string,
  connection: ConnectionConfig | undefined,
): ConnectionForm {
  return {
    ...connection,
    name,
    directConnection: connection != null && isDirectConnection(connection),
    fetchTimeoutEnabled: Boolean(connection?.fetchTimeoutMs),
    nodeExpansionLimitEnabled: Boolean(connection?.nodeExpansionLimit),
  };
}

const CreateConnection = ({
  existingConfig,
  initialValues,
  onClose,
}: CreateConnectionProps) => {
  const queryClient = useQueryClient();

  const configId = existingConfig?.id;
  const initialData = existingConfig
    ? mapToConnectionForm(
        existingConfig.displayLabel || existingConfig.id,
        existingConfig.connection,
      )
    : initialValues;

  const onSave = useAtomCallback(
    useCallback(
      (_get, set, data: Required<ConnectionForm>) => {
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

        const dbUrlChange = initialData?.graphDbUrl !== data.graphDbUrl;
        const typeChange = initialData?.queryEngine !== data.queryEngine;

        if (dbUrlChange || typeChange) {
          logger.log(
            "Clearing cached schema and previous graph session because connection to database meaningfully changed",
            { original: initialData, updated: data },
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
      [configId, initialData, queryClient],
    ),
  );

  const [form, setForm] = useState<ConnectionForm>({
    queryEngine: initialData?.queryEngine || "gremlin",
    name:
      initialData?.name ||
      `Connection (${formatDate(new Date(), "yyyy-MM-dd HH:mm")})`,
    graphDbUrl: initialData?.graphDbUrl || "",
    directConnection: initialData?.directConnection || false,
    awsAuthEnabled: initialData?.awsAuthEnabled || false,
    serviceType: initialData?.serviceType || "neptune-db",
    awsRegion: initialData?.awsRegion || "",
    fetchTimeoutEnabled: initialData?.fetchTimeoutEnabled || false,
    fetchTimeoutMs: initialData?.fetchTimeoutMs,
    nodeExpansionLimitEnabled: initialData?.nodeExpansionLimitEnabled || false,
    nodeExpansionLimit: initialData?.nodeExpansionLimit,
  });

  const [hasError, setError] = useState(false);
  const onFormChange =
    (attribute: keyof ConnectionForm) =>
    (value: number | string | string[] | boolean) => {
      if (attribute === "serviceType" && value === "neptune-graph") {
        setForm(prev => ({
          ...prev,
          [attribute]: value,
          ["queryEngine"]: "openCypher",
        }));
      } else if (
        attribute === "fetchTimeoutEnabled" &&
        typeof value === "boolean"
      ) {
        setForm(prev => ({
          ...prev,
          [attribute]: value,
          ["fetchTimeoutMs"]: value ? DEFAULT_FETCH_TIMEOUT : undefined,
        }));
      } else if (
        attribute === "nodeExpansionLimitEnabled" &&
        typeof value === "boolean"
      ) {
        setForm(prev => ({
          ...prev,
          [attribute]: value,
          ["nodeExpansionLimit"]: value ? DEFAULT_NODE_EXPAND_LIMIT : undefined,
        }));
      } else {
        setForm(prev => ({
          ...prev,
          [attribute]: value,
        }));
      }
    };

  const urlError = graphDbUrlError(form);
  const reset = useResetState();
  const onSubmit = () => {
    const normalizedForm: ConnectionForm = {
      ...form,
      graphDbUrl: normalizeUrlField(form.graphDbUrl),
    };

    if (
      !normalizedForm.name ||
      graphDbUrlError(normalizedForm) ||
      !normalizedForm.queryEngine
    ) {
      setError(true);
      return;
    }

    if (
      !normalizedForm.directConnection &&
      normalizedForm.awsAuthEnabled &&
      !normalizedForm.awsRegion
    ) {
      setError(true);
      return;
    }

    onSave(normalizedForm as Required<ConnectionForm>);
    reset();
    onClose();
  };

  return (
    <>
      <DialogBody className="gap-6">
        <FormItem>
          <Label>Name</Label>
          <InputField
            aria-label="Name"
            value={form.name}
            onChange={onFormChange("name")}
            errorMessage="Name is required"
            validationState={hasError && !form.name ? "invalid" : "valid"}
          />
        </FormItem>
        <FormItem>
          <Label>Query Language</Label>
          <SelectField
            options={CONNECTIONS_OP}
            value={form.queryEngine}
            onValueChange={onFormChange("queryEngine")}
            disabled={form.serviceType === "neptune-graph"}
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
            onChange={onFormChange("graphDbUrl")}
            errorMessage={urlError}
            placeholder="https://neptune-cluster.amazonaws.com:8182"
            validationState={hasError && urlError ? "invalid" : "valid"}
          />
        </FormItem>

        {!form.directConnection && (
          <Label className="cursor-pointer">
            <Checkbox
              value="awsAuthEnabled"
              checked={form.awsAuthEnabled}
              onCheckedChange={checked => {
                onFormChange("awsAuthEnabled")(checked);
              }}
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
                onChange={onFormChange("awsRegion")}
                errorMessage="Region is required"
                placeholder="us-east-1"
                validationState={
                  hasError && !form.awsRegion ? "invalid" : "valid"
                }
              />
            </FormItem>
            <FormItem>
              <Label>Service Type</Label>
              <SelectField
                options={[
                  { label: "Neptune DB", value: "neptune-db" },
                  { label: "Neptune Analytics", value: "neptune-graph" },
                ]}
                value={form.serviceType}
                onValueChange={onFormChange("serviceType")}
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
                  onCheckedChange={checked => {
                    onFormChange("fetchTimeoutEnabled")(checked);
                  }}
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
                  onChange={onFormChange("fetchTimeoutMs")}
                  min={0}
                />
              </FormItem>
            )}
            <FormItem>
              <Label className="cursor-pointer">
                <Checkbox
                  value="nodeExpansionLimitEnabled"
                  checked={form.nodeExpansionLimitEnabled}
                  onCheckedChange={checked => {
                    onFormChange("nodeExpansionLimitEnabled")(checked);
                  }}
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
                  onChange={onFormChange("nodeExpansionLimit")}
                  min={0}
                />
              </FormItem>
            )}
            <FormItem>
              <Label className="cursor-pointer">
                <Checkbox
                  value="directConnection"
                  checked={form.directConnection}
                  onCheckedChange={checked => {
                    onFormChange("directConnection")(checked);
                  }}
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
        <Button variant="outline" onClick={onClose}>
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
