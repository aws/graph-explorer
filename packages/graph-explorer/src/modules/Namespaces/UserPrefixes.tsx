import { useCallback, useMemo, useState } from "react";
import { useRecoilCallback } from "recoil";
import {
  AddIcon,
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
  EmptyStateIcon,
  EmptyStateTitle,
  IconButton,
  InputField,
  ListRow,
  ListRowContent,
  ListRowSubtitle,
  ListRowTitle,
  NamespaceIcon,
  PanelFooter,
  DialogDescription,
  SaveIcon,
  SearchBar,
  useSearchItems,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateActions,
} from "@/components";
import {
  activeConfigurationAtom,
  PrefixTypeConfig,
  RawConfiguration,
  useConfiguration,
} from "@/core";
import { schemaAtom } from "@/core/StateProvider/schema";
import { Virtuoso } from "react-virtuoso";
import React from "react";
import { VisuallyHidden } from "@react-aria/visually-hidden";

type PrefixForm = {
  prefix: string;
  uri: string;
};

const UserPrefixes = () => {
  const config = useConfiguration();
  const items = useCustomPrefixes();
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex h-full grow flex-col">
      {items.length === 0 && <NoPrefixes />}
      {items.length > 0 && (
        <PanelFooter className="flex justify-end">
          <Dialog open={opened} onOpenChange={setOpened}>
            <DialogTrigger asChild>
              <SearchablePrefixes
                items={items}
                onOpen={() => setOpened(true)}
              />
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

function useCustomPrefixes() {
  const config = useConfiguration();
  return useMemo(() => {
    return (config?.schema?.prefixes || []).filter(
      prefixConfig => prefixConfig.__inferred !== true
    );
  }, [config?.schema?.prefixes]);
}

function SearchablePrefixes({
  items,
  onOpen,
}: {
  items: PrefixTypeConfig[];
  onOpen: () => void;
}) {
  const { filteredItems, search, setSearch } = useSearchItems(
    items,
    config => `${config.prefix} ${config.uri}`
  );

  return (
    <div className="flex h-full grow flex-col">
      <div className="w-full shrink-0 px-3 py-2">
        <SearchBar
          search={search}
          searchPlaceholder="Search for Namespaces or URIs"
          onSearch={setSearch}
        />
      </div>
      <SearchResults filteredItems={filteredItems} className="grow" />
      <PanelFooter className="flex shrink-0 flex-row justify-end">
        <Button icon={<AddIcon />} variant="filled" onPress={onOpen}>
          Create
        </Button>
      </PanelFooter>
    </div>
  );
}

function SearchResults({
  filteredItems,
  className,
}: {
  className?: string;
  filteredItems: PrefixTypeConfig[];
}) {
  return (
    <Virtuoso
      className={className}
      components={{
        EmptyPlaceholder: NoPrefixes,
      }}
      data={filteredItems}
      itemContent={(_index, prefix) => <Row prefix={prefix} />}
    />
  );
}

const Row = React.memo(({ prefix }: { prefix: PrefixTypeConfig }) => {
  const onDeletePrefix = useDeletePrefixCallback(prefix.prefix);
  return (
    <div className="px-3 py-1.5">
      <ListRow className="min-h-12">
        <NamespaceIcon className="text-primary-main size-5 shrink-0" />
        <ListRowContent>
          <ListRowTitle>{prefix.prefix}</ListRowTitle>
          <ListRowSubtitle className="break-all">{prefix.uri}</ListRowSubtitle>
        </ListRowContent>
        <IconButton
          variant="text"
          size="small"
          color="danger"
          icon={<DeleteIcon />}
          onClick={onDeletePrefix}
        />
      </ListRow>
    </div>
  );
});

function NoPrefixes() {
  const [opened, setOpened] = useState(false);
  const config = useConfiguration();

  return (
    <EmptyState>
      <EmptyStateIcon>
        <NamespaceIcon />
      </EmptyStateIcon>
      <EmptyStateContent>
        <EmptyStateTitle>No Namespaces</EmptyStateTitle>
        <EmptyStateDescription>
          No custom namespaces stored
        </EmptyStateDescription>
        <EmptyStateActions>
          <Dialog open={opened} onOpenChange={setOpened}>
            <DialogTrigger asChild>
              <Button>Start creating a new namespace</Button>
            </DialogTrigger>
            <CreateNamespaceModal
              config={config}
              close={() => setOpened(false)}
            />
          </Dialog>
        </EmptyStateActions>
      </EmptyStateContent>
    </EmptyState>
  );
}

function useDeletePrefixCallback(prefix: string) {
  return useRecoilCallback(
    ({ set, snapshot }) =>
      async () => {
        const activeConfigId = await snapshot.getPromise(
          activeConfigurationAtom
        );

        if (!activeConfigId) {
          return;
        }

        set(schemaAtom, prevSchemas => {
          const updatedSchemas = new Map(prevSchemas);
          const activeSchema = updatedSchemas.get(activeConfigId);

          updatedSchemas.set(activeConfigId, {
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
    [prefix]
  );
}

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
        <InputField
          label="Namespace"
          value={form.prefix}
          onChange={onFormChange("prefix")}
          placeholder="Namespace"
          validationState={hasError && !form.prefix ? "invalid" : "valid"}
          errorMessage="Namespace is required"
        />
        <InputField
          className="input-uri"
          label="URI"
          value={form.uri}
          onChange={onFormChange("uri")}
          placeholder="URI"
          validationState={hasError && !form.uri ? "invalid" : "valid"}
          errorMessage="URI is required"
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
