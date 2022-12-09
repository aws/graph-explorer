import { DefaultValue } from "recoil";

const isDefaultValue = (value: any): value is DefaultValue => {
  return value.__tag === "DefaultValue";
};

export default isDefaultValue;
