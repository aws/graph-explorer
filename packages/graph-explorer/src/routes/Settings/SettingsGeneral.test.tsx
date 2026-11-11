// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { describe, expect, test } from "vite-plus/test";

import { defaultNeighborExpansionLimitAtom, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { TestProvider } from "@/utils/testing";

import SettingsGeneral from "./SettingsGeneral";

const message = "Enter a whole number greater than 0";

function renderSettings() {
  const store = getAppStore();
  render(
    <TestProvider client={createQueryClient()} store={store}>
      <SettingsGeneral />
    </TestProvider>,
  );
  return store;
}

function limitInput() {
  return screen.getByRole("spinbutton", {
    name: "Default neighbor expansion limit",
  });
}

async function enterLimit(user: UserEvent, value: string) {
  await user.clear(limitInput());
  if (value) {
    await user.type(limitInput(), value);
  }
}

const commits: [string, (user: UserEvent) => Promise<void>][] = [
  ["blur", user => user.tab()],
  ["Enter", user => user.keyboard("{Enter}")],
];

describe("SettingsGeneral > default neighbor expansion limit", () => {
  test.each(commits)(
    "saves a whole number greater than 0 on %s",
    async (_, commit) => {
      const user = userEvent.setup();
      const store = renderSettings();

      await enterLimit(user, "25");
      await commit(user);

      expect(store.get(defaultNeighborExpansionLimitAtom)).toBe(25);
      expect(screen.queryByText(message)).toBeNull();
    },
  );

  test("saves nothing and shows no message before the value is committed", async () => {
    const user = userEvent.setup();
    const store = renderSettings();

    await enterLimit(user, "25");

    expect(store.get(defaultNeighborExpansionLimitAtom)).toBe(10);
    expect(screen.queryByText(message)).toBeNull();
  });

  test("shows no message when the field is cleared before a commit", async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.clear(limitInput());

    expect(screen.queryByText(message)).toBeNull();
    expect(limitInput()).not.toHaveAttribute("aria-invalid", "true");
  });

  describe.each(commits)("on %s", (_, commit) => {
    test.each(["", "0", "-1", "1.5"])(
      "keeps the saved limit and shows the message for %j",
      async value => {
        const user = userEvent.setup();
        const store = renderSettings();

        await enterLimit(user, value);
        await commit(user);

        expect(screen.getByText(message)).toBeInTheDocument();
        expect(limitInput()).toHaveAttribute("aria-invalid", "true");
        expect(store.get(defaultNeighborExpansionLimitAtom)).toBe(10);
      },
    );
  });

  test("clears the message as soon as a whole number greater than 0 is typed, and saves it on commit", async () => {
    const user = userEvent.setup();
    const store = renderSettings();

    await enterLimit(user, "0");
    await user.tab();
    expect(screen.getByText(message)).toBeInTheDocument();

    await enterLimit(user, "7");
    expect(screen.queryByText(message)).toBeNull();
    expect(store.get(defaultNeighborExpansionLimitAtom)).toBe(10);

    await user.tab();

    expect(screen.queryByText(message)).toBeNull();
    expect(store.get(defaultNeighborExpansionLimitAtom)).toBe(7);
  });
});
