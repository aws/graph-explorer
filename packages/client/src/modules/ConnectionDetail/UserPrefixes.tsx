import { useCallback, useMemo, useState } from "react";
import { useRecoilCallback } from "recoil";
import {
  AdvancedList,
  Button,
  DeleteIcon,
  IconButton,
  Input,
  SaveIcon,
} from "../../components";
import {
  useConfiguration,
  useWithTheme,
  withClassNamePrefix,
} from "../../core";
import { schemaAtom } from "../../core/StateProvider/schema";
import defaultStyles from "./TabContentPrefixes.styles";

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
  }, [form.prefix, form.uri, onSave]);

  return (
    <div className={styleWithTheme(defaultStyles(classNamePrefix))}>
      <AdvancedList
        searchPlaceholder={"Search for prefixes or URIs"}
        search={search}
        onSearch={setSearch}
        items={items}
        emptyState={{
          noElementsTitle: "No Prefixes",
          noElementsSubtitle: "No stored Prefixes in this list",
          noSearchResultsTitle: "No Prefixes",
        }}
      />
      <div className={pfx("add-prefix-container")}>
        <Input
          label={"Prefix"}
          value={form.prefix}
          onChange={onFormChange("prefix")}
          placeholder={"Prefix"}
          validationState={hasError && !form.prefix ? "invalid" : "valid"}
          errorMessage={"Prefix is required"}
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
        <Button icon={<SaveIcon />} variant={"filled"} onPress={onSubmit}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default UserPrefixes;
