import { useCallback, useState } from "react";
import { useRecoilCallback } from "recoil";
import { v4 } from "uuid";
import Button from "../../components/Button";
import Input from "../../components/Input";
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
import useResetState from "../../core/StateProvider/useResetState";
import { formatDate } from "../../utils";
import defaultStyles from "./CreateConnection.styles";

type ConnectionForm = {
  name?: string;
  url?: string;
  type?: "gremlin" | "sparql";
};

const CONNECTIONS_OP = [
  { label: "Gremlin", value: "gremlin" },
  { label: "SPARQL", value: "sparql" },
];

export type CreateConnectionProps = {
  onClose(): void;
};

const CreateConnection = ({ onClose }: CreateConnectionProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix("ft");

  const onSave = useRecoilCallback(
    ({ set }) => (data: Required<ConnectionForm>) => {
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
    },
    []
  );

  const [form, setForm] = useState<ConnectionForm>({
    type: "gremlin",
    name: `Connection (${formatDate(new Date(), "yyyy-MM-dd HH:mm")})`,
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
        />
        <Select
          label={"Engine Type"}
          options={CONNECTIONS_OP}
          value={form.type}
          onChange={onFormChange("type")}
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
          />
        </div>
      </div>
      <div className={pfx("actions")}>
        <Button variant={"default"} onPress={onClose}>
          Cancel
        </Button>
        <Button variant={"filled"} onPress={onSubmit}>
          Add Connection
        </Button>
      </div>
    </div>
  );
};

export default CreateConnection;
