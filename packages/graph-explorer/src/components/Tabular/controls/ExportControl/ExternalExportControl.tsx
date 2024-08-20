import { css, cx } from "@emotion/css";
import { saveAs } from "file-saver";
import { useCallback, useState } from "react";
import { useLayer } from "react-laag";
import { Row } from "react-table";

import Button from "@/components/Button";
import Card from "@/components/Card";
import Checkbox from "@/components/Checkbox";
import IconButton from "@/components/IconButton";

import { TrayArrowIcon } from "@/components/icons";
import Input from "@/components/Input";
import Select from "@/components/Select";
import { TabularInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";
import defaultStyles from "./ExportControl.styles";
import transformToCsv from "./transfomerToCsv";
import transformToJson from "./transfomerToJson";
import { toCsvFileData, toJsonFileData } from "@/utils/fileData";

const rootStyles = () => css`
  position: relative;
  display: flex;
  align-items: center;
`;

type ExportControlProps<T extends Record<string, unknown>> = {
  className?: string;
  omittedColumnsIds?: string[];
  instance: TabularInstance<T>;
};

export function ExternalExportControl<T extends Record<string, unknown>>({
  className,
  omittedColumnsIds,
  instance,
}: ExportControlProps<T>) {
  const [isContentVisible, setIsContentVisible] = useState(false);

  const { renderLayer, triggerProps, layerProps } = useLayer({
    isOpen: isContentVisible,
    onOutsideClick: () => {
      setIsContentVisible(false);
    },
    onDisappear: () => {
      setIsContentVisible(false);
    },
    overflowContainer: true,
    auto: true,
    placement: "bottom-end",
    triggerOffset: 4,
  });

  return (
    <div id="export-control" className={rootStyles()}>
      <IconButton
        variant={"text"}
        size={"base"}
        icon={<TrayArrowIcon />}
        onPress={() => setIsContentVisible(visible => !visible)}
        {...triggerProps}
      />
      {renderLayer(
        <div {...layerProps} className={cx(defaultStyles(), className)}>
          {isContentVisible && (
            <ExportOptionsModal
              instance={instance}
              omittedColumnsIds={omittedColumnsIds}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ExportOptionsModal<T extends Record<string, unknown>>({
  instance,
  omittedColumnsIds,
}: ExportControlProps<T>) {
  const { rows, data, page, columns, columnOrder, visibleColumns } = instance;
  const [format, setFormat] = useState("csv");
  const [name, setName] = useState<string>("");
  const [options, setOptions] = useState<Record<string, boolean>>({});
  const [selectedColumns, setSelectedColumns] = useState(
    columnOrder.reduce<Record<string, boolean>>((init, col) => {
      init[col] = !omittedColumnsIds?.includes(col) && visibleColumns[col];
      return init;
    }, {})
  );

  const onExport = useCallback(() => {
    let currentDataSource: readonly T[] | Row<T>[] = data;

    // Rows are filtered data
    if (options["include-filters"]) {
      currentDataSource = rows;
    }

    // Page contains only the visible page
    if (options["only-page"]) {
      currentDataSource = page;
    }

    const exportName = name || `export-${new Date().getTime()}`;
    const exportableColumns = columns.filter(column =>
      omittedColumnsIds ? !omittedColumnsIds.includes(column.instance.id) : true
    );
    if (format === "csv") {
      const csvData = transformToCsv(
        currentDataSource,
        selectedColumns,
        exportableColumns
      );

      const fileToSave = toCsvFileData(csvData);
      saveAs(fileToSave, `${exportName.replace(/\.csv$/i, "")}.${format}`);

      return;
    }

    const jsonData = transformToJson(
      currentDataSource,
      selectedColumns,
      exportableColumns
    );

    const fileToSave = toJsonFileData(jsonData);
    saveAs(fileToSave, `${exportName.replace(/\.json$/i, "")}.${format}`);
  }, [
    data,
    options,
    name,
    format,
    columns,
    selectedColumns,
    rows,
    page,
    omittedColumnsIds,
  ]);

  return (
    <Card className={"card"}>
      <div className={"title"}>Export columns</div>
      <div className={"columns-container"}>
        {columnOrder.map(columnId =>
          omittedColumnsIds?.includes(columnId) ||
          !visibleColumns[columnId] ? null : (
            <Checkbox
              aria-label={`choose ${columnId}`}
              key={columnId}
              isSelected={selectedColumns[columnId]}
              onChange={isSelected => {
                setSelectedColumns(prev => ({
                  ...prev,
                  [columnId]: isSelected,
                }));
              }}
            >
              {columns.find(colDef => colDef.instance.id === columnId)
                ?.definition?.label || columnId}
            </Checkbox>
          )
        )}
      </div>
      <div className={"title"}>Options</div>
      <Checkbox
        aria-label={`Keep filtering and sorting`}
        isSelected={options["include-filters"]}
        onChange={isSelected => {
          setOptions(prev => ({
            ...prev,
            "include-filters": isSelected,
          }));
        }}
      >
        Keep filtering and sorting
      </Checkbox>
      <Checkbox
        aria-label={`Only current page`}
        isSelected={options["only-page"]}
        onChange={isSelected => {
          setOptions(prev => ({
            ...prev,
            "only-page": isSelected,
          }));
        }}
      >
        Only current page
      </Checkbox>
      <div className={"title"}>Format</div>
      <Select
        value={format}
        onChange={f => setFormat(f as string)}
        options={[
          {
            label: "CSV",
            value: "csv",
          },
          { label: "JSON", value: "json" },
        ]}
      />
      <div className={"title"}>Save as</div>
      <Input
        aria-label={"Export name"}
        value={name}
        placeholder={`export-${new Date().getTime()}.${format}`}
        onChange={setName}
      />
      <div className={"actions"}>
        <Button variant={"filled"} onPress={onExport}>
          Export
        </Button>
      </div>
    </Card>
  );
}
