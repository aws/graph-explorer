import { Checkbox } from "@mantine/core";
import { useCallback, useState } from "react";
import { useRecoilCallback } from "recoil";
import { v4 } from "uuid";
import { InfoIcon, Tooltip } from "../../components";
import Button from "../../components/Button";
import Input from "../../components/Input";
import { useNotification } from "../../components/NotificationProvider";
import Select from "../../components/Select";
import {
  RawConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import {
  activeConfigurationAtom,
  configurationAtom,
} from "../../core/StateProvider/configuration";
import { schemaAtom } from "../../core/StateProvider/schema";
import useResetState from "../../core/StateProvider/useResetState";
import { formatDate } from "../../utils";
import defaultStyles from "./CreateConnection.styles";

type ConnectionForm = {
  name?: string;
  url?: string;
  type?: "gremlin" | "sparql" | "openCypher";
  proxyConnection?: boolean;
  graphDbUrl?: string;
  awsAuthEnabled?: boolean;
  awsRegion?: string;
  enableCache?: boolean;
  cacheTimeMs?: number;
};

const CONNECTIONS_OP = [
  { label: "PG (Property Graph) - Gremlin", value: "gremlin" },
  { label: "PG (Property Graph) - OpenCypher", value: "openCypher" },
  { label: "RDF (Resource Description Framework) - SPARQL", value: "sparql" },
];

export type CreateConnectionProps = {
  configId?: string;
  initialData?: ConnectionForm;
  disabledFields?: Array<"name" | "type" | "url">;
  onClose(): void;
};

const CreateConnection = ({
  configId,
  initialData,
  disabledFields,
  onClose,
}: CreateConnectionProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix("ft");
  const { enqueueNotification } = useNotification();

  const onSave = useRecoilCallback(
    ({ set }) => async (data: Required<ConnectionForm>) => {
      if (!configId) {
        const newConfigId = v4();
        const newConfig: RawConfiguration = {
          id: newConfigId,
          displayLabel: data.name,
          connection: {
            url: data.url,
            queryEngine: data.type,
            proxyConnection: data.proxyConnection,
            graphDbUrl: data.graphDbUrl,
            awsAuthEnabled: data.awsAuthEnabled,
            awsRegion: data.awsRegion,
            enableCache: data.enableCache,
            cacheTimeMs: data.cacheTimeMs * 60 * 1000,
          },
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
          connection: {
            url: data.url,
            queryEngine: data.type,
            proxyConnection: data.proxyConnection,
            graphDbUrl: data.graphDbUrl,
            awsAuthEnabled: data.awsAuthEnabled,
            awsRegion: data.awsRegion,
            cacheTimeMs: data.cacheTimeMs * 60 * 1000,
          },
        });
        return updatedConfig;
      });

      const urlChange = initialData?.url !== data.url;
      const typeChange = initialData?.type !== data.type;

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
    [enqueueNotification, configId]
  );

  const [form, setForm] = useState<ConnectionForm>({
    type: initialData?.type || "gremlin",
    name:
      initialData?.name ||
      `Connection (${formatDate(new Date(), "yyyy-MM-dd HH:mm")})`,
    url: initialData?.url || "",
    proxyConnection: initialData?.proxyConnection || false,
    graphDbUrl: initialData?.graphDbUrl || "",
    awsAuthEnabled: initialData?.awsAuthEnabled || false,
    awsRegion: initialData?.awsRegion || "",
    enableCache: true,
    cacheTimeMs: (initialData?.cacheTimeMs ?? 10 * 60 * 1000) / 60000,
  });

  const [hasError, setError] = useState(false);
  const onFormChange = useCallback(
    (attribute: string) => (value: number | string | string[] | boolean) => {
      setForm(prev => ({
        ...prev,
        [attribute]: value,
      }));
    },
    []
  );

  const reset = useResetState();
  const onSubmit = useCallback(() => {
    if (!form.name || !form.url || !form.type) {
      setError(true);
      return;
    }

    if (form.proxyConnection && !form.graphDbUrl) {
      setError(true);
      return;
    }

    if (form.awsAuthEnabled && !form.awsRegion) {
      setError(true);
      return;
    }

    onSave(form as Required<ConnectionForm>);
    reset();
    onClose();
  }, [form, onClose, onSave, reset]);

  return (
    <div className={styleWithTheme(defaultStyles("ft"))}>
      <div className={pfx("configuration-form")}>
        <Input
          label={"Name"}
          value={form.name}
          onChange={onFormChange("name")}
          errorMessage={"Name is required"}
          validationState={hasError && !form.name ? "invalid" : "valid"}
          isDisabled={disabledFields?.includes("name")}
        />
        <Select
          label={"Graph Type"}
          options={CONNECTIONS_OP}
          value={form.type}
          onChange={onFormChange("type")}
          isDisabled={disabledFields?.includes("type")}
        />
        <div className={pfx("input-url")}>
          <Input
            data-autofocus={true}
            component={"textarea"}
            label={
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                Public or Proxy Endpoint
                <Tooltip
                  text={
                    <div style={{ maxWidth: 300 }}>
                      Provide the endpoint URL for an open graph database, e.g.,
                      Gremlin Server. If connecting to Amazon Neptune, then
                      provide a proxy endpoint URL that is accessible from
                      outside the VPC, e.g., EC2.
                    </div>
                  }
                >
                  <div>
                    <InfoIcon style={{ width: 18, height: 18 }} />
                  </div>
                </Tooltip>
              </div>
            }
            value={form.url}
            onChange={onFormChange("url")}
            errorMessage={"URL is required"}
            placeholder={"https://example.com"}
            validationState={hasError && !form.url ? "invalid" : "valid"}
            isDisabled={disabledFields?.includes("url")}
          />
        </div>
        <div className={pfx("input-url")}>
          <Checkbox
            value={"proxyConnection"}
            checked={form.proxyConnection}
            onChange={e => {
              onFormChange("proxyConnection")(e.target.checked);
            }}
            label={"Using Proxy-Server"}
          />
        </div>
        {form.proxyConnection && (
          <div className={pfx("input-url")}>
            <Input
              data-autofocus={true}
              label={"Graph Connection URL"}
              component={"textarea"}
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
          <div className={pfx("input-url")}>
            <Checkbox
              value={"awsAuthEnabled"}
              checked={form.awsAuthEnabled}
              onChange={e => {
                onFormChange("awsAuthEnabled")(e.target.checked);
              }}
              label={"AWS IAM Auth Enabled"}
            />
          </div>
        )}
        {form.proxyConnection && form.awsAuthEnabled && (
          <div className={pfx("input-url")}>
            <Input
              data-autofocus={true}
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
        )}
      </div>
      <div className={pfx("configuration-form")}>
        <Checkbox
          value={"enableCache"}
          checked={form.enableCache}
          onChange={e => {
            onFormChange("enableCache")(e.target.checked);
          }}
          styles={{
            label: {
              display: "block",
            },
          }}
          label={
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              Enable Cache
              <Tooltip
                text={
                  <div style={{ maxWidth: 300 }}>
                    Requests made by the Graph Explorer can be temporarily
                    stored in the browser cache for quick access to the data.
                  </div>
                }
              >
                <div>
                  <InfoIcon style={{ width: 18, height: 18 }} />
                </div>
              </Tooltip>
            </div>
          }
        />
        {form.enableCache && (
          <div className={pfx("input-url")}>
            <Input
              label="Cache Time (minutes)"
              type={"number"}
              value={form.cacheTimeMs}
              onChange={onFormChange("cacheTimeMs")}
              min={0}
            />
          </div>
        )}
      </div>
      <div className={pfx("actions")}>
        <Button variant={"default"} onPress={onClose}>
          Cancel
        </Button>
        <Button variant={"filled"} onPress={onSubmit}>
          {!configId ? "Add Connection" : "Update Connection"}
        </Button>
      </div>
    </div>
  );
};

export default CreateConnection;
