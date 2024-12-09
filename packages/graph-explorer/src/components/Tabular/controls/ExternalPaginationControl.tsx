import { css } from "@emotion/css";
import { cn } from "@/utils";

import { FunctionComponent, useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import HumanReadableNumberFormatter from "@/components/HumanReadableNumberFormatter";
import { IconButton } from "@/components";
import {
  BackwardIcon,
  ForwardIcon,
  SkipBackwardIcon,
  SkipForwardIcon,
} from "@/components/icons";
import Select from "@/components/Select";

export type PaginationControlProps = {
  className?: string;
  totalRows: number;
  pageIndex: number;
  onPageIndexChange(pageIndex: number): void;
  pageSize: number;
  onPageSizeChange(pageSize: number): void;
  pageOptions?: number[];
};

const defaultStyles = () => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  .pagination-totals {
    color: var(--palette-text-disabled, #838383);
  }

  .pagination-controls {
    display: flex;
    justify-content: flex-end;
    align-items: center;

    > * {
      margin: 0 4px;
    }

    > *:last-child {
      margin-right: 0;
    }

    .page-options-menu {
      .select {
        min-width: 30px;
      }
      .input-label {
        width: 75px;
        font-size: 14px;
        margin: 0;
      }
    }

    .page-viz {
      display: flex;
      align-items: center;
      > * {
        margin: 0 4px;
      }
    }

    .page-button {
      font-size: 14px;
      min-width: 24px;
      margin: 0 1px;
      &.page-control {
        > svg {
          width: 24px;
          height: 24px;
        }
        padding: 0;
      }
      &.toggle-button-inactive {
        background-color: transparent;
      }
    }
  }
`;

const DEFAULT_PAGE_OPTIONS = [10, 20, 50];
export const PaginationControl: FunctionComponent<PaginationControlProps> = ({
  className,
  totalRows,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  pageOptions = DEFAULT_PAGE_OPTIONS,
}) => {
  const [inputValue, setInputValue] = useState<number | null>(pageIndex + 1);
  const pageCount = Math.ceil(totalRows / pageSize);

  useEffect(() => {
    if (inputValue === null) {
      return;
    }

    onPageIndexChange(inputValue - 1);
  }, [onPageIndexChange, inputValue]);

  useEffect(() => {
    setInputValue(pageIndex + 1);
  }, [pageIndex]);

  const pagesToRender = useMemo(() => {
    const pages: string[] = [];
    let startIndex = pageIndex - 2;
    let endIndex = pageIndex + 2;

    if (startIndex < 0) {
      const delta = Math.abs(startIndex);
      startIndex = 0;
      endIndex = delta > endIndex ? pageCount - 1 : endIndex + delta;
    }

    if (endIndex > pageCount - 1) {
      const delta = endIndex - pageCount - 1;
      endIndex = pageCount - 1;
      startIndex = delta > startIndex ? 0 : startIndex - delta - 2;
    }

    for (let i = startIndex; i <= endIndex; i++) {
      if (i + 1 > 0) {
        pages.push((i + 1).toString());
      }
    }

    return pages;
  }, [pageIndex, pageCount]);

  const pageRange = useMemo(() => {
    const to = pageIndex * pageSize + pageSize;
    return `${pageIndex * pageSize + 1}-${to < totalRows ? to : totalRows}`;
  }, [pageIndex, pageSize, totalRows]);

  return (
    <div className={cn(defaultStyles(), className)}>
      {totalRows > 0 && (
        <div className="pagination-totals">
          Displaying {pageRange} of{" "}
          <HumanReadableNumberFormatter value={totalRows} /> results
        </div>
      )}
      {totalRows === 0 && <div className="pagination-totals">No results</div>}
      {totalRows > 0 && (
        <div className="pagination-controls">
          <Select
            label="Page size:"
            labelPlacement="left"
            className="page-options-menu"
            options={pageOptions.map(pageOption => ({
              label: pageOption.toString(),
              value: pageOption.toString(),
            }))}
            noMargin
            hideError
            value={pageSize.toString()}
            onChange={value => onPageSizeChange(parseInt(value as string))}
          />
          <IconButton
            disabled={pageIndex - 1 < 0}
            variant="text"
            size="small"
            className={cn("page-button", "page-control")}
            icon={<SkipBackwardIcon />}
            onClick={() => onPageIndexChange(0)}
          />
          <IconButton
            disabled={pageIndex - 1 < 0}
            variant="text"
            size="small"
            className={cn("page-button", "page-control")}
            icon={<BackwardIcon />}
            onClick={() => onPageIndexChange(pageIndex - 1)}
          />
          <div className="page-viz">
            {pagesToRender.map(page => {
              return (
                <Button
                  key={page}
                  className="page-button"
                  variant={
                    pageIndex === parseInt(page) - 1 ? "filled" : "default"
                  }
                  onPress={() => onPageIndexChange(parseInt(page) - 1)}
                  size="small"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <IconButton
            disabled={pageIndex + 1 >= pageCount}
            variant="text"
            size="small"
            className={cn("page-button", "page-control")}
            icon={<ForwardIcon />}
            onClick={() => onPageIndexChange(pageIndex + 1)}
          />
          <IconButton
            disabled={pageIndex + 1 >= pageCount}
            variant="text"
            className={cn("page-button", "page-control")}
            icon={<SkipForwardIcon />}
            onClick={() => onPageIndexChange(pageCount - 1)}
          />
        </div>
      )}
    </div>
  );
};

export default PaginationControl;
