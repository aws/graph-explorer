import { saveAs } from "file-saver";

export function toJsonFileData(input: object) {
  return new Blob([JSON.stringify(input)], {
    type: "application/json",
  });
}

export function toCsvFileData(input: string) {
  return new Blob([input], {
    type: "text/csv;charset=UTF-8",
  });
}

export async function fromFileToJson(blob: Blob) {
  const textContents = await blob.text();
  return JSON.parse(textContents) as unknown;
}

/**
 * Saves a file using the native file save dialog if possible.
 *
 * If the browser does not support the native file save dialog, it will fall back
 * to using the `file-saver` library.
 */
export async function saveFile(file: Blob, defaultFileName: string) {
  if (!("showSaveFilePicker" in window)) {
    saveAs(file, defaultFileName);
  }

  const fileHandle = await window.showSaveFilePicker({
    suggestedName: defaultFileName,
    types: [
      {
        description: "JSON",
        accept: { "application/json": [".json"] },
      },
    ],
  });

  const writable = await fileHandle.createWritable();
  await writable.write(file);
  await writable.close();
}
