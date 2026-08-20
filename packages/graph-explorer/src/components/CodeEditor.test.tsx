// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react";

import { CodeEditor } from "./CodeEditor";

vi.mock("@monaco-editor/react", () => {
  const mockDefineTheme = vi.fn();
  return {
    Editor: vi.fn(({ theme }) => {
      return (
        <div data-testid="monaco-editor" data-theme={theme}>
          Mock Editor
        </div>
      );
    }),
    loader: {
      init: vi.fn(() =>
        Promise.resolve({
          editor: {
            defineTheme: mockDefineTheme,
          },
        }),
      ),
    },
  };
});

describe("CodeEditor", () => {
  test("should render with graph-explorer-light theme", () => {
    render(<CodeEditor defaultLanguage="json" value="{}" />);

    const editor = screen.getByTestId("monaco-editor");
    expect(editor).toHaveAttribute("data-theme", "graph-explorer-light");
  });

  test("should render CodeEditor component", () => {
    render(<CodeEditor defaultLanguage="json" value="test content" />);

    const editor = screen.getByTestId("monaco-editor");
    expect(editor).toBeInTheDocument();
  });
});
