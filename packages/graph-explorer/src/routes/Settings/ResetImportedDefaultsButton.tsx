import { useSetAtom } from "jotai";
import { Trash2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from "@/components";
import {
  importedEdgeStylesAtom,
  importedVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

export default function ResetImportedDefaultsButton() {
  const setImportedVertexStyles = useSetAtom(importedVertexStylesAtom);
  const setImportedEdgeStyles = useSetAtom(importedEdgeStylesAtom);

  function resetImportedDefaults() {
    setImportedVertexStyles(new Map());
    setImportedEdgeStyles(new Map());
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger" className="min-w-28">
          <Trash2Icon />
          Reset Imported Defaults
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-subtle text-danger">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Reset Imported Defaults</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              This will remove all imported default styles. Your custom styles
              will remain. You can re-import a file at any time.
            </span>
            <span className="mbs-4 block">This cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="primary-danger"
            onClick={resetImportedDefaults}
          >
            Reset Imported Defaults
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
