import { cn, isEven } from "@/utils";
import { ChevronRightIcon } from "lucide-react";
import { ComponentPropsWithRef } from "react";
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
        "content-auto intrinsic-size-[4.75rem] rounded-xl border border-gray-200 shadow",
        isEven(level) ? "bg-gray-50" : "bg-default",
        className
      )}
    />
  );
}

export function SearchResultCollapsible({
  className,
  level = 0,
  ...props
}: ComponentPropsWithRef<typeof Collapsible> & { level?: number }) {
  return (
    <Collapsible
      {...props}
      className={cn(
        "content-auto intrinsic-size-[4.75rem] rounded-xl border border-gray-200 shadow",
        isEven(level) ? "bg-gray-50" : "bg-default",
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
        "text-text-primary line-clamp-2 text-pretty break-words text-base font-bold leading-normal [word-break:break-word]",
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
        "text-text-secondary line-clamp-2 min-w-0 text-pretty break-words text-base leading-snug [word-break:break-word]",
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
  open,
  ...props
}: ComponentPropsWithRef<typeof ChevronRightIcon> & { open: boolean }) {
  return (
    <ChevronRightIcon
      className={cn(
        "text-primary-dark/50 size-5 shrink-0 transition-transform duration-200 ease-in-out",
        open && "rotate-90",
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
        "flex w-full flex-wrap justify-between gap-2 rounded-xl border border-gray-200 px-4 py-2 shadow-sm",
        level % 2 === 0 ? "bg-default" : "bg-gray-50",
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
        "text-secondary flex-[1 1 150px] text-pretty text-base leading-snug [word-break:break-word]",
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
        "text-text-primary flex-[2 1 150px] text-pretty text-base leading-snug [word-break:break-word]",
        className
      )}
    />
  );
}
