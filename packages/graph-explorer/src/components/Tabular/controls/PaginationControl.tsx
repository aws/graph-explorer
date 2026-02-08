import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

import { Button, Label, SelectField, toHumanString } from "@/components";
import { cn } from "@/utils";

export type PaginationControlProps = {
  className?: string;
  totalRows: number;
  pageIndex: number;
  onPageIndexChange(pageIndex: number): void;
  pageSize: number;
  onPageSizeChange(pageSize: number): void;
  pageOptions?: number[];
};

const DEFAULT_PAGE_OPTIONS = [10, 20, 50];
export function PaginationControl({
  className,
  totalRows,
  pageIndex,
  pageSize,
  onPageIndexChange,
  onPageSizeChange,
  pageOptions = DEFAULT_PAGE_OPTIONS,
}: PaginationControlProps) {
  const pageCount = Math.ceil(totalRows / pageSize);

  const pagesToRender = (() => {
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
  })();

  const pageRange = (() => {
    const to = pageIndex * pageSize + pageSize;
    return `${pageIndex * pageSize + 1}-${to < totalRows ? to : totalRows}`;
  })();

  return (
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-2",
        className,
      )}
    >
      <div className="text-text-secondary">
        {totalRows > 0
          ? `Displaying ${pageRange} of ${toHumanString(totalRows)} results`
          : `No results`}
      </div>

      {totalRows > 0 && (
        <div className="flex flex-row items-center gap-1">
          <Label className="shrink-0">Page size:</Label>
          <SelectField
            options={pageOptions.map(pageOption => ({
              label: pageOption.toString(),
              value: pageOption.toString(),
            }))}
            value={pageSize.toString()}
            onValueChange={value => onPageSizeChange(parseInt(value))}
          />
          <Button
            disabled={pageIndex - 1 < 0}
            variant="text"
            size="icon-small"
            onClick={() => onPageIndexChange(0)}
          >
            <ChevronFirstIcon />
          </Button>
          <Button
            disabled={pageIndex - 1 < 0}
            variant="text"
            size="icon-small"
            onClick={() => onPageIndexChange(pageIndex - 1)}
          >
            <ChevronLeftIcon />
          </Button>
          {pagesToRender.map(page => {
            return (
              <Button
                key={page}
                size="icon-small"
                variant={
                  pageIndex === parseInt(page) - 1 ? "filled" : "default"
                }
                onClick={() => onPageIndexChange(parseInt(page) - 1)}
              >
                {page}
              </Button>
            );
          })}
          <Button
            disabled={pageIndex + 1 >= pageCount}
            variant="text"
            size="icon-small"
            onClick={() => onPageIndexChange(pageIndex + 1)}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            disabled={pageIndex + 1 >= pageCount}
            variant="text"
            size="icon-small"
            onClick={() => onPageIndexChange(pageCount - 1)}
          >
            <ChevronLastIcon />
          </Button>
        </div>
      )}
    </div>
  );
}

export default PaginationControl;
