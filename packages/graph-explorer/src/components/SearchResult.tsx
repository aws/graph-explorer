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
        "content-auto intrinsic-size-[4.75rem] rounded-xl border shadow-xs",
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
        "group ring-border content-auto intrinsic-size-[4.75rem] rounded-xl shadow-xs ring-1 transition duration-100 ease-in-out",
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
        "text-text-primary line-clamp-2 min-w-0 text-base leading-snug font-bold text-pretty wrap-break-word [word-break:break-word]",
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
        "text-text-secondary line-clamp-2 min-w-0 text-base leading-snug text-pretty wrap-break-word [word-break:break-word]",
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
        "text-primary-dark/50 size-5 shrink-0 transition-transform duration-200 ease-in-out group-data-closed:rotate-0 group-data-open:rotate-90",
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
        "flex w-full flex-wrap justify-between gap-2 rounded-xl border px-4 py-2 shadow-xs",
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
        "flex-[1 1 150px] text-secondary min-w-0 text-base leading-snug text-pretty break-words [word-break:break-word]",
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
        "flex-[2 1 150px] text-text-primary min-w-0 text-base leading-snug text-pretty break-words [word-break:break-word]",
        className
      )}
    />
  );
}
