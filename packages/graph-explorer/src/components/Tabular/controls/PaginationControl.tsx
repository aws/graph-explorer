import { css, cx } from "@emotion/css";

import { FunctionComponent, useEffect, useMemo, useState } from "react";
import Button from "../../Button";
import HumanReadableNumberFormatter from "../../HumanReadableNumberFormatter";
import IconButton from "../../IconButton";
import {
  BackwardIcon,
  ForwardIcon,
  SkipBackwardIcon,
  SkipForwardIcon,
} from "../../icons";
import Select from "../../Select";
import { useTabularControl } from "../TabularControlsProvider";

export type PaginationControlProps = {
  className?: string;
  totalRows: number;
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

export const PaginationControl: FunctionComponent<PaginationControlProps> = ({
  className,
  totalRows,
}) => {
  const {
    instance: {
      disablePagination,
      canPreviousPage,
      canNextPage,
      pageOptions,
      pageCount,
      gotoPage,
      nextPage,
      previousPage,
      setPageSize,
      pageIndex,
      pageSize,
    },
  } = useTabularControl();

  const [inputValue, setInputValue] = useState<number | null>(pageIndex + 1);

  useEffect(() => {
    if (inputValue === null) {
      return;
    }

    gotoPage(inputValue - 1);
  }, [gotoPage, inputValue]);

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
  if (disablePagination) {
    return null;
  }
  return (
    <div className={cx(defaultStyles(), className)}>
      {totalRows > 0 && (
        <div className={"pagination-totals"}>
          Displaying {pageRange} of{" "}
          <HumanReadableNumberFormatter value={totalRows} /> results
        </div>
      )}
      {totalRows === 0 && <div className={"pagination-totals"}>No results</div>}
      {totalRows > 0 && (
        <div className={"pagination-controls"}>
          <Select
            label="Page size:"
            labelPlacement="left"
            className={"page-options-menu"}
            options={pageOptions.map(pageOption => ({
              label: pageOption.toString(),
              value: pageOption.toString(),
            }))}
            noMargin
            hideError
            value={pageSize.toString()}
            onChange={value => setPageSize(parseInt(value as string))}
          />
          <IconButton
            isDisabled={!canPreviousPage}
            variant={"text"}
            size={"small"}
            className={cx("page-button", "page-control")}
            icon={<SkipBackwardIcon />}
            onPress={() => gotoPage(0)}
          />
          <IconButton
            isDisabled={!canPreviousPage}
            variant={"text"}
            size={"small"}
            className={cx("page-button", "page-control")}
            icon={<BackwardIcon />}
            onPress={previousPage}
          />
          <div className={"page-viz"}>
            {pagesToRender.map(page => {
              return (
                <Button
                  key={page}
                  className={"page-button"}
                  variant={
                    pageIndex === parseInt(page) - 1 ? "filled" : "default"
                  }
                  onPress={() => gotoPage(parseInt(page) - 1)}
                  size="small"
                >
                  {page}
                </Button>
              );
            })}
          </div>
          <IconButton
            isDisabled={!canNextPage}
            variant={"text"}
            size={"small"}
            className={cx("page-button", "page-control")}
            icon={<ForwardIcon />}
            onPress={nextPage}
          />
          <IconButton
            isDisabled={!canNextPage}
            variant={"text"}
            className={cx("page-button", "page-control")}
            icon={<SkipForwardIcon />}
            onPress={() => gotoPage(pageCount - 1)}
          />
        </div>
      )}
    </div>
  );
};

export default PaginationControl;
