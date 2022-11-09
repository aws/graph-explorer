import { css, cx } from "@emotion/css";

import { useEffect, useMemo, useState, VFC } from "react";
import { withClassNamePrefix } from "../../../core";
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

export type PaginationControlProps = {
  classNamePrefix?: string;
  className?: string;
  totalRows: number;
  pageIndex: number;
  onPageIndexChange(pageIndex: number): void;
  pageSize: number;
  onPageSizeChange(pageSize: number): void;
  pageOptions?: number[];
};

const defaultStyles = (pfx: string) => css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  .${pfx}-pagination-totals {
    color: var(--palette-text-disabled, #838383);
  }

  .${pfx}-pagination-controls {
    display: flex;
    justify-content: flex-end;
    align-items: center;

    > * {
      margin: 0 4px;
    }

    > *:last-child {
      margin-right: 0;
    }

    .${pfx}-page-options-menu {
      .ft-select {
        min-width: 30px;
      }
      .ft-input-label {
        width: 75px;
        font-size: 14px;
        margin: 0;
      }
    }

    .${pfx}-page-viz {
      display: flex;
      align-items: center;
      > * {
        margin: 0 4px;
      }
    }

    .${pfx}-page-button {
      font-size: 14px;
      min-width: 24px;
      margin: 0 1px;
      &.${pfx}-page-control {
        > svg {
          width: 24px;
          height: 24px;
        }
        padding: 0;
      }
      &.${pfx}-toggle-button-inactive {
        background-color: transparent;
      }
    }
  }
`;

const DEFAULT_PAGE_OPTIONS = [10, 20, 50];
export const PaginationControl: VFC<PaginationControlProps> = ({
  classNamePrefix = "ft",
  className,
  totalRows,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  pageOptions = DEFAULT_PAGE_OPTIONS,
}) => {
  const pfx = withClassNamePrefix(classNamePrefix);

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
    <div className={cx(defaultStyles(classNamePrefix), className)}>
      {totalRows > 0 && (
        <div className={pfx("pagination-totals")}>
          Displaying {pageRange} of{" "}
          <HumanReadableNumberFormatter value={totalRows} /> results
        </div>
      )}
      {totalRows === 0 && (
        <div className={pfx("pagination-totals")}>No results</div>
      )}
      {totalRows > 0 && (
        <div className={pfx("pagination-controls")}>
          <Select
            label="Page size:"
            labelPlacement="left"
            className={pfx("page-options-menu")}
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
            isDisabled={pageIndex - 1 < 0}
            variant={"text"}
            size={"small"}
            className={cx(pfx("page-button"), pfx("page-control"))}
            icon={<SkipBackwardIcon />}
            onPress={() => onPageIndexChange(0)}
          />
          <IconButton
            isDisabled={pageIndex - 1 < 0}
            variant={"text"}
            size={"small"}
            className={cx(pfx("page-button"), pfx("page-control"))}
            icon={<BackwardIcon />}
            onPress={() => onPageIndexChange(pageIndex - 1)}
          />
          <div className={pfx("page-viz")}>
            {pagesToRender.map(page => {
              return (
                <Button
                  key={page}
                  className={pfx("page-button")}
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
            isDisabled={pageIndex + 1 >= pageCount}
            variant={"text"}
            size={"small"}
            className={cx(pfx("page-button"), pfx("page-control"))}
            icon={<ForwardIcon />}
            onPress={() => onPageIndexChange(pageIndex + 1)}
          />
          <IconButton
            isDisabled={pageIndex + 1 >= pageCount}
            variant={"text"}
            className={cx(pfx("page-button"), pfx("page-control"))}
            icon={<SkipForwardIcon />}
            onPress={() => onPageIndexChange(pageCount - 1)}
          />
        </div>
      )}
    </div>
  );
};

export default PaginationControl;
