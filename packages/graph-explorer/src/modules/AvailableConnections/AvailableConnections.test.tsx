// @vitest-environment happy-dom
import { createRandomName } from "@shared/utils/testing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";

import { TooltipProvider } from "@/components";
import {
  activeConfigurationAtom,
  configurationAtom,
  getAppStore,
} from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { DbState, TestProvider } from "@/utils/testing";

import AvailableConnections from "./AvailableConnections";

function renderAvailableConnections(state: DbState) {
  const store = getAppStore();
  state.applyTo(store);

  render(
    <TestProvider client={createQueryClient()} store={store}>
      <TooltipProvider>
        <AvailableConnections isSync={false} />
      </TooltipProvider>
    </TestProvider>,
  );

  return { store, user: userEvent.setup() };
}

describe("AvailableConnections", () => {
  test("renders empty state when there are no connections", () => {
    const store = getAppStore();
    store.set(configurationAtom, new Map());
    const queryClient = createQueryClient();

    render(
      <TestProvider client={queryClient} store={store}>
        <TooltipProvider>
          <AvailableConnections isSync={false} />
        </TooltipProvider>
      </TestProvider>,
    );

    expect(screen.getByText("No Connections")).toBeInTheDocument();
  });

  test("adds a new connection from the dialog and closes it", async () => {
    const state = new DbState();
    const { store, user } = renderAvailableConnections(state);
    const name = createRandomName("Connection");

    await user.click(
      screen.getByRole("button", { name: "Add New Connection" }),
    );
    const dialog = screen.getByRole("dialog");
    const nameField = within(dialog).getByRole("textbox", { name: "Name" });
    await user.clear(nameField);
    await user.type(nameField, name);
    await user.type(
      within(dialog).getByRole("textbox", { name: "Database URL" }),
      "https://database.example.com:8182",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Add Connection" }),
    );

    expect(screen.queryByRole("dialog")).toBeNull();
    const newId = store.get(activeConfigurationAtom);
    if (!newId) {
      throw new Error("Expected the new connection to be active");
    }
    expect(store.get(configurationAtom)).toStrictEqual(
      new Map([
        [state.activeConfig.id, state.activeConfig],
        [
          newId,
          {
            id: newId,
            displayLabel: name,
            connection: {
              graphDbUrl: "https://database.example.com:8182",
              queryEngine: "gremlin",
              awsAuthEnabled: false,
              serviceType: "neptune-db",
              awsRegion: "",
              fetchTimeoutMs: undefined,
              nodeExpansionLimit: undefined,
            },
          },
        ],
      ]),
    );
  });

  test("creates nothing when the dialog is cancelled", async () => {
    const state = new DbState();
    const { store, user } = renderAvailableConnections(state);

    await user.click(
      screen.getByRole("button", { name: "Add New Connection" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByRole("textbox", { name: "Database URL" }),
      "https://database.example.com:8182",
    );
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(store.get(configurationAtom)).toStrictEqual(
      new Map([[state.activeConfig.id, state.activeConfig]]),
    );
    expect(store.get(activeConfigurationAtom)).toBe(state.activeConfig.id);
  });
});
