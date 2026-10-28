/** The 16 bytes of an IPv6 address written without a zone. */
function ipv6Bytes(address: string): number[] {
  let text = address.toLowerCase();
  const dotted = /(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(text);
  if (dotted) {
    const [a, b, c, d] = dotted.slice(1).map(Number);
    text = `${text.slice(0, dotted.index)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const [head, tail] = text.split("::");
  const groups = (part: string) =>
    part ? part.split(":").map(group => parseInt(group, 16)) : [];
  const headGroups = groups(head);
  const tailGroups = tail === undefined ? [] : groups(tail);
  const zeros = Array<number>(8 - headGroups.length - tailGroups.length).fill(
    0,
  );
  return [...headGroups, ...zeros, ...tailGroups].flatMap(group => [
    group >> 8,
    group & 0xff,
  ]);
}

function startsWith(bytes: number[], prefix: number[]) {
  return prefix.every((byte, index) => bytes[index] === byte);
}

function ipv4At(bytes: number[], indexes: number[], mask = 0) {
  return indexes.map(index => bytes[index] ^ mask).join(".");
}

const lastFour = [12, 13, 14, 15];

/**
 * The IPv4 addresses an IPv6 address carries under a translation or tunneling
 * standard, so they can be checked like the IPv4 address they reach. The
 * address must be written without a zone.
 */
export function embeddedIpv4Addresses(address: string): string[] {
  const bytes = ipv6Bytes(address);
  const zeros = (count: number) => Array<number>(count).fill(0);

  // RFC 6052 well-known NAT64 prefix, /96 only.
  if (startsWith(bytes, [0x00, 0x64, 0xff, 0x9b, ...zeros(8)])) {
    return [ipv4At(bytes, lastFour)];
  }
  // RFC 8215 local-use NAT64 prefix. The operator picks the prefix length, so
  // every RFC 6052 position inside it is decoded. Byte 8 is always skipped.
  if (startsWith(bytes, [0x00, 0x64, 0xff, 0x9b, 0x00, 0x01])) {
    return [
      ipv4At(bytes, [6, 7, 9, 10]),
      ipv4At(bytes, [7, 9, 10, 11]),
      ipv4At(bytes, [9, 10, 11, 12]),
      ipv4At(bytes, lastFour),
    ];
  }
  // RFC 3056 6to4.
  if (startsWith(bytes, [0x20, 0x02])) {
    return [ipv4At(bytes, [2, 3, 4, 5])];
  }
  // RFC 4380 Teredo: the server address, then the client's, stored inverted.
  if (startsWith(bytes, [0x20, 0x01, 0x00, 0x00])) {
    return [ipv4At(bytes, [4, 5, 6, 7]), ipv4At(bytes, lastFour, 0xff)];
  }
  // IPv4-compatible (::/96), IPv4-mapped (::ffff:0:0/96), and RFC 2765
  // IPv4-translated (::ffff:0:0:0/96).
  if (
    startsWith(bytes, zeros(12)) ||
    startsWith(bytes, [...zeros(10), 0xff, 0xff]) ||
    startsWith(bytes, [...zeros(8), 0xff, 0xff, 0x00, 0x00])
  ) {
    return [ipv4At(bytes, lastFour)];
  }
  return [];
}
