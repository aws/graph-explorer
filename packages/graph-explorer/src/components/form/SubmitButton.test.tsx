// @vitest-environment happy-dom
import { revalidateLogic } from "@tanstack/react-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vite-plus/test";
import { z } from "zod";

import { useAppForm } from "./useAppForm";

const nameSchema = z.object({ name: z.string().min(1, "Enter a name") });

type NameFormValue = z.infer<typeof nameSchema>;

function NameForm({
  onSubmit,
}: {
  onSubmit: (value: NameFormValue) => Promise<void> | void;
}) {
  const form = useAppForm({
    defaultValues: { name: "" },
    validationLogic: revalidateLogic(),
    validators: { onDynamic: nameSchema },
    onSubmit: async ({ value }) => onSubmit(nameSchema.parse(value)),
  });

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="name">
        {field => <field.TextAreaFormField label="Name" />}
      </form.AppField>
      <form.AppForm>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.AppForm>
    </form>
  );
}

describe("SubmitButton", () => {
  test("submits the form's value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<NameForm onSubmit={onSubmit} />);

    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Ada" });
  });

  test("is unavailable while the form submits", async () => {
    const user = userEvent.setup();
    let finishSubmit = () => {};
    const submission = new Promise<void>(resolve => {
      finishSubmit = resolve;
    });
    render(<NameForm onSubmit={() => submission} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");

    const button = screen.getByRole("button", { name: "Save" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-disabled", "true");

    finishSubmit();
    await vi.waitFor(() =>
      expect(button).toHaveAttribute("aria-disabled", "false"),
    );
  });

  test("is unavailable after a failed submit until the value is valid", async () => {
    const user = userEvent.setup();
    render(<NameForm onSubmit={() => {}} />);

    const button = screen.getByRole("button", { name: "Save" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-disabled", "true");

    await user.type(screen.getByRole("textbox", { name: "Name" }), "a");
    expect(button).toHaveAttribute("aria-disabled", "false");
  });

  test("stays focusable while the form submits", async () => {
    const user = userEvent.setup();
    render(<NameForm onSubmit={() => new Promise(() => {})} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");

    const button = screen.getByRole("button", { name: "Save" });
    await user.click(button);
    expect(button).toHaveAttribute("aria-disabled", "true");

    await user.click(screen.getByRole("textbox", { name: "Name" }));
    await user.tab();
    expect(button).toHaveFocus();
  });

  test("ignores repeat clicks while the form submits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => new Promise<void>(() => {}));
    render(<NameForm onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox", { name: "Name" }), "Ada");

    const button = screen.getByRole("button", { name: "Save" });
    await user.click(button);
    await user.click(button);

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
