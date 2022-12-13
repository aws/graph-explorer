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
  type?: "gremlin" | "sparql";
<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/modules/CreateConnection/CreateConnection.tsx
  proxyConnection?: boolean;
  graphDbUrl?: string;
  awsAuthEnabled?: boolean;
=======
  neptuneOrBlazegraph?: boolean;
  graphDbUrl?: string;
  neptuneAuthEnabled?: boolean;
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/modules/CreateConnection/CreateConnection.tsx
=======
  proxyConnection?: boolean;
  graphDbUrl?: string;
  awsAuthEnabled?: boolean;
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
  awsRegion?: string;
};

const CONNECTIONS_OP = [
  { label: "PG (Property Graph)", value: "gremlin" },
  { label: "RDF (Resource Description Framework)", value: "sparql" },
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
<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/modules/CreateConnection/CreateConnection.tsx
            proxyConnection: data.proxyConnection,
            graphDbUrl: data.graphDbUrl,
            awsAuthEnabled: data.awsAuthEnabled,
=======
            neptuneOrBlazegraph: data.neptuneOrBlazegraph,
            graphDbUrl: data.graphDbUrl,
            neptuneAuthEnabled: data.neptuneAuthEnabled,
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/modules/CreateConnection/CreateConnection.tsx
=======
            proxyConnection: data.proxyConnection,
            graphDbUrl: data.graphDbUrl,
            awsAuthEnabled: data.awsAuthEnabled,
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
            awsRegion: data.awsRegion,
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
<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/modules/CreateConnection/CreateConnection.tsx
            proxyConnection: data.proxyConnection,
            graphDbUrl: data.graphDbUrl,
            awsAuthEnabled: data.awsAuthEnabled,
=======
            neptuneOrBlazegraph: data.neptuneOrBlazegraph,
            graphDbUrl: data.graphDbUrl,
            neptuneAuthEnabled: data.neptuneAuthEnabled,
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/modules/CreateConnection/CreateConnection.tsx
=======
            proxyConnection: data.proxyConnection,
            graphDbUrl: data.graphDbUrl,
            awsAuthEnabled: data.awsAuthEnabled,
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
            awsRegion: data.awsRegion,
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
<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/modules/CreateConnection/CreateConnection.tsx
    proxyConnection: initialData?.proxyConnection || false,
    graphDbUrl: initialData?.graphDbUrl || "",
    awsAuthEnabled: initialData?.awsAuthEnabled || false,
=======
    neptuneOrBlazegraph: initialData?.neptuneOrBlazegraph || false,
    graphDbUrl: initialData?.graphDbUrl || "",
    neptuneAuthEnabled: initialData?.neptuneAuthEnabled || false,
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/modules/CreateConnection/CreateConnection.tsx
=======
    proxyConnection: initialData?.proxyConnection || false,
    graphDbUrl: initialData?.graphDbUrl || "",
    awsAuthEnabled: initialData?.awsAuthEnabled || false,
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
    awsRegion: initialData?.awsRegion || "",
  });

  const [hasError, setError] = useState(false);
  const onFormChange = useCallback(
    (attribute: string) => (value: string | string[] | boolean) => {
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

<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/modules/CreateConnection/CreateConnection.tsx
    if (form.proxyConnection && !form.graphDbUrl) {
=======
    if (form.neptuneOrBlazegraph && !form.graphDbUrl) {
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/modules/CreateConnection/CreateConnection.tsx
=======
    if (form.proxyConnection && !form.graphDbUrl) {
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
      setError(true);
      return;
    }

<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/modules/CreateConnection/CreateConnection.tsx
    if (form.awsAuthEnabled && !form.awsRegion) {
=======
    if (form.neptuneAuthEnabled && !form.awsRegion) {
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/modules/CreateConnection/CreateConnection.tsx
=======
    if (form.awsAuthEnabled && !form.awsRegion) {
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
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
            label={
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
<<<<<<< HEAD
                Public or Proxy Endpoint
=======
                Public Endpoint
>>>>>>> beca7aa (12/09 12:22PM push)
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
<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/modules/CreateConnection/CreateConnection.tsx
            value={"proxyConnection"}
            checked={form.proxyConnection}
            onChange={e => {
              onFormChange("proxyConnection")(e.target.checked);
            }}
            label={"Using Proxy-Server"}
          />
        </div>
        {form.proxyConnection && (
=======
            value={"neptuneOrBlazegraph"}
            checked={form.neptuneOrBlazegraph}
=======
            value={"proxyConnection"}
            checked={form.proxyConnection}
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
            onChange={e => {
              onFormChange("proxyConnection")(e.target.checked);
            }}
            label={"Connecting to Proxy-Server"}
          />
        </div>
<<<<<<< HEAD
        {form.neptuneOrBlazegraph && (
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/modules/CreateConnection/CreateConnection.tsx
=======
        {form.proxyConnection && (
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
          <div className={pfx("input-url")}>
            <Input
              data-autofocus={true}
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
<<<<<<< HEAD
<<<<<<< HEAD:packages/graph-explorer/src/modules/CreateConnection/CreateConnection.tsx
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
=======
        {form.neptuneOrBlazegraph && (
=======
        {form.proxyConnection && (
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
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
<<<<<<< HEAD
              label={"AWS Neptune Region"}
>>>>>>> 00a6590 (12/08 5:31PM CT push):packages/client/src/modules/CreateConnection/CreateConnection.tsx
=======
              label={"AWS Region"}
>>>>>>> e6c010c (12/13 10:01AM push (Address README fixes, change labels of connection page, change ENV variable prefixes, abstract node server logic))
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
