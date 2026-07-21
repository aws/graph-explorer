// @vitest-environment happy-dom
import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";

import {
  appDefaultVertexStyle,
  createVertexType,
  getAppStore,
  type VertexStyle,
} from "@/core";
import { TestProvider } from "@/utils/testing/renderHookWithJotai";

import { VertexPreview } from "./VertexPreview";

function vertexStyle(overrides?: Partial<VertexStyle>): VertexStyle {
  return {
    ...appDefaultVertexStyle,
    type: createVertexType("Person"),
    ...overrides,
  };
}

describe("VertexPreview", () => {
  it("renders the provided label rather than deriving one from the vertex type", () => {
    render(
      <TestProvider store={getAppStore()} client={new QueryClient()}>
        <VertexPreview
          vertexStyle={vertexStyle({
            type: createVertexType("http://x/Person"),
          })}
          label="foaf:Person"
        />
      </TestProvider>,
    );

    expect(screen.getByText("foaf:Person")).toBeInTheDocument();
    // The symbol renders its own accessible name from the vertex style.
    expect(
      screen.getByRole("img", { name: "http://x/Person symbol" }),
    ).toBeInTheDocument();
  });
});
