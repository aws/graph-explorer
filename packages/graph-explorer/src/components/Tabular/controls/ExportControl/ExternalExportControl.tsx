import { saveAs } from "file-saver";
import { useCallback, useState } from "react";
import { Row } from "react-table";

import { Button, Input, Select } from "@/components";
import { Checkbox, Label } from "@/components/radix";
import { IconButton } from "@/components";

import { TrayArrowIcon } from "@/components/icons";
import { TabularInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

import transformToCsv from "./transfomerToCsv";
import transformToJson from "./transfomerToJson";
import { toCsvFileData, toJsonFileData } from "@/utils/fileData";
import { Popover, PopoverContent, PopoverTrigger } from "@/components";

type ExportControlProps<T extends Record<string, unknown>> = {
  omittedColumnsIds?: string[];
  instance: TabularInstance<T>;
};

export function ExternalExportControl<T extends Record<string, unknown>>({
  omittedColumnsIds,
  instance,
}: ExportControlProps<T>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <IconButton variant="text" icon={<TrayArrowIcon />} />
      </PopoverTrigger>
      <PopoverContent side="right">
        <ExportOptionsModal
          instance={instance}
          omittedColumnsIds={omittedColumnsIds}
        />
      </PopoverContent>
    </Popover>
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
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <div className="text-base font-medium">Export columns</div>
        <div className="flex flex-col gap-2">
          {columnOrder.map(columnId =>
            omittedColumnsIds?.includes(columnId) ||
            !visibleColumns[columnId] ? null : (
              <Label key={columnId}>
                <Checkbox
                  aria-label={`choose ${columnId}`}
                  checked={selectedColumns[columnId]}
                  onCheckedChange={isSelected => {
                    setSelectedColumns(prev => ({
                      ...prev,
                      [columnId]: Boolean(isSelected),
                    }));
                  }}
                />
                {columns.find(colDef => colDef.instance.id === columnId)
                  ?.definition?.label || columnId}
              </Label>
            )
          )}
        </div>
      </div>
      <div className="space-y-3">
        <div className="text-base font-medium">Options</div>
        <div className="flex flex-col gap-2">
          <Label>
            <Checkbox
              aria-label={`Keep filtering and sorting`}
              checked={options["include-filters"]}
              onCheckedChange={isSelected => {
                setOptions(prev => ({
                  ...prev,
                  "include-filters": Boolean(isSelected),
                }));
              }}
            />
            Keep filtering and sorting
          </Label>
          <Label>
            <Checkbox
              aria-label={`Only current page`}
              checked={options["only-page"]}
              onCheckedChange={isSelected => {
                setOptions(prev => ({
                  ...prev,
                  "only-page": Boolean(isSelected),
                }));
              }}
            />
            Only current page
          </Label>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Format</Label>
        <Select
          value={format}
          onChange={f => setFormat(f as string)}
          noMargin
          options={[
            {
              label: "CSV",
              value: "csv",
            },
            { label: "JSON", value: "json" },
          ]}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="exportName">Save as</Label>
        <Input
          name="exportName"
          aria-label={"Export name"}
          value={name}
          placeholder={`export-${new Date().getTime()}.${format}`}
          onChange={setName}
          noMargin
        />
      </div>
      <div className="">
        <Button variant="filled" onPress={onExport} className="w-full">
          Export
        </Button>
      </div>
    </div>
  );
}
