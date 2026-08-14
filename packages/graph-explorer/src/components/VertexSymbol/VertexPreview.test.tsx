// @vitest-environment happy-dom
import { QueryClient } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";

import type { TextTransformer } from "@/hooks";

import {
  appDefaultVertexStyle,
  createVertexType,
  getAppStore,
  type VertexStyle,
} from "@/core";
import { iconRegistry } from "@/core/icons";
import { TestProvider } from "@/utils/testing/renderHookWithJotai";

import { VertexPreview } from "./VertexPreview";

function vertexStyle(overrides?: Partial<VertexStyle>): VertexStyle {
  return {
    ...appDefaultVertexStyle,
    type: createVertexType("Person"),
    ...overrides,
  };
}

function renderPreview(style: VertexStyle, transform?: TextTransformer) {
  render(
    <TestProvider store={getAppStore()} client={new QueryClient()}>
      <VertexPreview vertexStyle={style} transform={transform} />
    </TestProvider>,
  );
}

/**
 * The symbol resolves its icon asynchronously, so let that settle before
 * asserting — otherwise the update lands outside `act`.
 */
async function settleIcon() {
  await waitFor(() => expect(iconRegistry.pendingCount).toBe(0));
}

describe("VertexPreview", () => {
  it("labels the type and a placeholder for the id-derived name", async () => {
    renderPreview(vertexStyle({ displayNameAttribute: "~id" }));
    await settleIcon();

    expect(screen.getByText("Person")).toBeInTheDocument();
    expect(screen.getByText("<id>")).toBeInTheDocument();
  });

  it("uses the display type override and names a data attribute as a placeholder", async () => {
    renderPreview(
      vertexStyle({
        type: createVertexType("http://x/Person"),
        displayLabel: "Human",
        displayNameAttribute: "name",
      }),
    );
    await settleIcon();

    expect(screen.getByText("Human")).toBeInTheDocument();
    expect(screen.getByText("<name>")).toBeInTheDocument();
    // The symbol renders its own accessible name from the vertex style.
    expect(
      screen.getByRole("img", { name: "Human symbol" }),
    ).toBeInTheDocument();
  });

  it("leaves the type untransformed by default", async () => {
    renderPreview(vertexStyle({ type: createVertexType("http://x/Person") }));
    await settleIcon();

    expect(screen.getByText("http://x/Person")).toBeInTheDocument();
  });

  it("applies a provided transform to the type and placeholder", async () => {
    renderPreview(
      vertexStyle({
        type: createVertexType("http://x/Person"),
        displayNameAttribute: "http://x/name",
      }),
      text => text.replace("http://x/", "x:"),
    );
    await settleIcon();

    expect(screen.getByText("x:Person")).toBeInTheDocument();
    expect(screen.getByText("<x:name>")).toBeInTheDocument();
  });
});
