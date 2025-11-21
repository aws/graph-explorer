import { Editor, type Monaco } from "@monaco-editor/react";
import type { ComponentProps } from "react";

export function CodeEditor({
  options,
  beforeMount,
  wrapperProps,
  ...props
}: ComponentProps<typeof Editor>) {
  return (
    <Editor
      defaultLanguage="json"
      theme="graph-explorer-light"
      options={{
        readOnly: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        renderLineHighlight: "none",
        matchBrackets: "never",
        bracketPairColorization: {
          enabled: false,
          independentColorPoolPerBracketType: false,
          ...options?.bracketPairColorization,
        },
        padding: {
          top: 7,
          bottom: 7,
          ...options?.padding,
        },
        guides: {
          bracketPairs: false,
          indentation: false,
          ...options?.guides,
        },
        lineDecorationsWidth: 0,
        lineNumbersMinChars: 3,
        overviewRulerLanes: 0,
        renderWhitespace: "none",
        fontSize: 14,
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        hideCursorInOverviewRuler: true,
        ...options,
      }}
      wrapperProps={{ className: "pl-2", ...wrapperProps }}
      beforeMount={monaco => {
        monaco.editor.defineTheme("graph-explorer-light", lightTheme);
        if (beforeMount) {
          beforeMount(monaco);
        }
      }}
      {...props}
    />
  );
}

type ThemeData = Parameters<Monaco["editor"]["defineTheme"]>[1];

const lightTheme = createMonacoTheme({
  foreground: "#1f2937",
  background: "#f9fafb",
  mutedForeground: "#9ca3af",
  keys: "#115e59",
  strings: "#1e40af",
  numbers: "#6b21a8",
  keyword: "#6b21a8",
});

function createMonacoTheme(options: {
  foreground: string;
  background: string;
  mutedForeground: string;
  keys: string;
  strings: string;
  numbers: string;
  keyword: string;
}): ThemeData {
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
