import { ReactNode } from "react";
import { ColumnInstance } from "react-table";
import { Input } from "@/components";
import { FilterIcon } from "lucide-react";

export type TextFilterProps = {
  placeholder?: string;
  startAdornment?: ReactNode;
};

export function TextFilter<T extends object>({
  placeholder,
  startAdornment,
}: TextFilterProps) {
  return ({ column }: { column: ColumnInstance<T> }) => {
    return (
      <div className="relative w-full">
        <Input
          className="h-8 px-2 pl-8"
          placeholder={placeholder || "Filter..."}
          value={column.filterValue || ""}
          onChange={e => {
            // do not use value || undefined because
            // if the user types zero, it clears the filter too
            e.target.value !== "" && e.target.value !== undefined
              ? column.setFilter(e.target.value)
              : column.setFilter(undefined);
          }}
        />
        <div className="absolute inset-y-0 left-0 flex w-6 items-center pl-2">
          {startAdornment || <FilterIcon />}
        </div>
      </div>
    );
  };
}

export default TextFilter;
