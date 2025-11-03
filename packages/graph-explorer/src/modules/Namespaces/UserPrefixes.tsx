import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/Dialog";
import { useCallback, useState } from "react";
import {
  AddIcon,
  Button,
  DeleteIcon,
  IconButton,
  InputField,
  ListRow,
  ListRowContent,
  ListRowSubtitle,
  ListRowTitle,
  NamespaceIcon,
  PanelEmptyState,
  PanelFooter,
  SaveIcon,
  SearchBar,
  useSearchItems,
} from "@/components";
import {
  activeConfigurationAtom,
  type PrefixTypeConfig,
  useConfiguration,
} from "@/core";
import { schemaAtom } from "@/core/StateProvider/schema";
import { Virtuoso } from "react-virtuoso";
import { useAtomCallback } from "jotai/utils";
import { Dialog as RadixDialog } from "radix-ui";

const DialogDescription = RadixDialog.Description;

type PrefixForm = {
  prefix: string;
  uri: string;
};

const UserPrefixes = () => {
  const items = useCustomPrefixes();
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex h-full grow flex-col">
      {items.length > 0 ? (
        <SearchablePrefixes items={items} onOpen={() => setOpened(true)} />
      ) : (
        <EmptyState onCreate={() => setOpened(true)} />
      )}
      <EditPrefixModal opened={opened} onClose={() => setOpened(false)} />
    </div>
  );
};

function useCustomPrefixes() {
  const config = useConfiguration();
  return (config?.schema?.prefixes || []).filter(
    prefixConfig => prefixConfig.__inferred !== true
  );
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
        EmptyPlaceholder: NoSearchResults,
      }}
      data={filteredItems}
      itemContent={(_index, prefix) => <Row prefix={prefix} />}
    />
  );
}

function Row({ prefix }: { prefix: PrefixTypeConfig }) {
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
}

function NoSearchResults() {
  return (
    <PanelEmptyState
      className="p-6"
      title="No Namespaces Found"
      subtitle="No custom namespaces found matching your search"
      icon={<NamespaceIcon />}
    />
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <PanelEmptyState
      className="p-6"
      title="No Namespaces"
      subtitle="No custom namespaces stored"
      icon={<NamespaceIcon />}
      actionLabel="Create a new namespace"
      onAction={onCreate}
    />
  );
}

function useDeletePrefixCallback(prefix: string) {
  return useAtomCallback(
    useCallback(
      async (get, set) => {
        const activeConfigId = get(activeConfigurationAtom);

        if (!activeConfigId) {
          return;
        }

        await set(schemaAtom, async prevSchemas => {
          const updatedSchemas = new Map(await prevSchemas);
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
    )
  );
}

function EditPrefixModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const config = useConfiguration();

  const [hasError, setError] = useState(false);
  const [form, setForm] = useState<PrefixForm>({
    prefix: "",
    uri: "",
  });

  const onFormChange = (attribute: "prefix" | "uri") => (value: string) => {
    setForm(prev => ({
      ...prev,
      [attribute]: value,
    }));
  };

  const configId = config?.id;
  const onSave = useAtomCallback(
    useCallback(
      async (_get, set, prefix: string, uri: string) => {
        if (!configId) {
          return;
        }

        await set(schemaAtom, async prevSchemas => {
          const updatedSchemas = new Map(await prevSchemas);
          const activeSchema = updatedSchemas.get(configId);

          updatedSchemas.set(configId, {
            ...(activeSchema || {}),
            vertices: activeSchema?.vertices || [],
            edges: activeSchema?.edges || [],
            prefixes: [...(activeSchema?.prefixes || []), { prefix, uri }],
          });

          return updatedSchemas;
        });
      },
      [configId]
    )
  );

  const onSubmit = () => {
    if (!form.prefix || !form.uri) {
      setError(true);
      return;
    }

    onSave(form.prefix, form.uri);
    setForm({ prefix: "", uri: "" });
    setError(false);
    onClose();
  };

  return (
    <Dialog open={opened} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Namespace</DialogTitle>
          <DialogDescription>Create a new SPARQL namespace</DialogDescription>
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
        <DialogFooter>
          <Button icon={<SaveIcon />} variant="filled" onPress={onSubmit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default UserPrefixes;
