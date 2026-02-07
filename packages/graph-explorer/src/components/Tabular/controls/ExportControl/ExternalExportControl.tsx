import { saveAs } from "file-saver";
import { useState } from "react";

import type { TabularInstance } from "@/components/Tabular/helpers/tableInstanceToTabularInstance";

import {
  Button,
  Checkbox,
  IconButton,
  InputField,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SelectField,
} from "@/components";
import { TrayArrowIcon } from "@/components/icons";
import { toCsvFileData, toJsonFileData } from "@/utils/fileData";

import { transformToCsv } from "./transformToCsv";
import { transformToJson } from "./transformToJson";

const EXCLUDED_COLUMN_IDS = ["__send_to_explorer"];

type ExportControlProps<T extends Record<string, unknown>> = {
  instance: TabularInstance<T>;
  hideOptions?: boolean;
  forceOnlyPage?: boolean;
};

export function ExternalExportControl<T extends Record<string, unknown>>({
  instance,
  hideOptions,
  forceOnlyPage,
}: ExportControlProps<T>) {
  const [opened, setOpened] = useState(false);

  return (
    <Popover open={opened} onOpenChange={open => setOpened(open)}>
      <PopoverTrigger asChild>
        <IconButton
          variant="text"
          icon={<TrayArrowIcon />}
          tooltipText="Export table"
        />
      </PopoverTrigger>
      <PopoverContent side="right" className="w-72">
        <ExportOptionsModal
          instance={instance}
          onClose={() => setOpened(false)}
          forceOnlyPage={forceOnlyPage}
          hideOptions={hideOptions}
        />
      </PopoverContent>
    </Popover>
  );
}

function ExportOptionsModal<T extends Record<string, unknown>>({
  instance,
  onClose,
  forceOnlyPage = false,
  hideOptions = false,
}: ExportControlProps<T> & {
  onClose: () => void;
}) {
  const { rows, data, page, columns, columnOrder, visibleColumns } = instance;
  const [format, setFormat] = useState("csv");
  const [name, setName] = useState<string>("");
  const [options, setOptions] = useState<Record<string, boolean>>(
    forceOnlyPage ? { "only-page": true } : {},
  );

  const exportableColumnOrder = columnOrder.filter(
    col => !EXCLUDED_COLUMN_IDS.includes(col),
  );

  const [selectedColumns, setSelectedColumns] = useState(
    exportableColumnOrder.reduce<Record<string, boolean>>((init, col) => {
      init[col] = visibleColumns[col];
      return init;
    }, {}),
  );

  const onExport = () => {
    // Filter down to only the columns that are selected
    const columnsToExport = Object.entries(selectedColumns)
      .filter(([, isSelected]) => isSelected)
      .map(([id]) => columns.find(c => c.instance.id === id))
      .filter(c => c != null);

    // Map the data from the rows, if needed
    const dataToExport = (() => {
      // Rows are filtered data
      if (options["include-filters"]) {
        return rows.map(r => r.original);
      }

      // Page contains only the visible page
      if (options["only-page"]) {
        return page.map(r => r.original);
      }

      // Unfiltered data
      return data;
    })();

    const exportName = name || `export-${new Date().getTime()}`;

    if (format === "csv") {
      const csvData = transformToCsv(dataToExport, columnsToExport);
      const fileToSave = toCsvFileData(csvData);
      saveAs(fileToSave, `${exportName.replace(/\.csv$/i, "")}.${format}`);
    } else if (format === "json") {
      const jsonData = transformToJson(dataToExport, columnsToExport);
      const fileToSave = toJsonFileData(jsonData);
      saveAs(fileToSave, `${exportName.replace(/\.json$/i, "")}.${format}`);
    }

    // Closes the popover
    onClose();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <div className="text-base font-medium">Export columns</div>
        <div className="flex flex-col gap-2">
          {exportableColumnOrder.map(columnId =>
            !visibleColumns[columnId] ? null : (
              <Label key={columnId} className="text-text-primary">
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
            ),
          )}
        </div>
      </div>
      {hideOptions ? null : (
        <div className="space-y-3">
          <div className="text-base font-medium">Options</div>
          <div className="flex flex-col gap-2">
            <Label className="text-text-primary">
              <Checkbox
                aria-label="Keep filtering and sorting"
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
            {forceOnlyPage ? null : (
              <Label className="text-text-primary">
                <Checkbox
                  aria-label="Only current page"
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
            )}
          </div>
        </div>
      )}
      <div className="space-y-1">
        <Label>Format</Label>
        <SelectField
          value={format}
          onValueChange={setFormat}
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
        <InputField
          name="exportName"
          aria-label="Export name"
          value={name}
          placeholder={`export-${new Date().getTime()}.${format}`}
          onChange={setName}
        />
      </div>
      <div className="">
        <Button variant="filled" onClick={onExport} className="w-full">
          Export
        </Button>
      </div>
    </div>
  );
}
