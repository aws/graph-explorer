import {
  CONDITION_OPERATOR_LABELS,
  CONDITION_OPERATORS,
  type ConditionOperator,
  type StyleCondition,
} from "@/core/StateProvider/graphStyles";

import { Field, FieldLabel } from "./Field";
import { Input } from "./Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";

export type AttributeOption = { label: string; value: string };

type ConditionBuilderProps = {
  condition: StyleCondition;
  attributeOptions: AttributeOption[];
  onChange: (condition: StyleCondition) => void;
};

/** The condition applied to a fresh conditional style: the first available attribute, an equals test, and an empty value. */
export function createDefaultCondition(
  attributeOptions: AttributeOption[],
): StyleCondition {
  return {
    attribute: attributeOptions[0]?.value ?? "",
    operator: "=",
    value: "",
  };
}

/**
 * Builds a single styling condition — an attribute, a comparison operator, and
 * a value to compare against. Entity-agnostic: the caller supplies the
 * attribute options (vertex or edge) and receives the updated condition.
 */
export function ConditionBuilder({
  condition,
  attributeOptions,
  onChange,
}: ConditionBuilderProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Field>
        <FieldLabel>Attribute</FieldLabel>
        <Select
          value={condition.attribute}
          onValueChange={value => onChange({ ...condition, attribute: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose attribute" />
          </SelectTrigger>
          <SelectContent>
            {attributeOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Operator</FieldLabel>
        <Select
          value={condition.operator}
          onValueChange={value =>
            onChange({ ...condition, operator: value as ConditionOperator })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose operator" />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_OPERATORS.map(operator => (
              <SelectItem key={operator} value={operator}>
                {CONDITION_OPERATOR_LABELS[operator]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel>Value</FieldLabel>
        <Input
          value={condition.value}
          onChange={event =>
            onChange({ ...condition, value: event.target.value })
          }
        />
      </Field>
    </div>
  );
}
