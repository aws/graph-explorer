import { decodeErrorSafely } from "./fetchDatabaseRequest";

describe("decodeErrorSafely", () => {
  it("should decode text responses", async () => {
    const response = new Response("Some error message", {
      status: 500,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toEqual({
      status: 500,
      contentType: "text/plain",
      content: "text",
      text: "Some error message",
    });
  });

  it("should decode HTML responses", async () => {
    const response = new Response("<html></html>", {
      status: 500,
      headers: {
        "Content-Type": "text/html",
      },
    });

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toEqual({
      status: 500,
      contentType: "text/html",
      content: "text",
      text: "<html></html>",
    });
  });

  it("should decode xml responses", async () => {
    const response = new Response("<xml></xml>", {
      status: 500,
      headers: {
        "Content-Type": "text/xml",
      },
    });

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toEqual({
      status: 500,
      contentType: "text/xml",
      content: "text",
      text: "<xml></xml>",
    });
  });

  it("should return the error message inside the JSON response", async () => {
    const response = new Response(
      JSON.stringify({
        message: "An error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toEqual({
      status: 500,
      contentType: "application/json",
      content: "data",
      data: { message: "An error occurred" },
    });
  });

  it("should return the flattened error message inside the JSON response", async () => {
    const response = new Response(
      JSON.stringify({
        error: { message: "An error occurred" },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toEqual({
      status: 500,
      contentType: "application/json",
      content: "data",
      data: {
        message: "An error occurred",
      },
    });
  });

  it("should return undefined when the error contains no content", async () => {
    const response = new Response(null, {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });

    const decoded = await decodeErrorSafely(response);

    expect(decoded).toEqual({
      status: 500,
      contentType: "application/json",
      content: "empty",
    });
  });
});
