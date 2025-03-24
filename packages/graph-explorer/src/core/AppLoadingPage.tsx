import {
  EmptyState,
  EmptyStateContent,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
} from "@/components";
import { LoaderCircleIcon } from "lucide-react";

export default function AppLoadingPage() {
  return (
    <EmptyState>
      <EmptyStateIcon>
        <LoaderCircleIcon className="animate-spin" />
      </EmptyStateIcon>
      <EmptyStateContent>
        <EmptyStateTitle>Preparing environment...</EmptyStateTitle>
        <EmptyStateDescription>
          We are loading all components
        </EmptyStateDescription>
      </EmptyStateContent>
    </EmptyState>
  );
}
