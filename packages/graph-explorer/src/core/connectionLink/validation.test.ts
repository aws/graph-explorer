// @vitest-environment happy-dom
import { resolveConnectionLink } from "./connectionLink";

/** The problems of an invalid link, as `param requirement` strings. */
function problemsOf(search: string) {
  const intent = resolveConnectionLink(search);
  if (intent.kind !== "invalid") {
    throw new Error(`Expected an invalid link, got "${intent.kind}"`);
  }
  return intent.error.problems.map(
    problem => `${problem.param} ${problem.requirement}`,
  );
}

/** What a valid link asks for, read off the connection it proposes. */
function paramsOf(search: string) {
  const intent = resolveConnectionLink(search);
  if (intent.kind !== "create") {
    throw new Error(`Expected a create intent, got "${intent.kind}"`);
  }
  const { graphDbUrl, queryEngine, awsRegion, serviceType } = intent.connection;
  return { graphDbUrl, queryEngine, awsRegion, serviceType, name: intent.name };
}

describe("reading a connection link", () => {
  // The `#/connect` route exists only for connection links, so reaching it
  // without a graphDbUrl is an invalid link worth telling the user about,
  // rather than a silent no-op.
  test("is invalid when graphDbUrl is missing", () => {
    expect(problemsOf("")).toEqual(["graphDbUrl is required"]);
    expect(problemsOf("?queryEngine=openCypher")).toEqual([
      "graphDbUrl is required",
    ]);
  });

  test("is invalid when graphDbUrl is present but empty", () => {
    expect(problemsOf("?graphDbUrl=")).toEqual(["graphDbUrl is required"]);
  });

  // Both the missing param and the other bad param are reported together, so
  // the user sees everything wrong with the link in one notification.
  test("reports a missing graphDbUrl alongside other bad params", () => {
    expect(problemsOf("?queryEngine=sql")).toEqual([
      "graphDbUrl is required",
      'queryEngine must be one of "gremlin", "openCypher", "sparql"',
    ]);
  });

  test("parses graphDbUrl with defaults", () => {
    expect(
      paramsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.us-west-2.neptune-graph.amazonaws.com",
      ),
    ).toEqual({
      graphDbUrl: "https://g-xxx.us-west-2.neptune-graph.amazonaws.com",
      queryEngine: "gremlin",
      awsRegion: "",
      serviceType: undefined,
      name: "g-xxx.us-west-2.neptune-graph.amazonaws.com",
    });
  });

  test("falls back to the hostname when name is present but empty", () => {
    expect(
      paramsOf("?graphDbUrl=https%3A%2F%2Fdb.example.com&name=").name,
    ).toBe("db.example.com");
  });

  test("derives the name from the full hostname (without the port) when name is absent", () => {
    expect(
      paramsOf(
        "?graphDbUrl=https%3A%2F%2Fmy-cluster.us-east-1.neptune.amazonaws.com%3A8182",
      ).name,
    ).toBe("my-cluster.us-east-1.neptune.amazonaws.com");
  });

  test("parses all parameters", () => {
    expect(
      paramsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&queryEngine=openCypher&awsRegion=us-west-2&serviceType=neptune-graph&name=My+Graph",
      ),
    ).toEqual({
      graphDbUrl: "https://g-xxx.neptune-graph.amazonaws.com",
      queryEngine: "openCypher",
      awsRegion: "us-west-2",
      serviceType: "neptune-graph",
      name: "My Graph",
    });
  });

  // Each problem names the parameter at fault, so the user is told what to fix
  // rather than that the link was generically bad.
  test("reports which parameter failed and what it requires", () => {
    expect(problemsOf("?graphDbUrl=not-a-url")).toEqual([
      "graphDbUrl must be a valid http or https URL",
    ]);
  });

  test("rejects a graphDbUrl that is not http(s)", () => {
    expect(problemsOf("?graphDbUrl=javascript%3Aalert(1)")).toEqual([
      "graphDbUrl must be a valid http or https URL",
    ]);
    expect(problemsOf("?graphDbUrl=ftp%3A%2F%2Fexample.com")).toEqual([
      "graphDbUrl must be a valid http or https URL",
    ]);
  });

  // `fetch` refuses a URL carrying credentials (the Request constructor throws
  // a TypeError), so such a link could only ever produce a connection that
  // fails every query — while writing the password into IndexedDB and any
  // exported connection file on the way.
  test("rejects a graphDbUrl carrying credentials", () => {
    expect(
      problemsOf(
        `?graphDbUrl=${encodeURIComponent("https://user:secret@my-cluster.neptune.amazonaws.com:8182")}`,
      ),
    ).toEqual(["graphDbUrl cannot include a username or password"]);
  });

  test("rejects a graphDbUrl carrying only a username", () => {
    expect(
      problemsOf(
        `?graphDbUrl=${encodeURIComponent("https://user@my-cluster.neptune.amazonaws.com:8182")}`,
      ),
    ).toEqual(["graphDbUrl cannot include a username or password"]);
  });

  // WHATWG URL parsing treats a backslash as a forward slash for http(s)
  // URLs, so this parses with an empty username and host `evil.tld` — passing
  // `url()` and the plain credentials check, while a reader sees a trusted
  // Neptune host after the `\@`.
  test("rejects a graphDbUrl that hides credentials behind a backslash", () => {
    expect(
      problemsOf(
        `?graphDbUrl=${encodeURIComponent(
          "https://evil.tld\\@prod.cluster-abc.us-east-1.neptune.amazonaws.com:8182",
        )}`,
      ),
    ).toEqual(["graphDbUrl cannot contain a backslash"]);
  });

  test("accepts an explicit default port", () => {
    expect(
      paramsOf(
        `?graphDbUrl=${encodeURIComponent(
          "https://g-abc.us-east-1.neptune-graph.amazonaws.com:443",
        )}`,
      ).graphDbUrl,
    ).toBe("https://g-abc.us-east-1.neptune-graph.amazonaws.com:443");
  });

  test("accepts ordinary URLs", () => {
    expect(
      paramsOf(
        `?graphDbUrl=${encodeURIComponent(
          "https://my-cluster.us-east-1.neptune.amazonaws.com:8182",
        )}`,
      ).graphDbUrl,
    ).toBe("https://my-cluster.us-east-1.neptune.amazonaws.com:8182");

    expect(
      paramsOf(`?graphDbUrl=${encodeURIComponent("http://localhost:8182")}`)
        .graphDbUrl,
    ).toBe("http://localhost:8182");

    expect(
      paramsOf(`?graphDbUrl=${encodeURIComponent("https://host:8182/sparql")}`)
        .graphDbUrl,
    ).toBe("https://host:8182/sparql");

    expect(
      paramsOf(`?graphDbUrl=${encodeURIComponent("https://host:8182/")}`)
        .graphDbUrl,
    ).toBe("https://host:8182/");
  });

  // A link naming a query engine or service type we do not support asked for
  // something we cannot deliver. Coercing it to a default would connect with a
  // different query language than the caller requested, so it is rejected and
  // the user is told the link was bad.
  test("rejects an unsupported queryEngine instead of defaulting it", () => {
    expect(
      problemsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&queryEngine=sql",
      ),
    ).toEqual(['queryEngine must be one of "gremlin", "openCypher", "sparql"']);
  });

  // Neptune Analytics only speaks openCypher, so the create form always
  // forces it and disables the picker. A link omitting queryEngine must
  // resolve to the same value the form would have forced, rather than the
  // general gremlin default.
  describe("queryEngine default depends on serviceType", () => {
    test("defaults to openCypher for neptune-graph when queryEngine is omitted", () => {
      expect(
        paramsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=us-west-2&serviceType=neptune-graph",
        ).queryEngine,
      ).toBe("openCypher");
    });

    test("rejects gremlin for neptune-graph rather than silently switching engines", () => {
      expect(
        problemsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=us-west-2&serviceType=neptune-graph&queryEngine=gremlin",
        ),
      ).toEqual([
        'queryEngine must be "openCypher" when serviceType is "neptune-graph"',
      ]);
    });

    test("accepts openCypher for neptune-graph", () => {
      expect(
        paramsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=us-west-2&serviceType=neptune-graph&queryEngine=openCypher",
        ).queryEngine,
      ).toBe("openCypher");
    });

    // Neptune Analytics only accepts IAM-signed requests, so a link to it
    // without a region could only build a connection that fails every query.
    test("rejects neptune-graph without an awsRegion", () => {
      expect(
        problemsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&serviceType=neptune-graph",
        ),
      ).toEqual(['awsRegion is required when serviceType is "neptune-graph"']);
    });

    test("defaults to gremlin for neptune-db when queryEngine is omitted", () => {
      expect(
        paramsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune.amazonaws.com&serviceType=neptune-db",
        ).queryEngine,
      ).toBe("gremlin");
    });
  });

  test("rejects an unsupported serviceType instead of dropping it", () => {
    expect(
      problemsOf(
        "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&serviceType=bogus",
      ),
    ).toEqual(['serviceType must be one of "neptune-db", "neptune-graph"']);
  });

  describe("awsRegion format", () => {
    test.each([
      "us-east-1",
      "us-gov-west-1",
      "ap-southeast-2",
      "eu-central-1",
      "cn-north-1",
    ])("accepts %s", region => {
      expect(
        paramsOf(
          `?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=${region}`,
        ).awsRegion,
      ).toBe(region);
    });

    test("rejects a value that isn't shaped like an AWS region", () => {
      expect(
        problemsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=x",
        ),
      ).toEqual(['awsRegion must be an AWS region like "us-east-1"']);
    });

    test("rejects a region-shaped value with the wrong case", () => {
      expect(
        problemsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=US-EAST-1",
        ),
      ).toEqual(['awsRegion must be an AWS region like "us-east-1"']);
    });

    // An absent or empty awsRegion still means IAM off, not a bad value.
    test("accepts an absent or empty awsRegion", () => {
      expect(
        paramsOf("?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com")
          .awsRegion,
      ).toBe("");
      expect(
        paramsOf(
          "?graphDbUrl=https%3A%2F%2Fg-xxx.neptune-graph.amazonaws.com&awsRegion=",
        ).awsRegion,
      ).toBe("");
    });
  });

  test("reports every offending parameter, not just the first", () => {
    expect(
      problemsOf("?graphDbUrl=not-a-url&queryEngine=sql&serviceType=bogus"),
    ).toHaveLength(3);
  });
});
