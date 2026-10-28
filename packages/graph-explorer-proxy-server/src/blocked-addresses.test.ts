import type { AddressInfo } from "net";
import type * as NodeFetch from "node-fetch";

import dns, { type LookupAddress } from "dns";
import http from "http";
import https from "https";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";

import {
  blockedLookupErrorCode,
  dbAgentFor,
  dbAgentOptions,
  guardedLookup,
  isBlockedAddress,
} from "./blocked-addresses.ts";

describe("isBlockedAddress", () => {
  it.each([
    ["IPv4 start of the first reserved range", "169.254.0.0"],
    ["IPv4 inside the first reserved range", "169.254.0.23"],
    ["IPv4 end of the first reserved range", "169.254.0.255"],
    ["IPv4 single reserved address", "169.254.42.42"],
    ["IPv4 inside the second reserved range", "169.254.169.254"],
    ["IPv4 start of the second reserved range", "169.254.169.0"],
    ["IPv4 inside the third reserved range", "169.254.170.2"],
    ["IPv4 end of the third reserved range", "169.254.170.255"],
    ["IPv4 reserved shared address space address", "100.100.100.200"],
    ["IPv6 link-local", "fe80::1"],
    ["IPv6 reserved address", "fd00:ec2::254"],
    [
      "IPv6 reserved address, written out",
      "fd00:0ec2:0000:0000:0000:0000:0000:0254",
    ],
    [
      "IPv6 link-local, written out with a zone",
      "fe80:0000:0000:0000:0000:0000:1.25.255.1%eth0",
    ],
    [
      "IPv6 reserved address, written out with a zone",
      "fd00:0ec2:0000:0000:0000:0000:169.254.169.254%en0",
    ],
    ["IPv6 inside the reserved range, fd00:ec2::23", "fd00:ec2::23"],
    ["IPv4-mapped IPv6", "::ffff:169.254.169.254"],
    ["IPv4-compatible IPv6", "::169.254.169.254"],
    ["IPv6 inside the reserved range, fd00:ec2::253", "fd00:ec2::253"],
    ["IPv6 end of the reserved range", "fd00:ec2::ffff:ffff:ffff:ffff"],
  ])("blocks %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each([
    ["IPv4 private", "10.0.0.5"],
    ["IPv4 link-local, rootless Podman host alias", "169.254.1.2"],
    [
      "IPv4 link-local just before the single reserved address",
      "169.254.42.41",
    ],
    [
      "IPv4 link-local just before the second reserved range",
      "169.254.168.255",
    ],
    ["IPv4 link-local, VPC Lattice", "169.254.171.1"],
    ["IPv4 link-local, container bridge", "169.254.172.2"],
    ["IPv4 end of the link-local range", "169.254.255.255"],
    [
      "IPv4 beside the reserved shared address space address",
      "100.100.100.201",
    ],
    ["IPv4 private 172.16/12", "172.16.0.1"],
    ["IPv4 private 192.168/16", "192.168.1.1"],
    ["IPv4 loopback", "127.0.0.1"],
    ["IPv6 loopback", "::1"],
    ["IPv6 unique local just past the reserved range", "fd00:ec2:0:1::1"],
    ["IPv6 unique local", "fd00::5"],
    ["IPv6 unique local with a random global ID", "fd12:3456::1"],
    [
      "IPv4 private through the NAT64 well-known prefix, in hex",
      "64:ff9b::a00:5",
    ],
    ["a host name", "neptune.example.com"],
  ])("allows %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  // 169.254.169.254 is a9fe:a9fe. Each form embeds it where its standard
  // places the IPv4 address.
  it.each([
    ["NAT64 well-known prefix", "64:ff9b::169.254.169.254"],
    ["NAT64 well-known prefix, in hex", "64:ff9b::a9fe:a9fe"],
    ["NAT64 well-known prefix, with a zone", "64:ff9b::169.254.169.254%eth0"],
    ["NAT64 local-use prefix as a /96", "64:ff9b:1::a9fe:a9fe"],
    ["NAT64 local-use prefix as a /64", "64:ff9b:1:0:a9:fea9:fe00:0"],
    ["NAT64 local-use prefix as a /56", "64:ff9b:1:a9:fe:a9fe::"],
    ["NAT64 local-use prefix as a /48", "64:ff9b:1:a9fe:a9:fe05::"],
    ["6to4", "2002:a9fe:a9fe::1"],
    ["Teredo server", "2001:0:a9fe:a9fe::1"],
    ["Teredo client", "2001:0:4136:e378:8000:63bf:5601:5601"],
    ["IPv4-translated", "::ffff:0:169.254.169.254"],
  ])("blocks a reserved address embedded in %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each([
    ["NAT64 well-known prefix", "64:ff9b::10.0.0.5"],
    ["NAT64 local-use prefix", "64:ff9b:1::a00:5"],
    ["6to4", "2002:a00:5::1"],
    ["Teredo", "2001:0:4136:e378:8000:63bf:f5ff:fffa"],
    ["IPv4-translated", "::ffff:0:10.0.0.5"],
  ])("allows a private address embedded in %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  it("blocks a NAT64 local-use address when any IPv4 position reads as a reserved address", () => {
    // At the /56 position this carries 10.169.254.169. At the /64 position it
    // carries 169.254.169.0.
    expect(isBlockedAddress("64:ff9b:1:ab0a:a9:fea9::")).toBe(true);
  });

  it("allows a NAT64 local-use address where no IPv4 position holds a refused address", () => {
    expect(isBlockedAddress("64:ff9b:1:1234:a:a9fe:a00:0")).toBe(false);
  });

  it.each([
    ["IPv4-mapped, 169.254.0.23", "::ffff:169.254.0.23"],
    ["NAT64 well-known prefix, 169.254.42.42", "64:ff9b::a9fe:2a2a"],
    ["NAT64 well-known prefix, 100.100.100.200", "64:ff9b::6464:64c8"],
    ["NAT64 local-use prefix, 169.254.0.23", "64:ff9b:1::a9fe:17"],
    ["6to4, 100.100.100.200", "2002:6464:64c8::1"],
    [
      "NAT64 local-use prefix as a /48, 100.100.100.200",
      "64:ff9b:1:6464:64:c805::",
    ],
    [
      "NAT64 local-use prefix as a /56, 100.100.100.200",
      "64:ff9b:1:64:64:64c8::",
    ],
    [
      "NAT64 local-use prefix as a /64, 100.100.100.200",
      "64:ff9b:1:0:64:6464:c800:0",
    ],
    ["Teredo server, 100.100.100.200", "2001:0:6464:64c8::1"],
    ["Teredo server, 169.254.0.23", "2001:0:a9fe:17::1"],
    ["IPv4-translated, 169.254.42.42", "::ffff:0:169.254.42.42"],
    [
      "NAT64 local-use prefix as a /96, 100.100.100.200",
      "64:ff9b:1::6464:64c8",
    ],
    ["Teredo client, 100.100.100.200", "2001:0:4136:e378:8000:63bf:9b9b:9b37"],
    ["IPv4-compatible, 100.100.100.200", "::100.100.100.200"],
  ])("blocks a reserved address embedded in %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each([
    ["IPv4-mapped", "::ffff:169.254.1.2"],
    ["NAT64 well-known prefix", "64:ff9b::a9fe:102"],
    ["NAT64 local-use prefix", "64:ff9b:1::a9fe:102"],
    ["6to4", "2002:a9fe:102::1"],
    ["Teredo client", "2001:0:4136:e378:8000:63bf:5601:fefd"],
    ["IPv4-translated", "::ffff:0:169.254.171.1"],
  ])("allows a link-local address embedded in %s", (_, address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });

  it("allows a global address whose low bits look like a link-local address", () => {
    expect(isBlockedAddress("2001:db8::a9fe:a9fe")).toBe(false);
  });
});

