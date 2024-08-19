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
