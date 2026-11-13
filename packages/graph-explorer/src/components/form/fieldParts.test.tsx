// @vitest-environment happy-dom
import { revalidateLogic } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vite-plus/test";
import { z } from "zod";

import { useAppForm } from "./useAppForm";

const nameSchema = z.object({ name: z.string().min(1, "Enter a name") });

function NameForm({
  hideLabel,
  description,
  inInputGroup,
}: {
  hideLabel?: boolean;
  description?: string;
  inInputGroup?: boolean;
}) {
  const form = useAppForm({
    defaultValues: { name: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: nameSchema },
  });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {field => (
          <field.Wrapper>
            <field.Label className={hideLabel ? "sr-only" : undefined}>
              Name
            </field.Label>
            {inInputGroup ? (
              <field.InputGroup>
                <field.InputGroupTextarea />
                <field.InputGroupAddon align="block-end">
                  <field.InputGroupButton>Go</field.InputGroupButton>
                </field.InputGroupAddon>
              </field.InputGroup>
            ) : (
              <field.TextArea />
            )}
            {description && (
              <field.Description>{description}</field.Description>
            )}
            <field.Error />
          </field.Wrapper>
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}

function UnwrappedForm() {
  const form = useAppForm({ defaultValues: { name: "" } });

  return (
    <form.AppField name="name">
      {field => <field.TextArea aria-label="Name" />}
    </form.AppField>
  );
}

describe("field parts", () => {
  test("names the text area by its label", () => {
    render(<NameForm />);

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  test("names the text area by a hidden label", () => {
    render(<NameForm hideLabel />);

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByText("Name")).toHaveClass("sr-only");
  });

  test("shows no error before the first submit", async () => {
    const user = userEvent.setup();
    render(<NameForm />);

    const textbox = screen.getByRole("textbox", { name: "Name" });
    await user.type(textbox, "a");
    await user.clear(textbox);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(textbox).toHaveAttribute("aria-invalid", "false");
    expect(textbox).not.toHaveAttribute("aria-describedby");
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "false");
  });

  test("shows the schema's error after a failed submit", async () => {
    const user = userEvent.setup();
    render(<NameForm />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a name");
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("group")).toHaveAttribute("data-invalid", "true");
  });

  test("updates the error on change after the first submit", async () => {
    const user = userEvent.setup();
    render(<NameForm />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");

    const textbox = screen.getByRole("textbox", { name: "Name" });
    await user.type(textbox, "a");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(textbox).not.toHaveAttribute("aria-describedby");

    await user.clear(textbox);
    expect(await screen.findByRole("alert")).toHaveTextContent("Enter a name");
  });

  test("is described by the schema's error after a failed submit", async () => {
    const user = userEvent.setup();
    render(<NameForm />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");

    expect(
      screen.getByRole("textbox", { name: "Name" }),
    ).toHaveAccessibleDescription("Enter a name");
  });

  test("is described by its description", () => {
    render(<NameForm description="Shown on your profile" />);

    expect(
      screen.getByRole("textbox", { name: "Name" }),
    ).toHaveAccessibleDescription("Shown on your profile");
  });

  test("is described by its description and the schema's error", async () => {
    const user = userEvent.setup();
    render(<NameForm description="Shown on your profile" />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");

    expect(
      screen.getByRole("textbox", { name: "Name" }),
    ).toHaveAccessibleDescription("Shown on your profile Enter a name");
  });

  test("binds a text area inside an input group, ahead of its addon in tab order", async () => {
    const user = userEvent.setup();
    render(<NameForm inInputGroup />);

    expect(screen.getByRole("button", { name: "Go" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");

    const textbox = screen.getByRole("textbox", { name: "Name" });
    expect(textbox).toHaveAttribute("aria-invalid", "true");
    expect(textbox).toHaveAccessibleDescription("Enter a name");

    await user.click(textbox);
    await user.tab();
    expect(screen.getByRole("button", { name: "Go" })).toHaveFocus();
  });

  test("throws when a bound control is outside field.Wrapper", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<UnwrappedForm />)).toThrow(
      new Error("field.TextArea must be rendered inside field.Wrapper"),
    );
  });
});
