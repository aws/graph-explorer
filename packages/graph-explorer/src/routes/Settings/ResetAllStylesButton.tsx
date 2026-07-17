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
  sharedEdgeStylesAtom,
  sharedVertexStylesAtom,
  userEdgeStylesAtom,
  userVertexStylesAtom,
} from "@/core/StateProvider/storageAtoms";

export default function ResetAllStylesButton() {
  const setUserVertexStyles = useSetAtom(userVertexStylesAtom);
  const setUserEdgeStyles = useSetAtom(userEdgeStylesAtom);
  const setSharedVertexStyles = useSetAtom(sharedVertexStylesAtom);
  const setSharedEdgeStyles = useSetAtom(sharedEdgeStylesAtom);

  function resetAllStyles() {
    setUserVertexStyles(new Map());
    setUserEdgeStyles(new Map());
    setSharedVertexStyles(new Map());
    setSharedEdgeStyles(new Map());
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger" className="min-w-28">
          <Trash2Icon />
          Reset All Styles
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-subtle text-danger-foreground">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Reset All Styles</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              This will clear all your styles and all shared styles, returning
              everything to defaults. Consider saving first.
            </span>
            <span className="mbs-4 block">This cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="primary-danger" onClick={resetAllStyles}>
            Reset All Styles
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
