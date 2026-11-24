import { afterEach, describe, expect, it, type Mock, vi } from "vite-plus/test";

import {
  checkOneDigest,
  fetchDigests,
  fetchPublishedTags,
  newestTag,
  parseImage,
  planRelease,
} from "./releaseImage.ts";

const image = "public.ecr.aws/neptune/graph-explorer";

const publishedTags = [
  "latest",
  "sagemaker-latest",
  "latest-SNAPSHOT",
  "sagemaker-latest-SNAPSHOT",
  "3.3.0",
  "sagemaker-3.3.0",
  "3.3.2",
  "sagemaker-3.3.2",
  "1.10.0",
  "2.0.0",
];

describe("planRelease", () => {
  it("pushes the version tags and moves latest for the newest version", () => {
    expect(
      planRelease({
        ref: "refs/tags/v3.4.0",
        version: "3.4.0",
        publishedTags,
      }),
    ).toStrictEqual(["3.4.0", "sagemaker-3.4.0", "latest", "sagemaker-latest"]);
  });

  it("leaves latest alone for a version older than one already published", () => {
    expect(
      planRelease({
        ref: "refs/tags/v3.3.3",
        version: "3.3.3",
        publishedTags: [...publishedTags, "3.4.0", "sagemaker-3.4.0"],
      }),
    ).toStrictEqual(["3.3.3", "sagemaker-3.3.3"]);
  });

  it("compares versions numerically, not as text", () => {
    expect(
      planRelease({
        ref: "refs/tags/v3.10.0",
        version: "3.10.0",
        publishedTags: ["3.9.0", "3.3.2"],
      }),
    ).toContain("latest");
    expect(
      planRelease({
        ref: "refs/tags/v3.9.1",
        version: "3.9.1",
        publishedTags: ["3.10.0"],
      }),
    ).not.toContain("latest");
  });

  it("ranks non-numeric tags lowest, as the notebook script does", () => {
    expect(
      planRelease({
        ref: "refs/tags/v0.0.1",
        version: "0.0.1",
        publishedTags: [
          "latest",
          "sagemaker-9.9.9",
          "9.9.9-rc1",
          "v9.9.9",
          "latest-SNAPSHOT",
        ],
      }),
    ).toContain("latest");
  });

  it("ranks a shorter numeric tag below its longer form", () => {
    expect(
      planRelease({
        ref: "refs/tags/v3.4.0",
        version: "3.4.0",
        publishedTags: ["3.4"],
      }),
    ).toContain("latest");
  });

  it("leaves latest alone when a published tag has more numeric parts", () => {
    expect(
      planRelease({
        ref: "refs/tags/v3.4.0",
        version: "3.4.0",
        publishedTags: ["3.4.0.1"],
      }),
    ).not.toContain("latest");
  });

  it("fails when the run is not on a tag", () => {
    expect(() =>
      planRelease({
        ref: "refs/heads/main",
        version: "3.4.0",
        publishedTags,
      }),
    ).toThrow(
      new Error(
        "Release runs must start from the tag v3.4.0, but this run is on refs/heads/main.",
      ),
    );
  });

  it("fails when the tag does not match the package.json version", () => {
    expect(() =>
      planRelease({
        ref: "refs/tags/v3.4.1",
        version: "3.4.0",
        publishedTags,
      }),
    ).toThrow(
      new Error(
        "Release runs must start from the tag v3.4.0, but this run is on refs/tags/v3.4.1.",
      ),
    );
  });

  it("fails when the version is already published", () => {
    expect(() =>
      planRelease({
        ref: "refs/tags/v3.3.2",
        version: "3.3.2",
        publishedTags: ["latest", "3.3.2"],
      }),
    ).toThrow(new Error("3.3.2 is already published."));
  });

  it("fails when only the sagemaker tag of the version is published", () => {
    expect(() =>
      planRelease({
        ref: "refs/tags/v3.5.0",
        version: "3.5.0",
        publishedTags: ["sagemaker-3.5.0"],
      }),
    ).toThrow(new Error("sagemaker-3.5.0 is already published."));
  });

  it.each(["3.4.0-beta.1", "3.4", "v3.4.0", "03.4.0", "3.4.0.1", ""])(
    "fails when the version %j is not a plain X.Y.Z",
    version => {
      expect(() =>
        planRelease({ ref: `refs/tags/v${version}`, version, publishedTags }),
      ).toThrow(
        new Error(`The package.json version "${version}" is not X.Y.Z.`),
      );
    },
  );
});

