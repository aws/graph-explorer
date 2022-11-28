import { Modal } from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import { useRecoilCallback } from "recoil";
import {
  AddIcon,
  AdvancedList,
  Button,
  DeleteIcon,
  IconButton,
  Input,
  NamespaceIcon,
  PanelEmptyState,
  SaveIcon,
} from "../../components";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import { schemaAtom } from "../../core/StateProvider/schema";
import defaultStyles from "./NsType.styles";
import modalDefaultStyles from "./NsTypeModal.styles";

export type UserPrefixesProps = {
  classNamePrefix?: string;
};

type PrefixForm = {
  prefix: string;
  uri: string;
};

const UserPrefixes = ({ classNamePrefix = "ft" }: UserPrefixesProps) => {
  const styleWithTheme = useWithTheme();
  const pfx = withClassNamePrefix(classNamePrefix);
  const config = useConfiguration();
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);

  const onDeletePrefix = useRecoilCallback(
    ({ set }) => (prefix: string) => () => {
      if (!config?.id) {
        return;
      }

      set(schemaAtom, prevSchemas => {
        const updatedSchemas = new Map(prevSchemas);
        const activeSchema = updatedSchemas.get(config.id);

        updatedSchemas.set(config.id, {
          ...(activeSchema || {}),
          vertices: activeSchema?.vertices || [],
          edges: activeSchema?.edges || [],
          prefixes: (activeSchema?.prefixes || []).filter(
            prefixConfig => prefixConfig.prefix !== prefix
          ),
        });

        return updatedSchemas;
      });
    },
    [config?.id]
  );

  const items = useMemo(() => {
    return (
      config?.schema?.prefixes
        ?.filter(prefixConfig => prefixConfig.__inferred !== true)
        .map(prefixConfig => {
          return {
            id: prefixConfig.prefix,
            title: `${prefixConfig.prefix} ${prefixConfig.uri}`,
            titleComponent: prefixConfig.prefix,
            subtitle: prefixConfig.uri,
            endAdornment: (
              <IconButton
                variant={"text"}
                size={"small"}
                color={"error"}
                icon={<DeleteIcon />}
                onPress={onDeletePrefix(prefixConfig.prefix)}
              />
            ),
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title)) || []
    );
  }, [config?.schema?.prefixes, onDeletePrefix]);

  const [hasError, setError] = useState(false);
  const [form, setForm] = useState<PrefixForm>({
    prefix: "",
    uri: "",
  });

  const onFormChange = useCallback(
    (attribute: "prefix" | "uri") => (value: string) => {
      setForm(prev => ({
        ...prev,
        [attribute]: value as string,
      }));
    },
    []
  );

  const onSave = useRecoilCallback(
    ({ set }) => (prefix: string, uri: string) => {
      if (!config?.id) {
        return;
      }

      set(schemaAtom, prevSchemas => {
        const updatedSchemas = new Map(prevSchemas);
        const activeSchema = updatedSchemas.get(config.id);

        updatedSchemas.set(config.id, {
          ...(activeSchema || {}),
          vertices: activeSchema?.vertices || [],
          edges: activeSchema?.edges || [],
          prefixes: [...(activeSchema?.prefixes || []), { prefix, uri }],
        });

        return updatedSchemas;
      });
    },
    [config?.id]
  );

  const onSubmit = useCallback(() => {
    if (!form.prefix || !form.uri) {
      setError(true);
      return;
    }

    onSave(form.prefix, form.uri);
    setForm({ prefix: "", uri: "" });
    setError(false);
    setOpened(false);
  }, [form.prefix, form.uri, onSave]);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      {items.length === 0 && (
        <PanelEmptyState
          title={"No Namespaces"}
          subtitle={"No Custom Namespaces stored"}
          icon={<NamespaceIcon />}
          actionLabel={"Start creating a new namespace"}
          onAction={() => setOpened(true)}
        />
      )}
      {items.length > 0 && (
        <AdvancedList
          className={pfx("advanced-list")}
          searchPlaceholder={"Search for Namespaces or URIs"}
          search={search}
          onSearch={setSearch}
          items={items}
          emptyState={{
            noSearchResultsTitle: "No Namespaces",
          }}
        />
      )}
      {items.length > 0 && (
        <div className={pfx("actions")}>
          <Button
            icon={<AddIcon />}
            variant={"filled"}
            onPress={() => setOpened(true)}
          >
            Create
          </Button>
        </div>
      )}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        centered={true}
        title={"Create a new Namespace"}
        className={styleWithTheme(modalDefaultStyles(classNamePrefix))}
      >
        <div>
          <Input
            label={"Namespace"}
            value={form.prefix}
            onChange={onFormChange("prefix")}
            placeholder={"Namespace"}
            validationState={hasError && !form.prefix ? "invalid" : "valid"}
            errorMessage={"Namespace is required"}
          />
          <Input
            className={pfx("input-uri")}
            label={"URI"}
            value={form.uri}
            onChange={onFormChange("uri")}
            placeholder={"URI"}
            validationState={hasError && !form.uri ? "invalid" : "valid"}
            errorMessage={"URI is required"}
          />
        </div>
        <div className={pfx("actions")}>
          <Button icon={<SaveIcon />} variant={"filled"} onPress={onSubmit}>
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserPrefixes;
