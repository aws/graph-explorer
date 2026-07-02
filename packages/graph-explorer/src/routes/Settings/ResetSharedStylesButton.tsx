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
} from "@/core/StateProvider/storageAtoms";

export default function ResetSharedStylesButton() {
  const setSharedVertexStyles = useSetAtom(sharedVertexStylesAtom);
  const setSharedEdgeStyles = useSetAtom(sharedEdgeStylesAtom);

  function resetSharedStyles() {
    setSharedVertexStyles(new Map());
    setSharedEdgeStyles(new Map());
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger" className="min-w-28">
          <Trash2Icon />
          Reset Shared Styles
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-subtle text-danger">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Reset Shared Styles</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              This will remove all shared styles. Your styles will remain. You
              can load a file again at any time; consider saving first.
            </span>
            <span className="mbs-4 block">This cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="primary-danger"
            onClick={resetSharedStyles}
          >
            Reset Shared Styles
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
