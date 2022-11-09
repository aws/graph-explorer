import { useCallback, useState } from "react";
import { useRecoilCallback } from "recoil";
import { v4 } from "uuid";
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
};

const CONNECTIONS_OP = [
  { label: "LPG (Labelled Property Graph)", value: "gremlin" },
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
    ({ set }) => (data: Required<ConnectionForm>) => {
      if (!configId) {
        const newConfigId = v4();
        const newConfig: RawConfiguration = {
          id: newConfigId,
          displayLabel: data.name,
          connection: {
            url: data.url,
            queryEngine: data.type,
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
          },
        });
        return updatedConfig;
      });

      const urlChange = initialData?.url !== data.url;
      const typeChange = initialData?.type !== data.type;

      if (urlChange || typeChange) {
        enqueueNotification({
          title: "Graph Type or URL changed",
          message: "Synchronization required",
          type: "warning",
          stackable: true,
        });

        set(schemaAtom, prevSchemaMap => {
          const updatedSchema = new Map(prevSchemaMap);
          const currentSchema = updatedSchema.get(configId);
          updatedSchema.set(configId, {
            vertices: currentSchema?.vertices || [],
            edges: currentSchema?.edges || [],
            prefixes: currentSchema?.prefixes || [],
            // If the URL or Engine change, show as not synchronized
            lastUpdate: undefined,
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
  });

  const [hasError, setError] = useState(false);

  const onFormChange = useCallback(
    (attribute: "name" | "url" | "type" | "mode") => (
      value: string | string[]
    ) => {
      setForm(prev => ({
        ...prev,
        [attribute]: value as string,
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
            label={"Public URL"}
            value={form.url}
            onChange={onFormChange("url")}
            errorMessage={"URL is required"}
            placeholder={"https://example.com"}
            validationState={hasError && !form.url ? "invalid" : "valid"}
            isDisabled={disabledFields?.includes("url")}
          />
        </div>
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
