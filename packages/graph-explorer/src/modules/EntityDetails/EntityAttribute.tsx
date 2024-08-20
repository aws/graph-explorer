import { AttributeConfig } from "@/core";
import useTextTransform from "@/hooks/useTextTransform";
import { formatDate } from "@/utils";

export type EntityAttributeProps = {
  value: Date | string | number;
  attribute: AttributeConfig;
};

const EntityAttribute = ({ value, attribute }: EntityAttributeProps) => {
  const textTransform = useTextTransform();

  return (
    <div key={attribute.name} className={"attribute"}>
      <div>
        <div className={"attribute-name"}>
          <div>{attribute.displayLabel || textTransform(attribute.name)}</div>
        </div>
        {value == null && <div className={"attribute-value"}>---</div>}
        {!["Date", "g:Date"].includes(attribute.dataType || "") && value && (
          <div className={"attribute-value"}>{String(value)}</div>
        )}
        {["Date", "g:Date"].includes(attribute.dataType || "") && value && (
          <div className={"attribute-value"}>{formatDate(new Date(value))}</div>
        )}
      </div>
    </div>
  );
};

export default EntityAttribute;
