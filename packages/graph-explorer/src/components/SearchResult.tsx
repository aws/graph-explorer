import { cn } from "@/utils";
import { ChevronRightIcon } from "lucide-react";
import { ComponentPropsWithRef } from "react";

export function SearchResult({
  className,
  ...props
}: ComponentPropsWithRef<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "bg-background-default group w-full overflow-hidden transition-all",
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
        "text-text-primary line-clamp-3 text-pretty text-base font-bold leading-snug [word-break:break-word]",
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
        "text-text-secondary/90 line-clamp-3 text-pretty text-base leading-snug [word-break:break-word]",
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
        "text-primary-dark/50 size-5 shrink-0 transition-transform duration-200 ease-in-out group-data-[expanded=true]:rotate-90",
        className
      )}
      {...props}
    />
  );
}