function resolveTo(...addresses: LookupAddress[]) {
  return vi.spyOn(dns, "lookup").mockImplementation(((
    _hostname: string,
    options: dns.LookupOptions,
    callback: (
      error: null,
      address: string | LookupAddress[],
      family?: number,
    ) => void,
  ) => {
    if (options.all) {
      callback(null, addresses);
      return;
    }
    callback(null, addresses[0].address, addresses[0].family);
  }) as unknown as typeof dns.lookup);
}

function lookup(hostname: string, all: boolean) {
  return new Promise<{
    error: NodeJS.ErrnoException | null;
    address: string | LookupAddress[];
    family?: number;
  }>(resolve =>
    guardedLookup(hostname, { all }, (error, address, family) =>
      resolve({ error, address, family }),
    ),
  );
}

describe("guardedLookup", () => {
  const blockedLookupError = (hostname: string, address: string) =>
    Object.assign(
      new Error(
        `${hostname} resolves to ${address}, a reserved cloud service or IPv6 link-local address`,
      ),
      { code: blockedLookupErrorCode },
    );

  it("passes every resolved address through when asked for all", async () => {
    const lookupSpy = resolveTo(
      { address: "10.0.0.5", family: 4 },
      { address: "fd00::5", family: 6 },
    );

    const result = await lookup("neptune.example.com", true);

    expect(result).toStrictEqual({
      error: null,
      address: [
        { address: "10.0.0.5", family: 4 },
        { address: "fd00::5", family: 6 },
      ],
      family: undefined,
    });
    expect(lookupSpy).toHaveBeenCalledWith(
      "neptune.example.com",
      { all: true },
      expect.any(Function),
    );
  });

  it("passes the first address through when asked for one", async () => {
    resolveTo({ address: "10.0.0.5", family: 4 });

    const result = await lookup("neptune.example.com", false);

    expect(result).toStrictEqual({
      error: null,
      address: "10.0.0.5",
      family: 4,
    });
  });

  it("resolves with the caller's options and every address", async () => {
    const lookupSpy = resolveTo({ address: "fd00::5", family: 6 });

    await new Promise(resolve =>
      guardedLookup("db.example.com", { family: 6, all: false }, resolve),
    );

    expect(lookupSpy).toHaveBeenCalledWith(
      "db.example.com",
      { family: 6, all: true },
      expect.any(Function),
    );
  });

  it.each([true, false])(
    "fails when any resolved address is blocked (all: %s)",
    async all => {
      resolveTo(
        { address: "10.0.0.5", family: 4 },
        { address: "169.254.169.254", family: 4 },
      );

      const { error } = await lookup("reserved.example.com", all);

      expect(error).toStrictEqual(
        Object.assign(
          new Error(
            "reserved.example.com resolves to 169.254.169.254, a reserved cloud service or IPv6 link-local address",
          ),
          { code: blockedLookupErrorCode },
        ),
      );
    },
  );

  it("blocks a host name that resolves only to a blocked address", async () => {
    resolveTo({ address: "fd00:ec2::254", family: 6 });

    const { error } = await lookup("reserved.example.com", false);

    expect(error).toStrictEqual(
      Object.assign(
        new Error(
          "reserved.example.com resolves to fd00:ec2::254, a reserved cloud service or IPv6 link-local address",
        ),
        { code: blockedLookupErrorCode },
      ),
    );
  });

  it.each([
    ["rootless Podman host alias", "169.254.1.2"],
    ["VPC Lattice", "169.254.171.1"],
    ["container bridge", "169.254.172.2"],
    ["end of the link-local range", "169.254.255.255"],
  ])("passes a link-local address through: %s", async (_, address) => {
    resolveTo({ address, family: 4 });

    const result = await lookup("db.example.com", false);

    expect(result).toStrictEqual({ error: null, address, family: 4 });
  });

  it.each([
    ["169.254.0.23", "169.254.0.23"],
    ["169.254.42.42", "169.254.42.42"],
    ["100.100.100.200", "100.100.100.200"],
    ["an IPv4-mapped 169.254.0.23", "::ffff:169.254.0.23"],
    ["a NAT64 169.254.42.42", "64:ff9b::a9fe:2a2a"],
  ])("blocks a host name that resolves to %s", async (_, address) => {
    resolveTo({ address, family: address.includes(":") ? 6 : 4 });

    const { error } = await lookup("reserved.example.com", true);

    expect(error).toStrictEqual(
      blockedLookupError("reserved.example.com", address),
    );
  });

  describe("with IPv6 link-local answers", () => {
    it.each([true, false])(
      "skips them and uses the other answer (all: %s)",
      async all => {
        resolveTo(
          { address: "fe80::1", family: 6 },
          { address: "10.0.0.5", family: 4 },
        );

        const result = await lookup("db.example.com", all);

        expect(result).toStrictEqual({
          error: null,
          address: all ? [{ address: "10.0.0.5", family: 4 }] : "10.0.0.5",
          family: all ? undefined : 4,
        });
      },
    );

    it("skips a zoned answer", async () => {
      resolveTo(
        { address: "fe80::1%en0", family: 6 },
        { address: "2001:db8::5", family: 6 },
      );

      const result = await lookup("db.example.com", false);

      expect(result).toStrictEqual({
        error: null,
        address: "2001:db8::5",
        family: 6,
      });
    });

    it.each([true, false])(
      "fails when no other answer remains (all: %s)",
      async all => {
        resolveTo({ address: "fe80::1", family: 6 });

        const { error } = await lookup("db.example.com", all);

        expect(error).toStrictEqual(
          blockedLookupError("db.example.com", "fe80::1"),
        );
      },
    );

    it.each([
      ["a reserved IPv4 address", "169.254.169.254"],
      ["a reserved range address", "fd00:ec2::23"],
      ["an IPv4-mapped reserved address", "::ffff:169.254.169.254"],
    ])("still refuses the host when another answer is %s", async (_, other) => {
      resolveTo(
        { address: "fe80::1", family: 6 },
        { address: "10.0.0.5", family: 4 },
        { address: other, family: other.includes(":") ? 6 : 4 },
      );

      const { error } = await lookup("db.example.com", true);

      expect(error).toStrictEqual(blockedLookupError("db.example.com", other));
    });
  });

  it("passes a resolver failure through", async () => {
    const notFound = Object.assign(new Error("getaddrinfo ENOTFOUND"), {
      code: "ENOTFOUND",
    });
    vi.spyOn(dns, "lookup").mockImplementation(((
      _hostname: string,
      _options: unknown,
      callback: (error: Error) => void,
    ) => callback(notFound)) as unknown as typeof dns.lookup);

    const { error } = await lookup("missing.example.com", true);

    expect(error).toBe(notFound);
  });
});

