import { DisplayAttribute } from "@/core";

export type EntityAttributeProps = {
  attribute: DisplayAttribute;
};

export default function EntityAttribute({ attribute }: EntityAttributeProps) {
  return (
    <div key={attribute.name} className={"attribute"}>
      <div>
        <div className={"attribute-name"}>
          <div>{attribute.displayLabel}</div>
        </div>
        <div className={"attribute-value"}>{attribute.displayValue}</div>
      </div>
    </div>
  );
}
