import { ArrowRightIcon, TriangleAlertIcon } from "lucide-react";

import type { ConnectionLinkProblem } from "@/core/connectionLink";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components";
import { LABELS } from "@/utils/constants";

/**
 * Explains why a connection link was ignored, naming each parameter at fault
 * so the user can correct the link or report it to whoever sent it.
 */
export function InvalidConnectionLinkCard({
  problems,
  onContinue,
}: {
  problems: readonly ConnectionLinkProblem[];
  onContinue: () => void;
}) {
  return (
    <Card className="w-[500px] max-w-full [--card-spacing:--spacing(6)]">
      <CardHeader>
        <div className="flex items-start gap-2">
          <TriangleAlertIcon className="text-danger-foreground size-5 shrink-0" />
          <div className="grid gap-1">
            <CardTitle>
              <h1>Invalid connection link</h1>
            </CardTitle>
            <CardDescription>
              The link was ignored, so nothing changed. Fix these parameters in
              the link:
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {problems.map(problem => (
            <li key={`${problem.param} ${problem.requirement}`}>
              <code>{problem.param}</code> {problem.requirement}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="justify-end">
        <Button variant="primary" onClick={onContinue}>
          Continue to {LABELS.APP_NAME}
          <ArrowRightIcon />
        </Button>
      </CardFooter>
    </Card>
  );
}
