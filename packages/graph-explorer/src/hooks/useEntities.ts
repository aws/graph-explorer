import { useRecoilState } from "recoil";
import entitiesSelector from "@/core/StateProvider/entitiesSelector";

/** Returns the current set of entities. */
export default function useEntities() {
  return useRecoilState(entitiesSelector);
}
