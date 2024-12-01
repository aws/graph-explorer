import { useCallback, useState } from "react";
import { useRecoilCallback } from "recoil";
import { v4 } from "uuid";
import {
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InfoTooltip,
  TextArea,
} from "@/components";
import Button from "@/components/Button";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { ConnectionConfig } from "@shared/types";
import {
  ConfigurationContextProps,
  RawConfiguration,
  useWithTheme,
} from "@/core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "@/core/StateProvider/configuration";
import { schemaAtom } from "@/core/StateProvider/schema";
import useResetState from "@/core/StateProvider/useResetState";
import { cn, formatDate } from "@/utils";
import defaultStyles from "./CreateConnection.styles";
import {
  DEFAULT_FETCH_TIMEOUT,
  DEFAULT_NODE_EXPAND_LIMIT,
} from "@/utils/constants";
import { Checkbox, Label } from "@/components/radix";
import { VisuallyHidden } from "@react-aria/visually-hidden";

type ConnectionForm = {
  name?: string;
  url?: string;
  queryEngine?: "gremlin" | "sparql" | "openCypher";
  proxyConnection?: boolean;
  graphDbUrl?: string;
  awsAuthEnabled?: boolean;
  serviceType?: "neptune-db" | "neptune-graph";
  awsRegion?: string;
  fetchTimeoutEnabled: boolean;
  fetchTimeoutMs?: number;
  nodeExpansionLimitEnabled: boolean;
  nodeExpansionLimit?: number;
};

