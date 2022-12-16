import { css, cx } from "@emotion/css";
import { saveAs } from "file-saver";
import { useCallback, useEffect, useState } from "react";
import { useLayer } from "react-laag";
import { Row } from "react-table";

import { withClassNamePrefix } from "../../../../core";
import Button from "../../../Button";
import Card from "../../../Card";
import Checkbox from "../../../Checkbox";
import IconButton from "../../../IconButton";

import { TrayArrowIcon } from "../../../icons";
import Input from "../../../Input";
import Select from "../../../Select";
import { TabularInstance } from "../../helpers/tableInstanceToTabularInstance";
import defaultStyles from "./ExportControl.styles";
import transformToCsv from "./transfomerToCsv";
import transformToJson from "./transfomerToJson";

const rootStyles = () => css`
  position: relative;
  display: flex;
  align-items: center;
`;

type ExportControlProps<T extends object> = {
  classNamePrefix?: string;
  className?: string;
  omittedColumnsIds?: string[];
  instance: TabularInstance<T>;
};

export const ExternalExportControl = <T extends object>({
  classNamePrefix = "ft",
  className,
  omittedColumnsIds,
  instance,
}: ExportControlProps<T>) => {
  const pfx = withClassNamePrefix(classNamePrefix);
  const { rows, data, page, columns, columnOrder, visibleColumns } = instance;
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [format, setFormat] = useState("csv");
  const [name, setName] = useState<string>("");
  const [options, setOptions] = useState<Record<string, boolean>>({});
  const [selectedColumns, setSelectedColumns] = useState(
    columnOrder.reduce<Record<string, boolean>>((init, col) => {
      init[col] = !omittedColumnsIds?.includes(col) && visibleColumns[col];
      return init;
    }, {})
  );

  useEffect(() => {
    setSelectedColumns(
      columnOrder.reduce<Record<string, boolean>>((init, col) => {
        init[col] = !omittedColumnsIds?.includes(col) && visibleColumns[col];
        return init;
      }, {})
    );
    // if columns changes, it should be recomputed from scratch
  }, [columns, columnOrder, omittedColumnsIds, visibleColumns]);

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
      const fileToSave = new Blob([csvData], {
        type: "text/csv;charset=UTF-8",
      });

      saveAs(fileToSave, `${exportName.replace(/\.csv$/i, "")}.${format}`);
      return;
    }

    const jsonData = transformToJson(
      currentDataSource,
      selectedColumns,
      exportableColumns
    );
    const fileToSave = new Blob([JSON.stringify(jsonData)], {
      type: "application/json",
    });

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
        <div
          {...layerProps}
          className={cx(defaultStyles(classNamePrefix), className)}
        >
          {isContentVisible && (
            <Card className={pfx("card")}>
              <div className={pfx("title")}>Export columns</div>
              <div className={pfx("columns-container")}>
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
              <div className={pfx("title")}>Options</div>
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
              <div className={pfx("title")}>Format</div>
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
              <div className={pfx("title")}>Save as</div>
              <Input
                aria-label={"Export name"}
                value={name}
                placeholder={`export-${new Date().getTime()}.${format}`}
                onChange={setName}
              />
              <div className={pfx("actions")}>
                <Button variant={"filled"} onPress={onExport}>
                  Export
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default ExternalExportControl;
