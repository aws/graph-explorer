import { LoadingSpinner, PanelEmptyState } from "@/components";

export default function AppLoadingPage() {
  return (
    <PanelEmptyState
      title="Preparing environment..."
      subtitle="We are loading all components"
      icon={<LoadingSpinner />}
    />
  );
}
