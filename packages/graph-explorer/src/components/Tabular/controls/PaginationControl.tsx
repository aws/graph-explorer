import { useMemo } from "react";
import Button from "@/components/Button";
import { toHumanString } from "@/components/HumanReadableNumberFormatter";
import { IconButton } from "@/components";
import {
  BackwardIcon,
  ForwardIcon,
  SkipBackwardIcon,
  SkipForwardIcon,
} from "@/components/icons";
import Select from "@/components/Select";
import { Label } from "@/components/radix";
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
    <div
      className={cn(
        "flex w-full flex-wrap items-center justify-between gap-2",
        className
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
          <Select
            options={pageOptions.map(pageOption => ({
              label: pageOption.toString(),
              value: pageOption.toString(),
            }))}
            value={pageSize.toString()}
            onValueChange={value => onPageSizeChange(parseInt(value))}
          />
          <IconButton
            disabled={pageIndex - 1 < 0}
            variant="text"
            icon={<SkipBackwardIcon />}
            onClick={() => onPageIndexChange(0)}
          />
          <IconButton
            disabled={pageIndex - 1 < 0}
            variant="text"
            icon={<BackwardIcon />}
            onClick={() => onPageIndexChange(pageIndex - 1)}
          />
          {pagesToRender.map(page => {
            return (
              <Button
                key={page}
                variant={
                  pageIndex === parseInt(page) - 1 ? "filled" : "default"
                }
                onPress={() => onPageIndexChange(parseInt(page) - 1)}
              >
                {page}
              </Button>
            );
          })}
          <IconButton
            disabled={pageIndex + 1 >= pageCount}
            variant="text"
            icon={<ForwardIcon />}
            onClick={() => onPageIndexChange(pageIndex + 1)}
          />
          <IconButton
            disabled={pageIndex + 1 >= pageCount}
            variant="text"
            icon={<SkipForwardIcon />}
            onClick={() => onPageIndexChange(pageCount - 1)}
          />
        </div>
      )}
    </div>
  );
}

export default PaginationControl;