describe("dbAgentOptions", () => {
  it("keeps the settings of Node's global agents", () => {
    expect(dbAgentOptions).toStrictEqual({
      keepAlive: true,
      scheduling: "lifo",
      timeout: 5000,
      lookup: guardedLookup,
    });
    expect(https.globalAgent.options).toMatchObject({
      keepAlive: true,
      scheduling: "lifo",
      timeout: 5000,
    });
  });
});

describe("dbAgentFor", () => {
  let server: http.Server;
  let port: number;

  beforeEach(async () => {
    server = http.createServer((_req, res) => res.end("ok"));
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    dbAgentFor(new URL("http://localhost")).destroy();
    await new Promise(resolve => server.close(resolve));
  });

  function get(host: string) {
    return new Promise<{ status?: number; code?: string }>(resolve => {
      http
        .get(
          { host, port, agent: dbAgentFor(new URL(`http://${host}`)) },
          res => {
            res.resume();
            resolve({ status: res.statusCode });
          },
        )
        .on("error", (error: NodeJS.ErrnoException) =>
          resolve({ code: error.code }),
        );
    });
  }

  it("connects to a host name that resolves to an allowed address", async () => {
    resolveTo({ address: "127.0.0.1", family: 4 });

    expect(await get("db.example.com")).toStrictEqual({ status: 200 });
  });

  it("refuses a host name that resolves to a blocked address", async () => {
    resolveTo({ address: "169.254.169.254", family: 4 });

    expect(await get("reserved.example.com")).toStrictEqual({
      code: blockedLookupErrorCode,
    });
  });

  it("fails a real node-fetch request with the blocked code", async () => {
    const { default: realFetch } =
      await vi.importActual<typeof NodeFetch>("node-fetch");
    resolveTo({ address: "169.254.169.254", family: 4 });

    await expect(
      realFetch(`http://reserved.example.com:${port}/`, {
        agent: dbAgentFor,
      }),
    ).rejects.toMatchObject({ code: blockedLookupErrorCode });
  });

  it("fails a real node-fetch request to an https host with the blocked code", async () => {
    const { default: realFetch } =
      await vi.importActual<typeof NodeFetch>("node-fetch");
    resolveTo({ address: "169.254.169.254", family: 4 });

    await expect(
      realFetch(`https://reserved.example.com:${port}/`, {
        agent: dbAgentFor,
      }),
    ).rejects.toMatchObject({ code: blockedLookupErrorCode });
  });

  it("fails a real node-fetch request to a host with only link-local answers", async () => {
    const { default: realFetch } =
      await vi.importActual<typeof NodeFetch>("node-fetch");
    resolveTo({ address: "fe80::1", family: 6 });

    await expect(
      realFetch(`http://db.example.com:${port}/`, { agent: dbAgentFor }),
    ).rejects.toMatchObject({ code: blockedLookupErrorCode });
  });

  it("fails over from a link-local answer to the answer that connects", async () => {
    const { default: realFetch } =
      await vi.importActual<typeof NodeFetch>("node-fetch");
    resolveTo(
      { address: "fe80::1", family: 6 },
      { address: "127.0.0.1", family: 4 },
    );

    const response = await realFetch(`http://db.example.com:${port}/`, {
      agent: dbAgentFor,
    });

    expect(await response.text()).toBe("ok");
  });

  it("uses an HTTPS agent for https URLs only", () => {
    expect(dbAgentFor(new URL("https://db.example.com"))).toBeInstanceOf(
      https.Agent,
    );
    expect(dbAgentFor(new URL("http://db.example.com"))).not.toBeInstanceOf(
      https.Agent,
    );
  });
});
