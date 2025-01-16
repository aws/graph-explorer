import { Modal } from "@mantine/core";
import { useCallback, useState } from "react";
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
  const config = useConfiguration();
  const items =
    config?.schema?.prefixes?.filter(
      prefixConfig => prefixConfig.__inferred !== true
    ) ?? [];
  const [opened, setOpened] = useState(false);

  return (
    <div className="flex grow flex-col">
      {items.length === 0 && <EmptyState onCreate={() => setOpened(true)} />}
      {items.length > 0 && <SearchablePrefixes items={items} />}
      {items.length > 0 && (
        <PanelFooter className="flex flex-row justify-end">
          <Button
            icon={<AddIcon />}
            variant="filled"
            onPress={() => setOpened(true)}
          >
            Create
          </Button>
        </PanelFooter>
      )}
      <EditPrefixModal opened={opened} onClose={() => setOpened(false)} />
    </div>
  );
};

function SearchablePrefixes({ items }: { items: PrefixTypeConfig[] }) {
  const { filteredItems, search, setSearch } = useSearchItems(
    items,
    config => `${config.prefix} ${config.uri}`
  );

  return (
    <>
      <div className="w-full px-3 py-2">
        <SearchBar
          search={search}
          searchPlaceholder="Search for Namespaces or URIs"
          onSearch={setSearch}
        />
      </div>
      {filteredItems.length <= 0 ? (
        <PanelEmptyState title="No Namespaces" />
      ) : null}
      {filteredItems.length > 0 ? (
        <Virtuoso
          className="h-full grow"
          data={filteredItems}
          itemContent={(_index, prefix) => <Row prefix={prefix} />}
        />
      ) : null}
    </>
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

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <PanelEmptyState
      title="No Namespaces"
      subtitle="No Custom Namespaces stored"
      icon={<NamespaceIcon />}
      actionLabel="Start creating a new namespace"
      onAction={() => onCreate()}
      actionVariant="text"
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
