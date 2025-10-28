import type { FallbackProps } from "react-error-boundary";
import { createDisplayError } from "@/utils/createDisplayError";
import {
  Button,
  ErrorIcon,
  PageHeading,
  Paragraph,
  ResetIcon,
} from "@/components";
import { LABELS, RELOAD_URL } from "@/utils/constants";

/** This is the app wide error page that will be shown when the app essentially crashes */
export default function AppErrorPage(props: FallbackProps) {
  const displayError = createDisplayError(props.error);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-background-default p-6">
      <ErrorIcon className="h-[8rem] w-[8rem] text-warning-main" />
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <PageHeading>{displayError.title}</PageHeading>
          <Paragraph>{displayError.message}</Paragraph>
        </div>

        {/* Force a full reload of the app in the browser */}
        <a href={RELOAD_URL}>
          <Button variant="filled" size="large" icon={<ResetIcon />}>
            Reload {LABELS.APP_NAME}
          </Button>
        </a>
      </div>
    </div>
  );
}
