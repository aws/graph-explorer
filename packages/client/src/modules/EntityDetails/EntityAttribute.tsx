import clone from "lodash/clone";
import { useCallback, useMemo } from "react";
import { useSetRecoilState } from "recoil";
import { Vertex } from "../../@types/entities";
import Select from "../../components/Select/Select";
import { AttributeConfig, withClassNamePrefix } from "../../core";
import useConfiguration from "../../core/ConfigurationProvider/useConfiguration";
import {
  userStylingAtom,
  VertexPreferences,
} from "../../core/StateProvider/userPreferences";
import useTextTransform from "../../hooks/useTextTransform";
import formatDate from "../../utils/formatDate";

export type EntityAttributeProps = {
  classNamePrefix?: string;
  enableDisplayAs?: boolean;
  vertex: Vertex;
  value: Date | string | number;
  attribute: AttributeConfig;
};

const EntityAttribute = ({
  classNamePrefix = "ft",
  enableDisplayAs = false,
  vertex,
  value,
  attribute,
}: EntityAttributeProps) => {
  const config = useConfiguration();
  const pfx = withClassNamePrefix(classNamePrefix);

  const textTransform = useTextTransform();
  const setUserStyling = useSetRecoilState(userStylingAtom);

  const vertexConfig = useMemo(() => {
    return config?.getVertexTypeConfig(vertex.data.__v_type);
  }, [config, vertex.data.__v_type]);

  const onDisplayAsChange = useCallback(
    (displayValue: string | string[]) => {
      const isLabel = Array.isArray(displayValue)
        ? displayValue.includes("label")
        : displayValue === "label";
      const isDesc = Array.isArray(displayValue)
        ? displayValue.includes("desc")
        : displayValue === "desc";

      setUserStyling(prevStyling => {
        const vtItem =
          clone(
            prevStyling.vertices?.find(v => v.type === vertex.data.__v_type)
          ) || ({} as VertexPreferences);

        if (isLabel) {
          vtItem.displayNameAttribute = attribute.name;
        }

        if (isDesc) {
          vtItem.longDisplayNameAttribute = attribute.name;
        }

        return {
          ...prevStyling,
          vertices: [
            ...(prevStyling.vertices || []).filter(
              v => v.type !== vertex.data.__v_type
            ),
            {
              ...(vtItem || {}),
              type: vertex.data.__v_type,
            },
          ],
        };
      });
    },
    [attribute.name, setUserStyling, vertex.data.__v_type]
  );

  const isLabel = vertexConfig?.displayNameAttribute === attribute.name;
  const isDescription =
    vertexConfig?.longDisplayNameAttribute === attribute.name;
  const displayValue =
    isLabel && isDescription
      ? ["label", "desc"]
      : isLabel
      ? ["label"]
      : isDescription
      ? ["desc"]
      : undefined;

  return (
    <div key={attribute.name} className={pfx("attribute")}>
      <div>
        <div className={pfx("attribute-name")}>
          <div>{textTransform(attribute.displayLabel || attribute.name)}</div>
          {enableDisplayAs && (
            <Select
              selectionMode={"multiple"}
              className={pfx("attribute-select")}
              aria-label={"Display Attribute as"}
              placeholder={"Display as... "}
              hideError={true}
              options={[
                { label: "Display Name", value: "label" },
                {
                  label: "Display Desc",
                  value: "desc",
                },
              ]}
              value={displayValue}
              onChange={onDisplayAsChange}
            />
          )}
        </div>
        {value == null && <div className={pfx("attribute-value")}>---</div>}
        {!["Date", "g:Date"].includes(attribute.dataType || "") && value && (
          <div className={pfx("attribute-value")}>{String(value)}</div>
        )}
        {["Date", "g:Date"].includes(attribute.dataType || "") && value && (
          <div className={pfx("attribute-value")}>
            {formatDate(new Date(value))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntityAttribute;
