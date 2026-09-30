// @vitest-environment happy-dom

import { render, screen, within } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";

import { Button, TooltipProvider } from "@/components";

import { ConnectionForm } from "./ConnectionForm";
import {
  type ConnectionFormValues,
  createNewConnectionForm,
  mapToConnectionForm,
} from "./connectionFormModel";

const directOption = {
  name: /Connect directly from the browser \(deprecated\)/,
};

/**
 * Renders the form the way a host does, with its submit button outside the
 * form element.
 */
function renderConnectionForm(
  initialValues: ConnectionFormValues = createNewConnectionForm(new Date()),
) {
  const onSubmit = vi.fn<(values: ConnectionFormValues) => void>();
  render(
    <TooltipProvider>
      <ConnectionForm
        id="connection-form"
        initialValues={initialValues}
        onSubmit={onSubmit}
      />
      <Button type="submit" form="connection-form">
        Save
      </Button>
    </TooltipProvider>,
  );
  return { onSubmit, user: userEvent.setup() };
}

/**
 * Presses Enter in a field, then clicks the form's default button as a browser
 * does. user-event only looks for a submit button inside the form, so it
 * misses the host's footer button.
 */
async function pressEnterToSubmit(user: UserEvent, field: HTMLElement) {
  await user.type(field, "{Enter}");
  const defaultButton = Array.from(field.closest("form")?.elements ?? []).find(
    element =>
      element instanceof HTMLButtonElement && element.type === "submit",
  );
  if (!defaultButton) {
    throw new Error("The form has no default button");
  }
  await user.click(defaultButton);
}