describe("newestTag", () => {
  it("picks the highest version and ignores non-numeric tags", () => {
    expect(newestTag(publishedTags)).toBe("3.3.2");
  });

  it("compares versions numerically, not as text", () => {
    expect(newestTag(["3.9.0", "3.10.0", "3.3.2"])).toBe("3.10.0");
  });

  it("ranks non-numeric tags lowest, as the notebook script does", () => {
    expect(
      newestTag(["sagemaker-9.9.9", "9.9.9-rc1", "v9.9.9", "0.0.1", "latest"]),
    ).toBe("0.0.1");
  });

  it("ranks a shorter numeric tag below its longer form", () => {
    expect(newestTag(["3.4", "3.4.0"])).toBe("3.4.0");
  });

  it("throws when there are no tags", () => {
    expect(() => newestTag([])).toThrow(new Error("No published tags."));
  });
});

describe("checkOneDigest", () => {
  it("returns the digest every tag points to", () => {
    expect(
      checkOneDigest(
        new Map([
          ["3.4.0", "sha256:aaa"],
          ["sagemaker-3.4.0", "sha256:aaa"],
        ]),
      ),
    ).toBe("sha256:aaa");
  });

  it("fails when tags point to different digests", () => {
    expect(() =>
      checkOneDigest(
        new Map([
          ["3.4.0", "sha256:aaa"],
          ["latest", "sha256:bbb"],
        ]),
      ),
    ).toThrow(
      new Error(
        "The pushed tags point to more than one image: 3.4.0 sha256:aaa, latest sha256:bbb.",
      ),
    );
  });

  it("fails when a tag is missing", () => {
    expect(() =>
      checkOneDigest(
        new Map([
          ["3.4.0", "sha256:aaa"],
          ["sagemaker-3.4.0", null],
        ]),
      ),
    ).toThrow(new Error("sagemaker-3.4.0 is not in the registry."));
  });
});

describe("parseImage", () => {
  it("splits an image into the registry URL and repository", () => {
    expect(parseImage(image)).toStrictEqual({
      registry: "https://public.ecr.aws",
      repository: "neptune/graph-explorer",
    });
  });

  it.each([
    "",
    "graph-explorer",
    "public.ecr.aws/",
    "/neptune/graph-explorer",
    "public.ecr.aws/neptune/graph-explorer:latest",
  ])("rejects %j", value => {
    expect(() => parseImage(value)).toThrow(
      new Error(
        `IMAGE must be <registry>/<repository> with no tag, but it is "${value}".`,
      ),
    );
  });
});

