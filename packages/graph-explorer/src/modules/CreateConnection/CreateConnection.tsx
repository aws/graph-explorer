import type {
  ConnectionConfig,
  EdgeConnectionDiscovery,
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
  Field,
  FieldContent,
  FieldDescription,
  FieldLegend,
  FieldLabel,
  FieldSet,
  FieldTitle,
  FormItem,
  InfoTooltip,
  InputField,
  Label,
  RadioGroup,
  RadioGroupItem,
  SelectField,
  TextAreaField,
} from "@/components";
import { DialogBody, DialogFooter } from "@/components/Dialog";
import { edgeConnectionsQueryKeyPrefix } from "@/connector";
import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  type ConfigurationContextProps,
  createNewConfigurationId,
  discardEdgeConnectionsAtom,
  type RawConfiguration,
  schemaAtom,
} from "@/core";
import useResetState from "@/core/StateProvider/useResetState";
import { formatDate, logger } from "@/utils";
import {
  DEFAULT_FETCH_TIMEOUT,
  DEFAULT_SAMPLE_SIZE,
  DEFAULT_NODE_EXPAND_LIMIT,
} from "@/utils/constants";

type ConnectionForm = {
  name?: string;
  url?: string;
  queryEngine?: QueryEngine;
  proxyConnection?: boolean;
  graphDbUrl?: string;
  awsAuthEnabled?: boolean;
  serviceType?: NeptuneServiceType;
  awsRegion?: string;
  fetchTimeoutEnabled: boolean;
  fetchTimeoutMs?: number;
  nodeExpansionLimitEnabled: boolean;
  nodeExpansionLimit?: number;
  edgeConnectionDiscovery: EdgeConnectionDiscovery;
};

const DISCOVERY_LEGEND_ID = "edge-connection-discovery-legend";

/**
 * The discovery choices, with the consequence of each spelled out. A label alone
 * does not tell anyone that sampled can miss a connection, or that complete can
 * fail on a large graph, which is the whole basis for choosing.
 */
const EDGE_CONNECTION_DISCOVERY_OPTIONS: {
  value: EdgeConnectionDiscovery;
  label: string;
  description: string;
}[] = [
  {
    value: "auto",
    label: "Automatic",
    description:
      "Chooses based on how many edge types the graph has and how large it is. Recommended.",
  },
  {
    value: "complete",
    label: "Complete",
    description:
      "Scans every edge to find all edge connections. Can be slow, or fail, on very large graphs.",
  },
  {
    value: "sampled",
    label: "Sampled",
    description: `Checks up to ${DEFAULT_SAMPLE_SIZE.toLocaleString()} edges per edge type. Fast and predictable on very large graphs. Will miss edge connections that occur rarely.`,
  },
];

