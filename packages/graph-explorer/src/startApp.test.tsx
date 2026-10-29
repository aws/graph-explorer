// @vitest-environment happy-dom

import { act, within } from "@testing-library/react";
import localforage from "localforage";
import { describe, expect, test, vi } from "vite-plus/test";

import { startApp } from "./startApp";

const renderedLimits = vi.hoisted(() => new Array<number>());

vi.mock("./App", async () => {
  const { useAtomValue } = await import("jotai");
  const { defaultNeighborExpansionLimitAtom } =
    await import("./core/StateProvider/storageAtoms");

  return {
    default: function App() {
      const limit = useAtomValue(defaultNeighborExpansionLimitAtom);
      renderedLimits.push(limit);
      return <p>Neighbor limit {limit}</p>;
    },
  };
});

function createContainer() {
  return document.body.appendChild(document.createElement("div"));
}

describe("startApp", () => {
  test("renders the app with the stored values once persisted state loads", async () => {
    await localforage.setItem("defaultNeighborExpansionLimit", 42);
    const readStoredValue = localforage.getItem.bind(localforage);
    let releaseLoad!: () => void;
    const loadReleased = new Promise<void>(resolve => {
      releaseLoad = resolve;
    });
    vi.spyOn(localforage, "getItem").mockImplementation(async key => {
      await loadReleased;
      return readStoredValue(key);
    });
    const container = createContainer();

    let started!: Promise<void>;
    await act(() => {
      started = startApp(container);
      return Promise.resolve();
    });

    expect(container).toBeEmptyDOMElement();
    expect(renderedLimits).toEqual([]);

    releaseLoad();
    await act(() => started);

    expect(within(container).getByText("Neighbor limit 42")).toBeVisible();
    expect(renderedLimits).not.toContain(10);
  });

  test("shows the app error page when persisted state fails to load", async () => {
    vi.spyOn(localforage, "getItem").mockRejectedValue(
      new DOMException("The database connection was lost.", "UnknownError"),
    );
    const container = createContainer();

    await act(() => startApp(container));

    const page = within(container);
    expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
    expect(
      page.getByRole("button", { name: "Reload Graph Explorer" }),
    ).toBeVisible();
    expect(page.queryByText(/Neighbor limit/)).toBeNull();
  });
});
