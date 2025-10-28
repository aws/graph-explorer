import { cn, isEven } from "@/utils";
import { ChevronRightIcon } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { Collapsible } from "./Collapsible";

export function SearchResult({
  className,
  level = 0,
  ...props
}: ComponentPropsWithRef<"div"> & { level?: number }) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-xl border shadow-sm content-auto intrinsic-size-[4.75rem]",
        isEven(level) ? "bg-gray-50" : "bg-default",
        className
      )}
    />
  );
}

export function SearchResultCollapsible({
  className,
  level = 0,
  highlighted = false,
  ...props
}: ComponentPropsWithRef<typeof Collapsible> & {
  level?: number;
  highlighted?: boolean;
}) {
  return (
    <Collapsible
      {...props}
      className={cn(
        "group rounded-xl shadow-sm ring-1 ring-border transition duration-100 ease-in-out content-auto intrinsic-size-[4.75rem]",
        isEven(level) ? "bg-gray-50" : "bg-default",
        highlighted ? "shadow-primary-dark/50 ring-primary-dark/75" : "",
        className
      )}
    />
  );
}

export function SearchResultTitle({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "line-clamp-2 min-w-0 text-pretty break-words text-base font-bold leading-snug text-text-primary [word-break:break-word]",
        className
      )}
    />
  );
}

export function SearchResultSubtitle({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "line-clamp-2 min-w-0 text-pretty break-words text-base leading-snug text-text-secondary [word-break:break-word]",
        className
      )}
    />
  );
}

export function SearchResultSymbol({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      className={cn(
        "grid size-[36px] shrink-0 place-content-center rounded-full p-2 text-[2em]",
        className
      )}
      {...props}
    />
  );
}

export function SearchResultExpandChevron({
  className,
  ...props
}: ComponentPropsWithRef<typeof ChevronRightIcon>) {
  return (
    <ChevronRightIcon
      className={cn(
        "size-5 shrink-0 text-primary-dark/50 transition-transform duration-200 ease-in-out group-data-open:rotate-90 group-data-closed:rotate-0",
        className
      )}
      {...props}
    />
  );
}

export function SearchResultAttribute({
  level = 0,
  className,
  ...props
}: ComponentPropsWithRef<"div"> & { level?: number }) {
  return (
    <div
      {...props}
      className={cn(
        "flex w-full flex-wrap justify-between gap-2 rounded-xl border px-4 py-2 shadow-sm",
        isEven(level) ? "bg-gray-50" : "bg-default",
        className
      )}
    />
  );
}

export function SearchResultAttributeName({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "flex-[1 1 150px] min-w-0 text-pretty break-words text-base leading-snug text-secondary [word-break:break-word]",
        className
      )}
    />
  );
}

export function SearchResultAttributeValue({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "flex-[2 1 150px] min-w-0 text-pretty break-words text-base leading-snug text-text-primary [word-break:break-word]",
        className
      )}
    />
  );
}
