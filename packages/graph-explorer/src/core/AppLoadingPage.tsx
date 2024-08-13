import { LoaderIcon, SectionTitle } from "../components";

export default function AppLoadingPage() {
  return (
    <div className="container m-auto flex h-full flex-row items-center justify-center gap-4 p-6">
      <LoaderIcon className="text-info-main h-[2.5rem] w-[2.5rem] animate-spin" />
      <SectionTitle>Loading...</SectionTitle>
    </div>
  );
}