describe("registry reads", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function stubRegistry(routes: Record<string, () => Response>): Mock {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      const route = routes[url];
      if (!route) {
        throw new Error(`Unexpected request to ${url}`);
      }
      return Promise.resolve(route());
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  const tokenRoute = {
    "https://public.ecr.aws/token/": () => Response.json({ token: "anon" }),
  };

  it("reads every tag, following the next page", async () => {
    stubRegistry({
      ...tokenRoute,
      "https://public.ecr.aws/v2/neptune/graph-explorer/tags/list?n=1000": () =>
        Response.json(
          { tags: ["3.3.2", "latest"] },
          {
            headers: {
              Link: '</v2/neptune/graph-explorer/tags/list?n=1000&last=latest>; rel="next"',
            },
          },
        ),
      "https://public.ecr.aws/v2/neptune/graph-explorer/tags/list?n=1000&last=latest":
        () => Response.json({ tags: ["sagemaker-3.3.2"] }),
    });

    await expect(fetchPublishedTags(image)).resolves.toStrictEqual([
      "3.3.2",
      "latest",
      "sagemaker-3.3.2",
    ]);
  });

  it("fails on a tag list it can't read", async () => {
    stubRegistry({
      ...tokenRoute,
      "https://public.ecr.aws/v2/neptune/graph-explorer/tags/list?n=1000": () =>
        Response.json({ tags: [3] }),
    });

    await expect(fetchPublishedTags(image)).rejects.toThrow(
      new Error("The registry returned a tag list without a list of tags."),
    );
  });

  it("fails when the registry refuses the tag list", async () => {
    stubRegistry({
      ...tokenRoute,
      "https://public.ecr.aws/v2/neptune/graph-explorer/tags/list?n=1000": () =>
        new Response("busy", { status: 503 }),
    });

    await expect(fetchPublishedTags(image)).rejects.toThrow(
      new Error(
        "GET https://public.ecr.aws/v2/neptune/graph-explorer/tags/list?n=1000 returned 503.",
      ),
    );
  });

  it("reads each tag's digest, or null when the tag is absent", async () => {
    const fetchMock = stubRegistry({
      ...tokenRoute,
      "https://public.ecr.aws/v2/neptune/graph-explorer/manifests/3.3.2": () =>
        new Response(null, {
          headers: { "Docker-Content-Digest": "sha256:aaa" },
        }),
      "https://public.ecr.aws/v2/neptune/graph-explorer/manifests/3.3.3": () =>
        new Response(null, { status: 404 }),
    });

    await expect(
      fetchDigests(image, ["3.3.2", "3.3.3"]),
    ).resolves.toStrictEqual(
      new Map([
        ["3.3.2", "sha256:aaa"],
        ["3.3.3", null],
      ]),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "https://public.ecr.aws/v2/neptune/graph-explorer/manifests/3.3.2",
      expect.objectContaining({
        method: "HEAD",
        headers: expect.objectContaining({ Authorization: "Bearer anon" }),
      }),
    );
  });

  it("fails when the registry refuses a digest read", async () => {
    stubRegistry({
      ...tokenRoute,
      "https://public.ecr.aws/v2/neptune/graph-explorer/manifests/latest": () =>
        new Response(null, { status: 500 }),
    });

    await expect(fetchDigests(image, ["latest"])).rejects.toThrow(
      new Error(
        "HEAD https://public.ecr.aws/v2/neptune/graph-explorer/manifests/latest returned 500.",
      ),
    );
  });

  it("waits out throttling and asks again", async () => {
    vi.useFakeTimers();
    const tagListUrl =
      "https://public.ecr.aws/v2/neptune/graph-explorer/tags/list?n=1000";
    const statuses = [429, 429, 200];
    const fetchMock = stubRegistry({
      ...tokenRoute,
      [tagListUrl]: () =>
        Response.json({ tags: ["3.3.2"] }, { status: statuses.shift() }),
    });
    function tagListCalls() {
      return fetchMock.mock.calls.filter(([url]) => url === tagListUrl).length;
    }

    const tags = fetchPublishedTags(image);
    await vi.advanceTimersByTimeAsync(999);
    expect(tagListCalls()).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(tagListCalls()).toBe(2);
    await vi.runAllTimersAsync();

    await expect(tags).resolves.toStrictEqual(["3.3.2"]);
    expect(tagListCalls()).toBe(3);
  });

  it("gives up when throttling lasts", async () => {
    vi.useFakeTimers();
    stubRegistry({
      ...tokenRoute,
      "https://public.ecr.aws/v2/neptune/graph-explorer/tags/list?n=1000": () =>
        new Response(null, { status: 429 }),
    });

    const failure = fetchPublishedTags(image).catch((error: unknown) => error);
    await vi.runAllTimersAsync();

    expect(await failure).toStrictEqual(
      new Error(
        "GET https://public.ecr.aws/v2/neptune/graph-explorer/tags/list?n=1000 returned 429.",
      ),
    );
  });
});
