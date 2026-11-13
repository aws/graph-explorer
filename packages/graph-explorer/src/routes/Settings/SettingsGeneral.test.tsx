// @vitest-environment happy-dom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

import { defaultNeighborExpansionLimitAtom, getAppStore } from "@/core";
import { createQueryClient } from "@/core/queryClient";
import { stubStorageManager, TestProvider } from "@/utils/testing";

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

const storageHint =
  "Your browser may clear this data when space is low or, in Safari, after a week without use. Save a copy to keep it.";

/**
 * Loads Settings > General from a fresh module graph, so each test starts with
 * no persistent storage request made yet in this page load.
 */
async function loadFreshPage() {
  const [
    { getAppStore },
    { createQueryClient },
    { seedPersistedAtomsWithDefaults },
    { persistThroughQueue, persistenceStatusStore },
    { TestProvider },
    { default: FreshSettingsGeneral },
  ] = await Promise.all([
    import("@/core"),
    import("@/core/queryClient"),
    import("@/core/StateProvider/persistedAtomRegistry"),
    import("@/core/StateProvider/persistence"),
    import("@/utils/testing"),
    import("./SettingsGeneral"),
  ]);
  seedPersistedAtomsWithDefaults();
  const client = createQueryClient();

  function renderSettings() {
    render(
      <TestProvider client={client} store={getAppStore()}>
        <FreshSettingsGeneral />
      </TestProvider>,
    );
  }

  async function waitForPersistenceRequest() {
    await waitFor(() =>
      expect(
        client.getQueryState(["storage", "persistence-request"])?.status,
      ).toBe("success"),
    );
  }

  return {
    renderSettings,
    waitForPersistenceRequest,
    persistThroughQueue,
    persistenceStatusStore,
  };
}

async function renderSettingsInFreshPageLoad() {
  const page = await loadFreshPage();
  page.renderSettings();
  return page;
}

describe("SettingsGeneral > storage persistence hint", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  test("shows the hint when the browser denies persistence", async () => {
    stubStorageManager({
      persist: vi.fn().mockResolvedValue(false),
      persisted: vi.fn().mockResolvedValue(false),
    });
    await renderSettingsInFreshPageLoad();

    expect(await screen.findByText(storageHint)).toBeInTheDocument();
  });

  test("shows the hint when the Storage API is unavailable", async () => {
    stubStorageManager(undefined);
    await renderSettingsInFreshPageLoad();

    expect(await screen.findByText(storageHint)).toBeInTheDocument();
  });

  test("shows the hint when the persistence request fails", async () => {
    stubStorageManager({
      persist: vi.fn(),
      persisted: vi
        .fn()
        .mockRejectedValue(new DOMException("boom", "UnknownError")),
    });
    await renderSettingsInFreshPageLoad();

    expect(await screen.findByText(storageHint)).toBeInTheDocument();
  });

  test("hides the hint when storage is already persistent", async () => {
    stubStorageManager({
      persist: vi.fn(),
      persisted: vi.fn().mockResolvedValue(true),
    });
    const page = await renderSettingsInFreshPageLoad();

    await page.waitForPersistenceRequest();

    expect(screen.queryByText(storageHint)).toBeNull();
  });

  test("hides the hint until the user answers, then reflects a grant", async () => {
    let grant: (granted: boolean) => void = () => {};
    const answer = new Promise<boolean>(resolve => {
      grant = resolve;
    });
    const persist = vi.fn().mockReturnValue(answer);
    stubStorageManager({
      persist,
      persisted: vi.fn().mockResolvedValue(false),
    });
    const page = await renderSettingsInFreshPageLoad();

    await vi.waitFor(() => expect(persist).toHaveBeenCalledOnce());
    expect(screen.queryByText(storageHint)).toBeNull();

    grant(true);
    await page.waitForPersistenceRequest();

    expect(screen.queryByText(storageHint)).toBeNull();
  });

  test("shares the request an earlier write made instead of asking again", async () => {
    const persist = vi.fn().mockResolvedValue(false);
    stubStorageManager({
      persist,
      persisted: vi.fn().mockResolvedValue(false),
    });
    const page = await loadFreshPage();
    page.persistThroughQueue("configuration", () => Promise.resolve());
    await page.persistenceStatusStore.waitForIdle();
    expect(persist).toHaveBeenCalledOnce();

    page.renderSettings();

    expect(await screen.findByText(storageHint)).toBeInTheDocument();
    expect(persist).toHaveBeenCalledOnce();
  });
});
