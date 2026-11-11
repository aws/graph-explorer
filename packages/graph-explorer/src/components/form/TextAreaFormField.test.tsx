// @vitest-environment happy-dom
import { revalidateLogic } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vite-plus/test";
import { z } from "zod";

import { useAppForm } from "./useAppForm";

const nameSchema = z.object({ name: z.string().min(1, "Enter a name") });

function NameForm({
  hideLabel,
  description,
}: {
  hideLabel?: boolean;
  description?: string;
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
          <field.TextAreaFormField
            label="Name"
            hideLabel={hideLabel}
            description={description}
          />
        )}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}

describe("TextAreaFormField", () => {
  test("names the text area by its label", () => {
    render(<NameForm />);

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  test("names the text area by a hidden label", () => {
    render(<NameForm hideLabel />);

    expect(screen.getByRole("textbox", { name: "Name" })).toBeInTheDocument();
  });

  test("shows no error before the first submit", async () => {
    const user = userEvent.setup();
    render(<NameForm />);

    const textbox = screen.getByRole("textbox", { name: "Name" });
    await user.type(textbox, "a");
    await user.clear(textbox);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(textbox).toHaveAttribute("aria-invalid", "false");
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
  });

  test("updates the error on change after the first submit", async () => {
    const user = userEvent.setup();
    render(<NameForm />);
    await user.click(screen.getByRole("button", { name: "Save" }));
    await screen.findByRole("alert");

    const textbox = screen.getByRole("textbox", { name: "Name" });
    await user.type(textbox, "a");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

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
});