function normalizeUrlField(value: string | undefined) {
  return value?.replace(/[\r\n]/g, "").trim();
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
  return {
    url: data.url,
    queryEngine: data.queryEngine,
    proxyConnection: data.proxyConnection,
    graphDbUrl: data.graphDbUrl,
    awsAuthEnabled: data.awsAuthEnabled,
    serviceType: data.serviceType,
    awsRegion: data.awsRegion,
    fetchTimeoutMs: data.fetchTimeoutEnabled ? data.fetchTimeoutMs : undefined,
    nodeExpansionLimit: data.nodeExpansionLimitEnabled
      ? data.nodeExpansionLimit
      : undefined,
    // Always written, `auto` included, so a missing value only ever means the
    // connection was saved before this setting existed.
    edgeConnectionDiscovery: data.edgeConnectionDiscovery,
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
    form.edgeConnectionDiscovery !== "auto"
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
    fetchTimeoutEnabled: Boolean(connection?.fetchTimeoutMs),
    nodeExpansionLimitEnabled: Boolean(connection?.nodeExpansionLimit),
    edgeConnectionDiscovery: connection?.edgeConnectionDiscovery ?? "auto",
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

        const urlChange = initialData?.url !== data.url;
        const dbUrlChange = initialData?.graphDbUrl !== data.graphDbUrl;
        const typeChange = initialData?.queryEngine !== data.queryEngine;
        const discoveryChange =
          initialData?.edgeConnectionDiscovery !== data.edgeConnectionDiscovery;

        if (urlChange || dbUrlChange || typeChange) {
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
        } else if (discoveryChange) {
          logger.log(
            "Discarding discovered edge connections because the discovery setting changed",
            { original: initialData, updated: data },
          );

          // The stored edge connections are the real cache: they seed the query
          // as initial data, so the query only reruns once they are gone.
          set(discardEdgeConnectionsAtom, configId);
          queryClient.removeQueries({
            queryKey: edgeConnectionsQueryKeyPrefix,
          });
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
    url: initialData?.url || "",
    proxyConnection: initialData?.proxyConnection || false,
    graphDbUrl: initialData?.graphDbUrl || "",
    awsAuthEnabled: initialData?.awsAuthEnabled || false,
    serviceType: initialData?.serviceType || "neptune-db",
    awsRegion: initialData?.awsRegion || "",
    fetchTimeoutEnabled: initialData?.fetchTimeoutEnabled || false,
    fetchTimeoutMs: initialData?.fetchTimeoutMs,
    nodeExpansionLimitEnabled: initialData?.nodeExpansionLimitEnabled || false,
    nodeExpansionLimit: initialData?.nodeExpansionLimit,
    edgeConnectionDiscovery: initialData?.edgeConnectionDiscovery ?? "auto",
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

  const reset = useResetState();
  const onSubmit = () => {
    const normalizedForm: ConnectionForm = {
      ...form,
      url: normalizeUrlField(form.url),
      graphDbUrl: normalizeUrlField(form.graphDbUrl),
    };

    if (
      !normalizedForm.name ||
      !normalizedForm.url ||
      !normalizedForm.queryEngine
    ) {
      setError(true);
      return;
    }

    if (normalizedForm.proxyConnection && !normalizedForm.graphDbUrl) {
      setError(true);
      return;
    }

    if (
      normalizedForm.awsAuthEnabled &&
      (!normalizedForm.awsRegion || !normalizedForm.serviceType)
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
            Public or Proxy Endpoint
            <InfoTooltip>
              Provide the endpoint URL for an open graph database, e.g., Gremlin
              Server. If connecting to Amazon Neptune, then provide a proxy
              endpoint URL that is accessible from outside the VPC, e.g., EC2.
            </InfoTooltip>
          </Label>
          <TextAreaField
            aria-label="Public or Proxy Endpoint"
            data-autofocus={true}
            value={form.url}
            onChange={onFormChange("url")}
            errorMessage="URL is required"
            placeholder="https://example.com"
            validationState={
              hasError && !normalizeUrlField(form.url) ? "invalid" : "valid"
            }
          />
        </FormItem>

        <Label className="cursor-pointer">
          <Checkbox
            value="proxyConnection"
            checked={form.proxyConnection}
            onCheckedChange={checked => {
              onFormChange("proxyConnection")(checked);
            }}
          />
          Using Proxy-Server
        </Label>
        {form.proxyConnection && (
          <FormItem>
            <Label>Graph Connection URL</Label>
            <TextAreaField
              aria-label="Graph Connection URL"
              data-autofocus={true}
              value={form.graphDbUrl}
              onChange={onFormChange("graphDbUrl")}
              errorMessage="URL is required"
              placeholder="https://neptune-cluster.amazonaws.com"
              validationState={
                hasError && !normalizeUrlField(form.graphDbUrl)
                  ? "invalid"
                  : "valid"
              }
            />
          </FormItem>
        )}
        {form.proxyConnection && (
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
        {form.proxyConnection && form.awsAuthEnabled && (
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
                <Label>Node Expansion Limit</Label>
                <InputField
                  aria-label="Node Expansion Limit"
                  type="number"
                  value={form.nodeExpansionLimit}
                  onChange={onFormChange("nodeExpansionLimit")}
                  min={0}
                />
              </FormItem>
            )}
            {form.queryEngine === "gremlin" && (
              <FieldSet>
                <FieldLegend variant="label" id={DISCOVERY_LEGEND_ID}>
                  Edge Connection Discovery
                </FieldLegend>
                <FieldDescription>
                  How much of the graph is read to work out which node types
                  each edge type connects. Only the Schema view uses this.
                </FieldDescription>
                <RadioGroup
                  aria-labelledby={DISCOVERY_LEGEND_ID}
                  value={form.edgeConnectionDiscovery}
                  onValueChange={onFormChange("edgeConnectionDiscovery")}
                >
                  {EDGE_CONNECTION_DISCOVERY_OPTIONS.map(option => {
                    const id = `edge-connection-discovery-${option.value}`;
                    return (
                      <FieldLabel key={option.value} htmlFor={id}>
                        <Field orientation="horizontal">
                          {/* The label wraps the whole card so any part of it is
                          clickable. `aria-labelledby` then names the radio from
                          its title alone, because the label's full text content
                          would otherwise make the description part of the name
                          and re-read it on every arrow key. */}
                          <RadioGroupItem
                            id={id}
                            value={option.value}
                            aria-labelledby={`${id}-title`}
                            aria-describedby={`${id}-description`}
                          />
                          <FieldContent>
                            <FieldTitle id={`${id}-title`}>
                              {option.label}
                            </FieldTitle>
                            <FieldDescription id={`${id}-description`}>
                              {option.description}
                            </FieldDescription>
                          </FieldContent>
                        </Field>
                      </FieldLabel>
                    );
                  })}
                </RadioGroup>
              </FieldSet>
            )}
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
