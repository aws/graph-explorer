import { AttributeConfig, withClassNamePrefix } from "../../core";
import useTextTransform from "../../hooks/useTextTransform";
import { formatDate } from "../../utils";

export type EntityAttributeProps = {
  classNamePrefix?: string;
  value: Date | string | number;
  attribute: AttributeConfig;
};

const EntityAttribute = ({
  classNamePrefix = "ft",
  value,
  attribute,
}: EntityAttributeProps) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const textTransform = useTextTransform();

  return (
    <div key={attribute.name} className={pfx("attribute")}>
      <div>
        <div className={pfx("attribute-name")}>
          <div>{attribute.displayLabel || textTransform(attribute.name)}</div>
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
