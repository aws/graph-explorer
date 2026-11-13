// @vitest-environment happy-dom
import { useSelector } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vite-plus/test";

import { useAppForm, withForm } from "./useAppForm";

function SubscribedEcho() {
  const form = useAppForm({ defaultValues: { query: "" } });

  return (
    <>
      <form.AppField name="query">
        {field => <field.TextAreaFormField label="Query" />}
      </form.AppField>
      <form.Subscribe selector={state => state.values.query}>
        {query => <output aria-label="Subscribed query">{query}</output>}
      </form.Subscribe>
    </>
  );
}

function StoreEcho() {
  const form = useAppForm({ defaultValues: { query: "" } });
  const query = useSelector(form.store, state => state.values.query);

  return (
    <>
      <form.AppField name="query">
        {field => <field.TextAreaFormField label="Query" />}
      </form.AppField>
      <output aria-label="Stored query">{query}</output>
    </>
  );
}

const NameSection = withForm({
  defaultValues: { name: "" },
  render: function Render({ form }) {
    return (
      <form.AppField name="name">
        {field => <field.TextAreaFormField label="Name" />}
      </form.AppField>
    );
  },
});

function SectionedForm() {
  const form = useAppForm({ defaultValues: { name: "" } });

  return <NameSection form={form} />;
}

describe("useAppForm", () => {
  // The re-render tests below prove nothing unless React Compiler memoizes these components.
  test("compiles the probe components with React Compiler", () => {
    expect(String(SubscribedEcho)).toMatch(/\$\[\d+\]/);
    expect(String(StoreEcho)).toMatch(/\$\[\d+\]/);
  });

  test("re-renders a value read through form.Subscribe", async () => {
    const user = userEvent.setup();
    render(<SubscribedEcho />);

    await user.type(screen.getByRole("textbox", { name: "Query" }), "g.V()");

    expect(
      screen.getByRole("status", { name: "Subscribed query" }),
    ).toHaveTextContent("g.V()");
  });

  test("re-renders a value read through useSelector", async () => {
    const user = userEvent.setup();
    render(<StoreEcho />);

    await user.type(screen.getByRole("textbox", { name: "Query" }), "g.V()");

    expect(
      screen.getByRole("status", { name: "Stored query" }),
    ).toHaveTextContent("g.V()");
  });

  test("renders a section built with withForm", () => {
    render(<SectionedForm />);

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });
});
