import { clientRoot, proxyServerRoot } from "./paths.js";

test("clientRoot is points to graph-explorer", () => {
  expect(clientRoot).toMatch("/packages/graph-explorer");
});

test("proxyServerRoot points to graph-explorer-proxy-server", () => {
  expect(proxyServerRoot).toMatch("/packages/graph-explorer-proxy-server");
});
