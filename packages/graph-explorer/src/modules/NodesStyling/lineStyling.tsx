import { PropsWithChildren } from "react";
import {
  LineDashed,
  LineDotted,
  LineSolid,
  SelectOption,
} from "../../components";

const Wrapper = ({ children }: PropsWithChildren<any>) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      justifyContent: "space-between",
      width: "100%",
    }}
  >
    {children}
  </div>
);

export const LINE_STYLE_OPTIONS: SelectOption[] = [
  {
    label: "Solid",
    value: "solid",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <LineSolid />
      </Wrapper>
    ),
  },
  {
    label: "Dashed",
    value: "dashed",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <LineDashed />
      </Wrapper>
    ),
  },
  {
    label: "Dotted",
    value: "dotted",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <LineDotted />
      </Wrapper>
    ),
  },
];
