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

export default function ResetCustomStylesButton() {
  const setUserVertexStyles = useSetAtom(userVertexStylesAtom);
  const setUserEdgeStyles = useSetAtom(userEdgeStylesAtom);

  function resetCustomStyles() {
    setUserVertexStyles(new Map());
    setUserEdgeStyles(new Map());
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="danger" className="min-w-28">
          <Trash2Icon />
          Reset Custom Styles
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-danger-subtle text-danger">
            <Trash2Icon />
          </AlertDialogMedia>
          <AlertDialogTitle>Reset All Custom Styles</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              This will clear all your per-type style customizations. Your
              shared styles will remain. Consider saving first.
            </span>
            <span className="mbs-4 block">This cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="primary-danger"
            onClick={resetCustomStyles}
          >
            Reset Custom Styles
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
