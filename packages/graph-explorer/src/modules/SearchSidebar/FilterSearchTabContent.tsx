import useKeywordSearch from "./useKeywordSearch";
import { SearchResultsList } from "./SearchResultsList";
import { Checkbox } from "@/components/radix/Checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/radix/Select";
import { Input } from "@/components/radix/Input";
import { Label } from "@/components/radix/Label";
import { FormItem } from "@/components/radix/Form";

export function FilterSearchTabContent() {
  const {
    query,
    onSearchTermChange,
    onVertexOptionChange,
    searchPlaceholder,
    searchTerm,
    selectedVertexType,
    vertexOptions,
    selectedAttribute,
    attributesOptions,
    onAttributeOptionChange,
    partialMatch,
    onPartialMatchChange,
  } = useKeywordSearch();

  return (
    <div className="bg-background-default flex h-full flex-col">
      <div className="border-divider flex flex-col gap-4 border-b p-3">
        <div className="grid w-full grid-cols-2 gap-4">
          <FormItem>
            <Label htmlFor="nodeType">Node type</Label>
            <Select
              name="nodeType"
              value={selectedVertexType}
              onValueChange={onVertexOptionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a node type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {vertexOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </FormItem>
          <div className="space-y-1">
            <Label htmlFor="attribute">Attribute</Label>
            <Select
              name="attribute"
              value={selectedAttribute}
              onValueChange={onAttributeOptionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an attribute" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {attributesOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <FormItem>
          <Label htmlFor="searchTerm">Search term</Label>
          <Input
            name="searchTerm"
            value={searchTerm}
            onChange={e => onSearchTermChange(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </FormItem>
        <div className="flex gap-6">
          <Label className="inline-flex items-center gap-2 hover:cursor-pointer">
            <Checkbox
              checked={partialMatch}
              onCheckedChange={checked =>
                onPartialMatchChange(Boolean(checked))
              }
            />
            Partial match
          </Label>
        </div>
      </div>

      <SearchResultsList query={query} />
    </div>
  );
}
