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
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

export default function ResetStylesButton() {
  const setUserVertexStyles = useSetAtom(userVertexStylesAtom);
  const setUserEdgeStyles = useSetAtom(userEdgeStylesAtom);

  function resetStyles() {
    setUserVertexStyles(new Map());
    setUserEdgeStyles(new Map());
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger" className="min-w-28">
          <Trash2Icon />
          Reset
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-subtle text-danger-foreground">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              This will clear all your node and edge styles, returning
              everything to the defaults. Consider saving first.
            </span>
            <span className="mbs-4 block">This cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="primary-danger" onClick={resetStyles}>
            Reset to Defaults
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
