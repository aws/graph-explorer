// @vitest-environment happy-dom

import type { EditorProps, Monaco } from "@monaco-editor/react";

import { render } from "@testing-library/react";

import { CodeEditor } from "./CodeEditor";

const { mockDefineTheme, mockEditor, mockMonaco } = vi.hoisted(() => {
  const mockDefineTheme = vi.fn();
  const mockMonaco = { editor: { defineTheme: mockDefineTheme } };

  return {
    mockDefineTheme,
    mockMonaco,
    mockEditor: vi.fn(({ beforeMount }: EditorProps) => {
      beforeMount?.(mockMonaco as Monaco);
      return null;
    }),
  };
});

vi.mock("@monaco-editor/react", () => ({ Editor: mockEditor }));

describe("CodeEditor", () => {
  test("should configure the theme before invoking the caller beforeMount", () => {
    const callerBeforeMount = vi.fn();

    render(<CodeEditor beforeMount={callerBeforeMount} />);

    expect(mockDefineTheme).toHaveBeenCalledWith(
      "graph-explorer-light",
      expect.objectContaining({ base: "vs", inherit: true }),
    );
    expect(callerBeforeMount).toHaveBeenCalledWith(mockMonaco);
    expect(mockDefineTheme).toHaveBeenCalledBefore(callerBeforeMount);
  });

  test("should render the editor with the graph-explorer-light theme", () => {
    render(<CodeEditor defaultLanguage="json" value="{}" />);

    expect(mockEditor.mock.calls[0][0]).toMatchObject({
      theme: "graph-explorer-light",
    });
  });

  test("should disable link detection by default", () => {
    render(<CodeEditor defaultLanguage="json" value="{}" />);

    expect(mockEditor.mock.calls[0][0].options).toMatchObject({
      links: false,
    });
  });

  test("should let a caller opt back in to link detection", () => {
    render(
      <CodeEditor
        defaultLanguage="json"
        value="{}"
        options={{ links: true }}
      />,
    );

    expect(mockEditor.mock.calls[0][0].options).toMatchObject({ links: true });
  });
});
