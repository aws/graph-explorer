import { useEffect } from "react";

const isDescendant = (element: HTMLElement, parentId: string | string[]) => {
  const lookUpIds = Array.isArray(parentId) ? parentId : [parentId];
  if (lookUpIds.includes(element.id)) {
    return true;
  }

  for (const pId of lookUpIds) {
    const parent = document.getElementById(pId);
    if (parent?.contains(element)) return true;
  }

  return false;
};

interface UseOnClickOutsideProps {
  ref: React.RefObject<HTMLElement>;
  onClickOutside: (e: MouseEvent) => void;
  id: string | string[];
  disabledEvents?: string[];
}

/*  Fires onClickOutside when mouse down in the document.
 *  Ref is needed to remove the listener when the component we are attaching to this is unmounted
 *  Id is needed to prevent fire onClickOutside when click inside the element
 */
const useOnClickOutside = ({
  ref,
  onClickOutside,
  id,
  disabledEvents = [],
}: UseOnClickOutsideProps) => {
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        disabledEvents.includes(e.type) ||
        isDescendant(e.target as HTMLElement, id)
      ) {
        return null;
      }

      onClickOutside(e);
    };
    document.addEventListener("mousedown", handleClickOutside);
    // "pointerup and pointerdown" are registered by react-aria.
    // It's needed to capture the event fired by useButton and useToggleButton
    document.addEventListener("pointerup", handleClickOutside);
    document.addEventListener("pointerdown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("pointerup", handleClickOutside);
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [ref, id, onClickOutside, disabledEvents]);
};

export default useOnClickOutside;
