import { Modal } from "@mantine/core";
import { useCallback, useMemo, useState } from "react";
import { useRecoilCallback } from "recoil";
import {
  AddIcon,
  Button,
  DeleteIcon,
  IconButton,
  Input,
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
  PrefixTypeConfig,
  useConfiguration,
} from "@/core";
import { schemaAtom } from "@/core/StateProvider/schema";
import { Virtuoso } from "react-virtuoso";
import React from "react";

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
        EmptyPlaceholder: NoSearchResults,
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
          color="error"
          icon={<DeleteIcon />}
          onClick={onDeletePrefix}
        />
      </ListRow>
    </div>
  );
});

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
    onClose();
  }, [form.prefix, form.uri, onClose, onSave]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered={true}
      title="Create a new Namespace"
    >
      <div>
        <Input
          label="Namespace"
          value={form.prefix}
          onChange={onFormChange("prefix")}
          placeholder="Namespace"
          validationState={hasError && !form.prefix ? "invalid" : "valid"}
          errorMessage="Namespace is required"
        />
        <Input
          className="input-uri"
          label="URI"
          value={form.uri}
          onChange={onFormChange("uri")}
          placeholder="URI"
          validationState={hasError && !form.uri ? "invalid" : "valid"}
          errorMessage="URI is required"
        />
      </div>
      <div className="flex flex-row justify-end border-t pt-4">
        <Button icon={<SaveIcon />} variant="filled" onPress={onSubmit}>
          Save
        </Button>
      </div>
    </Modal>
  );
}

export default UserPrefixes;
