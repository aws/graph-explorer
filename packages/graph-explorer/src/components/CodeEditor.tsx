import { Editor, type Monaco } from "@monaco-editor/react";
import type { ComponentProps } from "react";

export function CodeEditor({
  options,
  ...props
}: ComponentProps<typeof Editor>) {
  return (
    <Editor
      theme="graph-explorer-light"
      options={{
        // Match Tailwind style as much as possible
        fontSize: 14,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        scrollBeyondLastLine: false,
        lineNumbersMinChars: 3,

        // Disable visual ornamentation
        minimap: { enabled: false, ...options?.minimap },
        renderLineHighlight: "none",
        guides: {
          bracketPairs: false,
          indentation: false,
          ...options?.guides,
        },
        stickyScroll: {
          enabled: false,
        },
        lineDecorationsWidth: 0,
        overviewRulerLanes: 0,
        renderWhitespace: "none",
        scrollbar: {
          useShadows: false,
          ...options?.scrollbar,
        },
        hideCursorInOverviewRuler: true,

        // Currently this doesn't work. Hopefully a newer version of Monaco will fix their bug.
        matchBrackets: "never",
        bracketPairColorization: {
          enabled: false,
          ...options?.bracketPairColorization,
        },

        ...options,
      }}
      onMount={(_editor, monaco) => {
        monaco.editor.defineTheme("graph-explorer-light", lightTheme);
      }}
      {...props}
    />
  );
}

type MonacoThemeData = Parameters<Monaco["editor"]["defineTheme"]>[1];

const lightTheme = createMonacoTheme({
  // DEV NOTE: This is currently limited to the colors needed for JSON syntax highlighting.
  foreground: "#1f2937",
  background: "#f9fafb",
  mutedForeground: "#9ca3af",
  keys: "#3730a3",
  strings: "#9f1239",
  numbers: "#065f46",
  keyword: "#065f46",
});

/** Creates a Monaco compatible theme based on a few semantic color tokens */
function createMonacoTheme(options: {
  foreground: string;
  background: string;
  mutedForeground: string;
  keys: string;
  strings: string;
  numbers: string;
  keyword: string;
}): MonacoThemeData {
  return {
    base: "vs",
    inherit: true,
    rules: [
      // Values
      { token: "string.key.json", foreground: options.keys },
      { token: "string.value.json", foreground: options.strings },
      { token: "string.json", foreground: options.strings },
      { token: "number.json", foreground: options.numbers },
      { token: "number.float.json", foreground: options.numbers },
      { token: "keyword.json", foreground: options.keyword },

      // Delimiters
      { token: "delimiter.comma.json", foreground: options.foreground },
      { token: "delimiter.colon.json", foreground: options.foreground },
      { token: "delimiter.bracket.json", foreground: options.foreground },
      { token: "delimiter.array.json", foreground: options.foreground },
      { token: "delimiter.curly.json", foreground: options.foreground },

      // Comments
      { token: "comment.json", foreground: options.mutedForeground },
      { token: "comment.block.json", foreground: options.mutedForeground },
      { token: "comment.line.json", foreground: options.mutedForeground },
    ],
    colors: {
      foreground: options.foreground,
      "editor.foreground": options.foreground,
      "editor.background": options.background,
      "editorLineNumber.foreground": options.mutedForeground,
      "editorLineNumber.activeForeground": options.foreground,
      "editorBracketHighlight.foreground1": options.foreground,
      "editorBracketHighlight.foreground2": options.foreground,
      "editorBracketHighlight.foreground3": options.foreground,
      "editorBracketHighlight.foreground4": options.foreground,
      "editorBracketHighlight.foreground5": options.foreground,
      "editorBracketHighlight.foreground6": options.foreground,
      "scrollbarSlider.background": options.mutedForeground + "44",
      "scrollbarSlider.hoverBackground": options.mutedForeground + "88",
      "scrollbarSlider.activeBackground": options.mutedForeground + "88",
      "editorGutter.foldingControlForeground": options.mutedForeground,
    },
  };
}
