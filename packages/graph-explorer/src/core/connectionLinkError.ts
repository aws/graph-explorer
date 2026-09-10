/** One link parameter that failed validation, and the requirement it broke. */
export type ConnectionLinkProblem = {
  /** The parameter at fault, named exactly as it appears in the URL. */
  param: string;
  /** What the parameter must be, phrased to follow its name. */
  requirement: string;
};

/**
 * A connection link carried values Graph Explorer cannot honor. Holds a problem
 * per offending parameter so the user is told which part of their link was
 * wrong, rather than that "something" was.
 *
 * Kept in its own module, free of app imports, so the error display paths can
 * recognize it without depending on link parsing.
 */
export class ConnectionLinkError extends Error {
  readonly problems: readonly ConnectionLinkProblem[];

  constructor(problems: readonly ConnectionLinkProblem[]) {
    super(`Invalid connection link: ${describeLinkProblems(problems)}`);
    // A literal, because the production build minifies class names.
    this.name = "ConnectionLinkError";
    this.problems = problems;
  }

  /** Structured context for the error details dialog. */
  get details() {
    return { problems: this.problems };
  }
}

/** Renders problems as a sentence: "graphDbUrl must be a valid http or https URL". */
export function describeLinkProblems(
  problems: readonly ConnectionLinkProblem[],
): string {
  return problems
    .map(problem => `${problem.param} ${problem.requirement}`)
    .join("; ");
}
