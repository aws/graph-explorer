import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import type { DisplayVertex, EntityProperties } from "@/core";

import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  InputField,
  Label,
  Switch,
} from "@/components";
import { getDisplayValueForScalar } from "@/connector/entities";
import { useUpdateVertexProperties } from "@/hooks";
import { RESERVED_ID_PROPERTY } from "@/utils/constants";

const formSchema = z.object({
  properties: z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean()]),
  ),
});

type FormData = z.infer<typeof formSchema>;

export type EditVertexPropertiesDialogProps = {
  vertex: DisplayVertex;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * A dialog for editing the scalar properties of a vertex. String, number, and
 * boolean properties are editable; the `~id` system property is omitted and
 * `Date` properties are shown read-only (editing them is not yet supported).
 */
export function EditVertexPropertiesDialog({
  vertex,
  open,
  onOpenChange,
}: EditVertexPropertiesDialogProps) {
  const { updateVertexProperties, isPending } = useUpdateVertexProperties();

  const attributes = vertex.original.attributes;
  const labelByName = new Map(
    vertex.attributes.map(attr => [attr.name, attr.displayLabel]),
  );

  const editableEntries = Object.entries(attributes).filter(
    ([name, value]) =>
      name !== RESERVED_ID_PROPERTY && !(value instanceof Date),
  );
  const readOnlyDateEntries = Object.entries(attributes).filter(
    ([, value]) => value instanceof Date,
  );

  const form = useForm({
    resolver: standardSchemaResolver(formSchema),
    defaultValues: {
      properties: Object.fromEntries(editableEntries) as FormData["properties"],
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await updateVertexProperties({
        vertexId: vertex.id,
        properties: data.properties as EntityProperties,
      });
      onOpenChange(false);
    } catch {
      // The error toast is handled inside the mutation hook.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Properties — {vertex.displayName}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form
            id="edit-vertex-properties-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {editableEntries.map(([name, value]) => {
              const label = labelByName.get(name) ?? name;

              if (typeof value === "boolean") {
                return (
                  <Controller
                    key={name}
                    control={form.control}
                    name={`properties.${name}`}
                    render={({ field }) => (
                      <div className="flex items-center justify-between">
                        <Label>{label}</Label>
                        <Switch
                          checked={Boolean(field.value)}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                );
              }

              if (typeof value === "number") {
                return (
                  <Controller
                    key={name}
                    control={form.control}
                    name={`properties.${name}`}
                    render={({ field }) => (
                      <InputField
                        type="number"
                        label={label}
                        value={Number(field.value)}
                        onChange={(next: number | null) =>
                          field.onChange(next ?? 0)
                        }
                      />
                    )}
                  />
                );
              }

              return (
                <Controller
                  key={name}
                  control={form.control}
                  name={`properties.${name}`}
                  render={({ field }) => (
                    <InputField
                      label={label}
                      value={String(field.value ?? "")}
                      onChange={field.onChange}
                    />
                  )}
                />
              );
            })}

            {readOnlyDateEntries.map(([name, value]) => (
              <InputField
                key={name}
                label={labelByName.get(name) ?? name}
                value={getDisplayValueForScalar(value)}
                isDisabled
              />
            ))}
          </form>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="edit-vertex-properties-form"
            disabled={isPending}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default EditVertexPropertiesDialog;
