import { cn, isEven } from "@/utils";
import { ChevronRightIcon } from "lucide-react";
import type { ComponentPropsWithRef } from "react";
import { Collapsible, CollapsibleTrigger } from "./Collapsible";

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
        className,
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
        className,
      )}
    />
  );
}

export function SearchResultCollapsibleTrigger({
  className,
  children,
  ...props
}: ComponentPropsWithRef<typeof CollapsibleTrigger>) {
  return (
    <CollapsibleTrigger
      className={cn(
        "group/search-result-collapsible-trigger flex w-full flex-row items-center gap-2 p-3 text-left hover:cursor-pointer",
        className,
      )}
      {...props}
    >
      <ChevronRightIcon
        className={cn(
          "text-primary-dark/50 size-5 shrink-0 transition-transform duration-200 ease-in-out group-data-[state=open]/search-result-collapsible-trigger:rotate-90",
        )}
      />
      {children}
    </CollapsibleTrigger>
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
        "text-text-primary gx-wrap-break-word line-clamp-2 text-base leading-snug font-bold",
        className,
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
        "text-text-secondary gx-wrap-break-word line-clamp-2 text-base leading-snug",
        className,
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
        className,
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
        className,
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
        className,
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
        "flex-[1 1 150px] text-secondary gx-wrap-break-word text-base leading-snug",
        className,
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
        "flex-[2 1 150px] text-text-primary gx-wrap-break-word text-base leading-snug",
        className,
      )}
    />
  );
}
