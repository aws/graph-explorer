import useTranslations from "./useTranslations";

export function useFormattedEntityCounts(
  vertexCount: number,
  edgeCount: number,
) {
  const format = useEntityCountFormatterCallback();
  return format(vertexCount, edgeCount);
}

export function useEntityCountFormatterCallback() {
  const t = useTranslations();

  const format = (vertexCount: number, edgeCount: number) => {
    const nodeMessage =
      vertexCount === 0
        ? null
        : `${vertexCount.toLocaleString()} ${vertexCount === 1 ? t("node") : t("nodes")}`.toLocaleLowerCase();
    const edgeMessage =
      edgeCount === 0
        ? null
        : `${edgeCount.toLocaleString()} ${edgeCount === 1 ? t("edge") : t("edges")}`.toLocaleLowerCase();

    return [nodeMessage, edgeMessage]
      .filter(message => message != null)
      .join(" and ");
  };
  return format;
}
