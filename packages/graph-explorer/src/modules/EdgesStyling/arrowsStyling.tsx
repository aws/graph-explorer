import { PropsWithChildren } from "react";
import {
  ArrowCircle,
  ArrowDiamond,
  ArrowNone,
  ArrowSquare,
  ArrowTee,
  ArrowTriangle,
  ArrowTriangleBackCurve,
  ArrowTriangleCircle,
  ArrowTriangleCross,
  ArrowTriangleTee,
  ArrowVee,
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
      minWidth: "100%",
    }}
  >
    {children}
  </div>
);

export const SOURCE_ARROW_STYLE_OPTIONS: SelectOption[] = [
  {
    label: "Triangle",
    value: "triangle",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangle style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Triangle Tee",
    value: "triangle-tee",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangleTee style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Triangle Circle",
    value: "circle-triangle",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangleCircle style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Triangle Cross",
    value: "triangle-cross",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangleCross style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Triangle Backcurve",
    value: "triangle-backcurve",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangleBackCurve style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Tee",
    value: "tee",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTee style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Vee",
    value: "vee",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowVee style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Square",
    value: "square",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowSquare style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Circle",
    value: "circle",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowCircle style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "Diamond",
    value: "diamond",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowDiamond style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
  {
    label: "None",
    value: "none",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowNone style={{ transform: "rotate(180deg)" }} />
      </Wrapper>
    ),
  },
];

export const TARGET_ARROW_STYLE_OPTIONS: SelectOption[] = [
  {
    label: "Triangle",
    value: "triangle",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangle />
      </Wrapper>
    ),
  },
  {
    label: "Triangle Tee",
    value: "triangle-tee",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangleTee />
      </Wrapper>
    ),
  },
  {
    label: "Triangle Circle",
    value: "circle-triangle",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangleCircle />
      </Wrapper>
    ),
  },
  {
    label: "Triangle Cross",
    value: "triangle-cross",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangleCross />
      </Wrapper>
    ),
  },
  {
    label: "Triangle Backcurve",
    value: "triangle-backcurve",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTriangleBackCurve />
      </Wrapper>
    ),
  },
  {
    label: "Tee",
    value: "tee",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowTee />
      </Wrapper>
    ),
  },
  {
    label: "Vee",
    value: "vee",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowVee />
      </Wrapper>
    ),
  },
  {
    label: "Square",
    value: "square",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowSquare />
      </Wrapper>
    ),
  },
  {
    label: "Circle",
    value: "circle",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowCircle />
      </Wrapper>
    ),
  },
  {
    label: "Diamond",
    value: "diamond",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowDiamond />
      </Wrapper>
    ),
  },
  {
    label: "None",
    value: "none",
    render: ({ label }) => (
      <Wrapper>
        {label}
        <ArrowNone />
      </Wrapper>
    ),
  },
];
