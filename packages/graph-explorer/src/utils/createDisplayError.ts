export type DisplayError = {
  title: string;
  message: string;
};

const defaultDisplayError: DisplayError = {
  title: "Something went wrong",
  message: "An error occurred. Please try again.",
};

/**
 * Attempts to convert the technicality of errors in to humane
 * friendly errors that are suitable for display.
 *
 * @param error Any thrown error or error response.
 * @returns A `DisplayError` that contains a title and message.
 */
export function createDisplayError(error: any): DisplayError {
  if (typeof error === "object") {
    // Bad connection configuration
    if (
      error?.code === "ECONNREFUSED" ||
      error?.cause?.code === "ECONNREFUSED"
    ) {
      return {
        title: "Connection refused",
        message: "Please check your connection and try again.",
      };
    }
    if (error?.code === "ECONNRESET" || error?.cause?.code === "ECONNRESET") {
      return {
        title: "Connection reset",
        message: "Please check your connection and try again.",
      };
    }

    // Server timeout
    if (
      error?.code === "TimeLimitExceededException" ||
      error?.cause?.code === "TimeLimitExceededException"
    ) {
      return {
        title: "Deadline exceeded",
        message:
          "Increase the query timeout in the DB cluster parameter group, or retry the request.",
      };
    }

    // Fetch timeout
    if (error?.name === "AbortError") {
      return {
        title: "Request cancelled",
        message: "The request exceeded the configured timeout length.",
      };
    }
  }
  return defaultDisplayError;
}
