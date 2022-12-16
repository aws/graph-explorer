import { useEffect } from "react";
import { useSetRecoilState } from "recoil";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import { edgesTypesFilteredAtom } from "../../core/StateProvider/edges";
import { nodesTypesFilteredAtom } from "../../core/StateProvider/nodes";
import equalSet from "../../utils/set/equal";

const useGraphViewerInit = () => {
  const config = useConfiguration();
  const setNodesTypes = useSetRecoilState(nodesTypesFilteredAtom);
  const setEdgesTypes = useSetRecoilState(edgesTypesFilteredAtom);

  useEffect(() => {
    setNodesTypes(prev =>
      equalSet(prev, new Set(config?.vertexTypes ?? []))
        ? prev
        : new Set(config?.vertexTypes ?? [])
    );
    setEdgesTypes(prev =>
      equalSet(prev, new Set(config?.edgeTypes ?? []))
        ? prev
        : new Set(config?.edgeTypes ?? [])
    );
  }, [config?.edgeTypes, config?.vertexTypes, setEdgesTypes, setNodesTypes]);
};

export default useGraphViewerInit;