export const CONNECTIONS_OP: {
  label: string;
  value: NonNullable<ConnectionConfig["queryEngine"]>;
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

const CreateConnection = ({
  existingConfig,
  onClose,
}: CreateConnectionProps) => {
  const styleWithTheme = useWithTheme();

  const configId = existingConfig?.id;
  const disabledFields: (keyof ConnectionForm)[] = existingConfig?.__fileBase
    ? ["queryEngine", "url", "serviceType"]
    : [];
  const initialData: ConnectionForm | undefined = existingConfig
    ? {
        ...(existingConfig.connection || {}),
        name: existingConfig.displayLabel || existingConfig.id,
        fetchTimeoutEnabled: Boolean(existingConfig.connection?.fetchTimeoutMs),
        nodeExpansionLimitEnabled: Boolean(
          existingConfig.connection?.nodeExpansionLimit
        ),
      }
    : undefined;

  const onSave = useRecoilCallback(
    ({ set }) =>
      (data: Required<ConnectionForm>) => {
        if (!configId) {
          const newConfigId = v4();
          const newConfig: RawConfiguration = {
            id: newConfigId,
            displayLabel: data.name,
            connection: mapToConnection(data),
          };
          set(configurationAtom, prevConfigMap => {
            const updatedConfig = new Map(prevConfigMap);
            updatedConfig.set(newConfigId, newConfig);
            return updatedConfig;
          });
          set(activeConfigurationAtom, newConfigId);
          return;
        }

        set(configurationAtom, prevConfigMap => {
          const updatedConfig = new Map(prevConfigMap);
          const currentConfig = updatedConfig.get(configId);

          updatedConfig.set(configId, {
            ...(currentConfig || {}),
            id: configId,
            displayLabel: data.name,
            connection: mapToConnection(data),
          });
          return updatedConfig;
        });

        const urlChange = initialData?.url !== data.url;
        const typeChange = initialData?.queryEngine !== data.queryEngine;

        if (urlChange || typeChange) {
          set(schemaAtom, prevSchemaMap => {
            const updatedSchema = new Map(prevSchemaMap);
            const currentSchema = updatedSchema.get(configId);
            updatedSchema.set(configId, {
              vertices: currentSchema?.vertices || [],
              edges: currentSchema?.edges || [],
              prefixes: currentSchema?.prefixes || [],
              // If the URL or Engine change, show as not synchronized
              lastUpdate: undefined,
              lastSyncFail: undefined,
              triedToSync: undefined,
            });

            return updatedSchema;
          });
        }
      },
    [configId, initialData?.url, initialData?.queryEngine]
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
  const onFormChange = useCallback(
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
            ["nodeExpansionLimit"]: value
              ? DEFAULT_NODE_EXPAND_LIMIT
              : undefined,
          }));
        } else {
          setForm(prev => ({
            ...prev,
            [attribute]: value,
          }));
        }
      },
    []
  );

  const reset = useResetState();
  const onSubmit = useCallback(() => {
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
  }, [form, onClose, onSave, reset]);

  return (
    <DialogContent className="min-w-[500px]">
      <DialogHeader>
        <DialogTitle>
          {existingConfig ? "Update connection" : "Add New Connection"}
        </DialogTitle>
        <VisuallyHidden>
          <DialogDescription>
            {existingConfig ? "Update connection" : "Add New Connection"}
          </DialogDescription>
        </VisuallyHidden>
      </DialogHeader>
      <DialogBody className={cn(styleWithTheme(defaultStyles))}>
        <div className={"configuration-form"}>
          <Input
            label={"Name"}
            value={form.name}
            onChange={onFormChange("name")}
            errorMessage={"Name is required"}
            validationState={hasError && !form.name ? "invalid" : "valid"}
            isDisabled={disabledFields.includes("name")}
          />
          <Select
            label={"Graph Type"}
            options={CONNECTIONS_OP}
            value={form.queryEngine}
            onChange={onFormChange("queryEngine")}
            isDisabled={
              disabledFields.includes("queryEngine") ||
              form.serviceType === "neptune-graph"
            }
          />
          <div className={"input-url"}>
            <TextArea
              autoFocus={true}
              label={
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  Public or Proxy Endpoint
                  <InfoTooltip>
                    Provide the endpoint URL for an open graph database, e.g.,
                    Gremlin Server. If connecting to Amazon Neptune, then
                    provide a proxy endpoint URL that is accessible from outside
                    the VPC, e.g., EC2.
                  </InfoTooltip>
                </div>
              }
              value={form.url}
              onChange={onFormChange("url")}
              errorMessage={"URL is required"}
              placeholder={"https://example.com"}
              validationState={hasError && !form.url ? "invalid" : "valid"}
              isDisabled={disabledFields.includes("url")}
            />
          </div>
          <div className={"input-url"}>
            <Label className="cursor-pointer">
              <Checkbox
                value={"proxyConnection"}
                checked={form.proxyConnection}
                onCheckedChange={checked => {
                  onFormChange("proxyConnection")(checked);
                }}
              />
              Using Proxy-Server
            </Label>
          </div>
          {form.proxyConnection && (
            <div className={"input-url"}>
              <TextArea
                autoFocus={true}
                label={"Graph Connection URL"}
                value={form.graphDbUrl}
                onChange={onFormChange("graphDbUrl")}
                errorMessage={"URL is required"}
                placeholder={"https://neptune-cluster.amazonaws.com"}
                validationState={
                  hasError && !form.graphDbUrl ? "invalid" : "valid"
                }
              />
            </div>
          )}
          {form.proxyConnection && (
            <div className={"input-url"}>
              <Label className="cursor-pointer">
                <Checkbox
                  value={"awsAuthEnabled"}
                  checked={form.awsAuthEnabled}
                  onCheckedChange={checked => {
                    onFormChange("awsAuthEnabled")(checked);
                  }}
                />
                AWS IAM Auth Enabled
              </Label>
            </div>
          )}
          {form.proxyConnection && form.awsAuthEnabled && (
            <>
              <div className={"input-url"}>
                <Input
                  autoFocus={true}
                  label={"AWS Region"}
                  value={form.awsRegion}
                  onChange={onFormChange("awsRegion")}
                  errorMessage={"Region is required"}
                  placeholder={"us-east-1"}
                  validationState={
                    hasError && !form.awsRegion ? "invalid" : "valid"
                  }
                />
              </div>
              <div className={"input-url"}>
                <Select
                  label={"Service Type"}
                  options={[
                    { label: "Neptune DB", value: "neptune-db" },
                    { label: "Neptune Graph", value: "neptune-graph" },
                  ]}
                  value={form.serviceType}
                  onChange={onFormChange("serviceType")}
                  isDisabled={disabledFields.includes("serviceType")}
                />
              </div>
            </>
          )}
        </div>
        <div className={"configuration-form"}>
          <Label className="cursor-pointer">
            <Checkbox
              value={"fetchTimeoutEnabled"}
              checked={form.fetchTimeoutEnabled}
              onCheckedChange={checked => {
                onFormChange("fetchTimeoutEnabled")(checked);
              }}
            />
            <div className="flex items-center gap-2">
              Enable Fetch Timeout
              <InfoTooltip>
                Large datasets may require a large amount of time to fetch. If
                the timeout is exceeded, the request will be cancelled.
              </InfoTooltip>
            </div>
          </Label>
          {form.fetchTimeoutEnabled && (
            <div className={"input-url"}>
              <Input
                label="Fetch Timeout (ms)"
                type={"number"}
                value={form.fetchTimeoutMs}
                onChange={onFormChange("fetchTimeoutMs")}
                min={0}
              />
            </div>
          )}
        </div>
        <div className={"configuration-form"}>
          <Label className="cursor-pointer">
            <Checkbox
              value={"nodeExpansionLimitEnabled"}
              checked={form.nodeExpansionLimitEnabled}
              onCheckedChange={checked => {
                onFormChange("nodeExpansionLimitEnabled")(checked);
              }}
            />
            <div className="flex items-center gap-2">
              Enable Node Expansion Limit
              <InfoTooltip>
                Large datasets may require a default limit to the amount of
                neighbors that are returned during any single expansion.
              </InfoTooltip>
            </div>
          </Label>
          {form.nodeExpansionLimitEnabled && (
            <div className={"input-url"}>
              <Input
                label="Node Expansion Limit"
                type="number"
                value={form.nodeExpansionLimit}
                onChange={onFormChange("nodeExpansionLimit")}
                min={0}
              />
            </div>
          )}
        </div>
      </DialogBody>
      <DialogFooter>
        <Button variant="default" onPress={onClose}>
          Cancel
        </Button>
        <Button variant="filled" onPress={onSubmit}>
          {!configId ? "Add Connection" : "Update Connection"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

export default CreateConnection;
