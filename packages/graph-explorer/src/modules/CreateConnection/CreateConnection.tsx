import type {
  ConnectionConfig,
  NeptuneServiceType,
  QueryEngine,
} from "@shared/types";

import { useQueryClient } from "@tanstack/react-query";
import { useAtomCallback } from "jotai/utils";
import { useCallback, useState } from "react";

import {
  Button,
  Checkbox,
  FormItem,
  InfoTooltip,
  InputField,
  Label,
  SelectField,
  TextAreaField,
} from "@/components";
import {
  activeConfigurationAtom,
  allGraphSessionsAtom,
  configurationAtom,
  type ConfigurationContextProps,
  createNewConfigurationId,
  type RawConfiguration,
  schemaAtom,
} from "@/core";
import useResetState from "@/core/StateProvider/useResetState";
import { formatDate, logger } from "@/utils";
import {
  DEFAULT_FETCH_TIMEOUT,
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
};

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
  };
}

function mapToConnectionForm(
  existingConfig: ConfigurationContextProps | undefined,
) {
  if (!existingConfig) {
    return;
  }

  const result: ConnectionForm = {
    ...(existingConfig.connection ?? {}),
    name: existingConfig.displayLabel ?? existingConfig.id,
    fetchTimeoutEnabled: Boolean(existingConfig.connection?.fetchTimeoutMs),
    nodeExpansionLimitEnabled: Boolean(
      existingConfig.connection?.nodeExpansionLimit,
    ),
  };
  return result;
}

const CreateConnection = ({
  existingConfig,
  onClose,
}: CreateConnectionProps) => {
  const queryClient = useQueryClient();

  const configId = existingConfig?.id;
  const initialData = mapToConnectionForm(existingConfig);

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
            ...(currentConfig || {}),
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
          void queryClient.removeQueries();
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
    if (!form.name || !form.url || !form.queryEngine) {
      setError(true);
      return;
    }

    if (form.proxyConnection && !form.graphDbUrl) {
      setError(true);
      return;
    }

    if (form.awsAuthEnabled && (!form.awsRegion || !form.serviceType)) {
      setError(true);
      return;
    }

    onSave(form as Required<ConnectionForm>);
    reset();
    onClose();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-6">
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
            validationState={hasError && !form.url ? "invalid" : "valid"}
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
                hasError && !form.graphDbUrl ? "invalid" : "valid"
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
                Large datasets may require a large amount of time to fetch. If
                the timeout is exceeded, the request will be cancelled.
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
      </div>
      <div className="flex justify-between border-t pt-4">
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={onSubmit}>
          {!configId ? "Add Connection" : "Update Connection"}
        </Button>
      </div>
    </div>
  );
};

export default CreateConnection;
