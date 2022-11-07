import { useCallback } from "react";
import { Vertex } from "../@types/entities";
import { useConfiguration } from "../core";
import useTextTransform from "./useTextTransform";

const useDisplayNames = () => {
  const config = useConfiguration();
  const textTransform = useTextTransform();

  return useCallback(
    (vertex: Vertex) => {
      const vtConfig = config?.getVertexTypeConfig(vertex.data.__v_type);

      let name = textTransform(vertex.data.id);
      let longName = vertex.data.__v_types.map(textTransform).join(", ");

      if (!vtConfig) {
        return {
          name,
          longName,
        };
      }

      const attrs = vertex.data.attributes;
      const {
        displayNameAttribute: __name,
        longDisplayNameAttribute: __longName,
      } = vtConfig;

      if (__name && attrs[__name]) {
        name = String(attrs[__name]);
      }
      if (__name && vertex.data[__name] && __name === "__v_id") {
        name = vertex.data.__v_id;
      }
      if (vtConfig?.displayLabel && __name === "__v_types") {
        name = vtConfig?.displayLabel;
      }

      if (__longName && vertex.data.attributes[__longName]) {
        longName = String(vertex.data.attributes[__longName]);
      }
      if (__longName && __longName === "__v_id") {
        longName = textTransform(vertex.data.__v_id);
      }
      if (vtConfig?.displayLabel && __longName === "__v_types") {
        longName = vtConfig?.displayLabel;
      }

      return {
        name,
        longName,
      };
    },
    [config, textTransform]
  );
};

export default useDisplayNames;
