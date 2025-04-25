import { decodeErrorSafely } from "./fetchDatabaseRequest";

describe("decodeErrorSafely", () => {
  it("should ignore HTML responses", async () => {
    const response = new Response("<html></html>", {
      status: 500,
      headers: {
        "Content-Type": "text/html",
      },
    });

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toBeUndefined();
  });

  it("should return the error message inside the JSON response", async () => {
    const response = new Response(
      JSON.stringify({
        error: "An error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toBe("An error occurred");
  });

  it("should return undefined when the error contains no content", async () => {
    const response = new Response(null, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toBeUndefined();
  });
});
