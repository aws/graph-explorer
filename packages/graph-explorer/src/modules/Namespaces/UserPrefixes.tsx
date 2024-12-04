import { useCallback, useMemo, useState } from "react";
import { useRecoilCallback } from "recoil";
import {
  AddIcon,
  AdvancedList,
  Button,
  DeleteIcon,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  EmptyStateSubtitle,
  EmptyStateTitle,
  IconButton,
  Input,
  NamespaceIcon,
  SaveIcon,
  PanelFooter,
  DialogDescription,
} from "@/components";
import { RawConfiguration, useConfiguration, useWithTheme } from "@/core";
import { schemaAtom } from "@/core/StateProvider/schema";
import defaultStyles from "./NsType.styles";
import { VisuallyHidden } from "@react-aria/visually-hidden";

type PrefixForm = {
  prefix: string;
  uri: string;
};

const UserPrefixes = () => {
  const styleWithTheme = useWithTheme();
  const config = useConfiguration();
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);

  const onDeletePrefix = useRecoilCallback(
    ({ set }) =>
      (prefix: string) =>
      () => {
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
                onClick={onDeletePrefix(prefixConfig.prefix)}
              />
            ),
          };
        })
        .sort((a, b) => a.title.localeCompare(b.title)) || []
    );
  }, [config?.schema?.prefixes, onDeletePrefix]);

  return (
    <div className={styleWithTheme(defaultStyles)}>
      {items.length === 0 && (
        <EmptyState>
          <EmptyStateIcon>
            <NamespaceIcon />
          </EmptyStateIcon>
          <EmptyStateHeader>
            <EmptyStateTitle>No Namespaces</EmptyStateTitle>
            <EmptyStateSubtitle>No custom namespaces stored</EmptyStateSubtitle>
          </EmptyStateHeader>
          <Dialog open={opened} onOpenChange={setOpened}>
            <DialogTrigger asChild>
              <Button>Start creating a new namespace</Button>
            </DialogTrigger>
            <CreateNamespaceModal
              config={config}
              close={() => setOpened(false)}
            />
          </Dialog>
        </EmptyState>
      )}
      {items.length > 0 && (
        <AdvancedList
          className={"advanced-list"}
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
        <PanelFooter className="flex justify-end">
          <Dialog open={opened} onOpenChange={setOpened}>
            <DialogTrigger asChild>
              <Button icon={<AddIcon />}>Create</Button>
            </DialogTrigger>
            <CreateNamespaceModal
              config={config}
              close={() => setOpened(false)}
            />
          </Dialog>
        </PanelFooter>
      )}
    </div>
  );
};

function CreateNamespaceModal({
  config,
  close,
}: {
  config?: RawConfiguration;
  close: () => void;
}) {
  const [hasError, setError] = useState(false);
  const [form, setForm] = useState<PrefixForm>({
    prefix: "",
    uri: "",
  });

  const onFormChange = useCallback(
    (attribute: "prefix" | "uri") => (value: string) => {
      setForm(prev => ({
        ...prev,
        [attribute]: value,
      }));
    },
    []
  );

  const onSave = useRecoilCallback(
    ({ set }) =>
      (prefix: string, uri: string) => {
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
    close();
  }, [close, form.prefix, form.uri, onSave]);

  return (
    <DialogContent className="min-w-[400px]">
      <DialogHeader>
        <DialogTitle>Create a new Namespace</DialogTitle>
        <VisuallyHidden>
          <DialogDescription>Namespaces help shorten URIs</DialogDescription>
        </VisuallyHidden>
      </DialogHeader>
      <DialogBody>
        <Input
          label={"Namespace"}
          value={form.prefix}
          onChange={onFormChange("prefix")}
          placeholder={"Namespace"}
          validationState={hasError && !form.prefix ? "invalid" : "valid"}
          errorMessage={"Namespace is required"}
        />
        <Input
          className={"input-uri"}
          label={"URI"}
          value={form.uri}
          onChange={onFormChange("uri")}
          placeholder={"URI"}
          validationState={hasError && !form.uri ? "invalid" : "valid"}
          errorMessage={"URI is required"}
        />
      </DialogBody>
      <DialogFooter className="sm:justify-end">
        <Button icon={<SaveIcon />} variant="filled" onPress={onSubmit}>
          Save
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default UserPrefixes;
