import { Button, FormItem, Label, TextArea } from "@/components";
import { CornerDownRightIcon } from "lucide-react";

export function QuerySearchTabContent() {
  return (
    <div className="bg-background-default flex h-full flex-col">
      <div className="border-divider flex flex-col gap-3 border-b p-3">
        <FormItem>
          <Label htmlFor="query" className="sr-only">
            Query
          </Label>
          <TextArea name="query" />
        </FormItem>
        <div className="flex gap-6">
          <Button className="w-full" variant="filled">
            <CornerDownRightIcon />
            Run query
          </Button>
        </div>
      </div>
    </div>
  );
}