/** The advanced settings are behind a disclosure, so their content is unmounted until it opens. */
async function openAdvancedOptions(user: UserEvent) {
  const trigger = screen.getByRole("button", { name: "Advanced options" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  await user.click(trigger);
  expect(trigger).toHaveAttribute("aria-expanded", "true");
}

describe("ConnectionForm", () => {
  test("does not render the removed proxy server controls", () => {
    renderConnectionForm();

    // Proves the queries below fail on absence rather than a wrong name
    expect(
      screen.getByRole("textbox", { name: "Database URL" }),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole("textbox", { name: "Public or Proxy Endpoint" }),
    ).toBeNull();
    expect(
      screen.queryByRole("checkbox", { name: "Using Proxy-Server" }),
    ).toBeNull();
  });

  test("suggests a database URL that includes the port", () => {
    renderConnectionForm();

    // Copying a placeholder without the port produces a connection that
    // fails against the default HTTPS port
    expect(
      screen.getByRole("textbox", { name: "Database URL" }),
    ).toHaveAttribute(
      "placeholder",
      "https://neptune-cluster.amazonaws.com:8182",
    );
  });

  test("offers AWS IAM auth without requiring a proxy server first", () => {
    renderConnectionForm();

    expect(
      screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
    ).toBeInTheDocument();
  });

  test("prefills the fields from the initial values", () => {
    renderConnectionForm(
      mapToConnectionForm("Seeded Graph", {
        graphDbUrl: "https://seed.neptune.amazonaws.com",
      }),
    );

    expect(screen.getByLabelText("Name")).toHaveValue("Seeded Graph");
    expect(screen.getByRole("textbox", { name: "Database URL" })).toHaveValue(
      "https://seed.neptune.amazonaws.com",
    );
  });

  test("submits the normalized values", async () => {
    const { onSubmit, user } = renderConnectionForm();

    const name = screen.getByRole("textbox", { name: "Name" });
    await user.clear(name);
    await user.type(name, "My Connection");
    await user.type(
      screen.getByRole("textbox", { name: "Database URL" }),
      "  https://database.example.com/{Enter}graph  ",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      ...createNewConnectionForm(new Date()),
      name: "My Connection",
      graphDbUrl: "https://database.example.com/graph",
    });
  });

  test("submits when Enter is pressed in a field", async () => {
    const initialValues = mapToConnectionForm("My Connection", {
      graphDbUrl: "https://database.example.com:8182",
    });
    const { onSubmit, user } = renderConnectionForm(initialValues);

    await pressEnterToSubmit(
      user,
      screen.getByRole("textbox", { name: "Name" }),
    );

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith(initialValues);
  });

  test("does not submit when a control inside the form is used", async () => {
    const { onSubmit, user } = renderConnectionForm(
      mapToConnectionForm("My Connection", {
        graphDbUrl: "https://database.example.com:8182",
      }),
    );

    await user.click(
      screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
    );
    await openAdvancedOptions(user);
    await user.click(
      screen.getByRole("checkbox", { name: /Enable Fetch Timeout/ }),
    );
    await user.click(
      within(screen.getByText("Database URL")).getByRole("button"),
    );
    await user.click(screen.getByRole("combobox", { name: "Query Language" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    expect(onSubmit).not.toHaveBeenCalled();
    // The empty region makes the form invalid, so only the absent error proves
    // no submit was attempted.
    expect(screen.queryByText("Region is required")).toBeNull();
  });

  test("shows no errors until the user tries to submit", async () => {
    const { onSubmit, user } = renderConnectionForm(
      mapToConnectionForm("", undefined),
    );

    expect(screen.queryByText("Name is required")).toBeNull();
    expect(screen.queryByText("URL is required")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(screen.getByText("URL is required")).toBeInTheDocument();
  });

  // Neptune Analytics only runs openCypher.
  test("locks the Query Language to openCypher for Neptune Analytics", () => {
    renderConnectionForm(
      mapToConnectionForm("My Connection", {
        graphDbUrl: "https://g.example.com",
        queryEngine: "openCypher",
        awsAuthEnabled: true,
        awsRegion: "us-east-1",
        serviceType: "neptune-graph",
      }),
    );

    const queryLanguage = screen.getByRole("combobox", {
      name: "Query Language",
    });
    expect(queryLanguage).toHaveTextContent("OpenCypher - PG (Property Graph)");
    expect(queryLanguage).toBeDisabled();
  });

  test("requires a region once IAM auth is enabled", async () => {
    const { onSubmit, user } = renderConnectionForm(
      mapToConnectionForm("My Connection", {
        graphDbUrl: "https://database.example.com:8182",
      }),
    );

    await user.click(
      screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Region is required")).toBeInTheDocument();
  });

  test("submits openCypher after choosing Neptune Analytics", async () => {
    const initialValues = mapToConnectionForm("My Connection", {
      graphDbUrl: "https://g.example.com",
    });
    const { onSubmit, user } = renderConnectionForm(initialValues);

    await user.click(
      screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "AWS Region" }),
      "us-east-1",
    );
    await user.click(screen.getByRole("combobox", { name: "Service Type" }));
    await user.click(screen.getByRole("option", { name: "Neptune Analytics" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      ...initialValues,
      awsAuthEnabled: true,
      awsRegion: "us-east-1",
      serviceType: "neptune-graph",
      queryEngine: "openCypher",
    });
  });

  test("rejects a URL that is empty after normalization", async () => {
    const { onSubmit, user } = renderConnectionForm();

    await user.type(
      screen.getByRole("textbox", { name: "Database URL" }),
      "  {Enter}  ",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("URL is required")).toBeInTheDocument();
  });

  describe("deprecated direct connection", () => {
    test("hides the IAM controls when connecting directly", async () => {
      const { user } = renderConnectionForm();

      await user.click(
        screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
      );
      await openAdvancedOptions(user);
      await user.click(screen.getByRole("checkbox", directOption));

      expect(
        screen.queryByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
      ).toBeNull();
      expect(screen.queryByRole("textbox", { name: "AWS Region" })).toBeNull();
    });

    test("rejects a URL without a protocol for a direct connection", async () => {
      const { onSubmit, user } = renderConnectionForm();

      await user.type(
        screen.getByRole("textbox", { name: "Database URL" }),
        "localhost:8182",
      );
      await openAdvancedOptions(user);
      await user.click(screen.getByRole("checkbox", directOption));
      await user.click(screen.getByRole("button", { name: "Save" }));

      expect(onSubmit).not.toHaveBeenCalled();
      expect(
        screen.getByText(
          "A direct connection needs a full URL starting with http:// or https://",
        ),
      ).toBeInTheDocument();
    });

    test("shows an existing direct connection as direct", () => {
      renderConnectionForm(
        mapToConnectionForm("My Connection", {
          graphDbUrl: "https://database.example.com:8182",
          proxyConnection: false,
        }),
      );

      expect(
        screen.getByRole("button", { name: "Advanced options" }),
      ).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByRole("checkbox", directOption)).toBeChecked();
    });

    test("offers IAM auth again when direct is unchecked", async () => {
      const { user } = renderConnectionForm(
        mapToConnectionForm("My Connection", {
          graphDbUrl: "https://database.example.com:8182",
          proxyConnection: false,
        }),
      );

      await user.click(screen.getByRole("checkbox", directOption));

      expect(
        screen.getByRole("checkbox", { name: "AWS IAM Auth Enabled" }),
      ).toBeInTheDocument();
    });

    test("leaves the option unchecked for a proxy connection", async () => {
      const { user } = renderConnectionForm(
        mapToConnectionForm("My Connection", {
          graphDbUrl: "https://database.example.com:8182",
        }),
      );

      await openAdvancedOptions(user);

      expect(screen.getByRole("checkbox", directOption)).not.toBeChecked();
    });
  });

  test("submits a cleared fetch timeout as no value", async () => {
    const initialValues = mapToConnectionForm("My Connection", {
      graphDbUrl: "https://database.example.com:8182",
      fetchTimeoutMs: 30000,
    });
    const { onSubmit, user } = renderConnectionForm(initialValues);

    await user.clear(
      screen.getByRole("spinbutton", { name: "Fetch Timeout (ms)" }),
    );
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledExactlyOnceWith({
      ...initialValues,
      fetchTimeoutMs: undefined,
    });
  });

  test("labels the override field Neighbor Expansion Limit", async () => {
    const { user } = renderConnectionForm();
    await openAdvancedOptions(user);

    await user.click(
      screen.getByRole("checkbox", {
        name: /Override Default Neighbor Expansion Limit/,
      }),
    );

    expect(
      screen.getByRole("spinbutton", { name: "Neighbor Expansion Limit" }),
    ).toBeInTheDocument();
  });

  test("keeps the advanced options collapsed until the user expands them", async () => {
    const { user } = renderConnectionForm();

    expect(
      screen.queryByRole("checkbox", { name: /Enable Fetch Timeout/ }),
    ).not.toBeInTheDocument();

    await openAdvancedOptions(user);

    expect(
      screen.getByRole("checkbox", { name: /Enable Fetch Timeout/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", {
        name: /Override Default Neighbor Expansion Limit/,
      }),
    ).toBeInTheDocument();
  });

  test("opens the advanced options when the connection already overrides one", () => {
    renderConnectionForm(
      mapToConnectionForm("My Connection", {
        graphDbUrl: "https://db.example.com",
        queryEngine: "gremlin",
        fetchTimeoutMs: 30000,
      }),
    );

    expect(
      screen.getByRole("button", { name: "Advanced options" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("checkbox", { name: /Enable Fetch Timeout/ }),
    ).toBeChecked();
  });
});
