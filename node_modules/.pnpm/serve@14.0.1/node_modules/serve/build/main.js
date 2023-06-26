#!/usr/bin/env node

// source/main.ts
import path from "node:path";
import chalk3 from "chalk";
import boxen from "boxen";
import clipboard from "clipboardy";
import checkForUpdate from "update-check";

// package.json
var package_default = {
  name: "serve",
  version: "14.0.1",
  description: "Static file serving and directory listing",
  keywords: [
    "vercel",
    "serve",
    "micro",
    "http-server"
  ],
  repository: "vercel/serve",
  license: "MIT",
  type: "module",
  bin: {
    serve: "./build/main.js"
  },
  files: [
    "build/"
  ],
  engines: {
    node: ">= 14"
  },
  scripts: {
    develop: "tsx watch ./source/main.ts",
    start: "node ./build/main.js",
    compile: "tsup ./source/main.ts",
    "test:tsc": "tsc --project tsconfig.json",
    test: "pnpm test:tsc",
    "lint:code": "eslint --max-warnings 0 source/**/*.ts",
    "lint:style": "prettier --check --ignore-path .gitignore .",
    lint: "pnpm lint:code && pnpm lint:style",
    format: "prettier --write --ignore-path .gitignore .",
    prepare: "husky install config/husky && pnpm compile"
  },
  dependencies: {
    "@zeit/schemas": "2.21.0",
    ajv: "8.11.0",
    arg: "5.0.2",
    boxen: "7.0.0",
    chalk: "5.0.1",
    "chalk-template": "0.4.0",
    clipboardy: "3.0.0",
    compression: "1.7.4",
    "is-port-reachable": "4.0.0",
    "serve-handler": "6.1.3",
    "update-check": "1.5.4"
  },
  devDependencies: {
    "@types/compression": "1.7.2",
    "@types/serve-handler": "6.1.1",
    "@vercel/style-guide": "3.0.0",
    eslint: "8.19.0",
    husky: "8.0.1",
    "lint-staged": "13.0.3",
    prettier: "2.7.1",
    tsup: "6.1.3",
    tsx: "3.7.1",
    typescript: "4.6.4"
  },
  tsup: {
    target: "esnext",
    format: [
      "esm"
    ],
    outDir: "./build/"
  },
  prettier: "@vercel/style-guide/prettier",
  eslintConfig: {
    extends: [
      "./node_modules/@vercel/style-guide/eslint/node.js",
      "./node_modules/@vercel/style-guide/eslint/typescript.js"
    ],
    parserOptions: {
      project: "tsconfig.json"
    }
  },
  "lint-staged": {
    "*": [
      "prettier --ignore-unknown --write"
    ],
    "source/**/*.ts": [
      "eslint --max-warnings 0 --fix"
    ]
  }
};

// source/utilities/promise.ts
import { promisify } from "node:util";
var resolve = (promise) => promise.then((data) => [void 0, data]).catch((error2) => [error2, void 0]);

// source/utilities/server.ts
import http from "node:http";
import https from "node:https";
import { readFile } from "node:fs/promises";
import handler from "serve-handler";
import compression from "compression";
import isPortReachable from "is-port-reachable";

// source/utilities/http.ts
import { parse } from "node:url";
import { networkInterfaces as getNetworkInterfaces } from "node:os";
var networkInterfaces = getNetworkInterfaces();
var parseEndpoint = (uriOrPort) => {
  if (!isNaN(Number(uriOrPort)))
    return [uriOrPort];
  const endpoint = uriOrPort;
  const url = parse(endpoint);
  switch (url.protocol) {
    case "pipe:": {
      const pipe = endpoint.replace(/^pipe:/, "");
      if (!pipe.startsWith("\\\\.\\"))
        throw new Error(`Invalid Windows named pipe endpoint: ${endpoint}`);
      return [pipe];
    }
    case "unix:":
      if (!url.pathname)
        throw new Error(`Invalid UNIX domain socket endpoint: ${endpoint}`);
      return [url.pathname];
    case "tcp:":
      url.port = url.port ?? "3000";
      url.hostname = url.hostname ?? "localhost";
      return [parseInt(url.port, 10), url.hostname];
    default:
      throw new Error(`Unknown --listen endpoint scheme (protocol): ${url.protocol ?? "undefined"}`);
  }
};
var registerCloseListener = (fn) => {
  let run = false;
  const wrapper = () => {
    if (!run) {
      run = true;
      fn();
    }
  };
  process.on("SIGINT", wrapper);
  process.on("SIGTERM", wrapper);
  process.on("exit", wrapper);
};
var getNetworkAddress = () => {
  for (const interfaceDetails of Object.values(networkInterfaces)) {
    if (!interfaceDetails)
      continue;
    for (const details of interfaceDetails) {
      const { address, family, internal } = details;
      if (family === "IPv4" && !internal)
        return address;
    }
  }
};

// source/utilities/server.ts
var compress = promisify(compression());
var startServer = async (endpoint, config2, args2, previous) => {
  const serverHandler = (request, response) => {
    const run = async () => {
      if (args2["--cors"])
        response.setHeader("Access-Control-Allow-Origin", "*");
      if (!args2["--no-compression"])
        await compress(request, response);
      await handler(request, response, config2);
    };
    run().catch((error2) => {
      throw error2;
    });
  };
  const useSsl = args2["--ssl-cert"] && args2["--ssl-key"];
  const httpMode = useSsl ? "https" : "http";
  const sslPass = args2["--ssl-pass"];
  const serverConfig = httpMode === "https" && args2["--ssl-cert"] && args2["--ssl-key"] ? {
    key: await readFile(args2["--ssl-key"]),
    cert: await readFile(args2["--ssl-cert"]),
    passphrase: sslPass ? await readFile(sslPass, "utf8") : ""
  } : {};
  const server = httpMode === "https" ? https.createServer(serverConfig, serverHandler) : http.createServer(serverHandler);
  const getServerDetails = () => {
    registerCloseListener(() => server.close());
    const details = server.address();
    let local;
    let network;
    if (typeof details === "string") {
      local = details;
    } else if (typeof details === "object" && details.port) {
      let address;
      if (details.address === "::")
        address = "localhost";
      else if (details.family === "IPv6")
        address = `[${details.address}]`;
      else
        address = details.address;
      const ip = getNetworkAddress();
      local = `${httpMode}://${address}:${details.port}`;
      network = ip ? `${httpMode}://${ip}:${details.port}` : void 0;
    }
    return {
      local,
      network,
      previous
    };
  };
  server.on("error", (error2) => {
    throw new Error(`Failed to serve: ${error2.stack?.toString() ?? error2.message}`);
  });
  if (typeof endpoint[0] === "number" && !isNaN(endpoint[0]) && endpoint[0] !== 0) {
    const port = endpoint[0];
    const isClosed = await isPortReachable(port, {
      host: endpoint[1] ?? "localhost"
    });
    if (isClosed)
      return startServer([0], config2, args2, port);
  }
  return new Promise((resolve2, _reject) => {
    if (endpoint.length === 1 && typeof endpoint[0] === "number")
      server.listen(endpoint[0], () => resolve2(getServerDetails()));
    else if (endpoint.length === 1 && typeof endpoint[0] === "string")
      server.listen(endpoint[0], () => resolve2(getServerDetails()));
    else if (endpoint.length === 2 && typeof endpoint[0] === "number" && typeof endpoint[1] === "string")
      server.listen(endpoint[0], endpoint[1], () => resolve2(getServerDetails()));
  });
};

// source/utilities/cli.ts
import chalk from "chalk-template";
import parseArgv from "arg";
var options = {
  "--help": Boolean,
  "--version": Boolean,
  "--listen": [parseEndpoint],
  "--single": Boolean,
  "--debug": Boolean,
  "--config": String,
  "--no-clipboard": Boolean,
  "--no-compression": Boolean,
  "--no-etag": Boolean,
  "--symlinks": Boolean,
  "--cors": Boolean,
  "--no-port-switching": Boolean,
  "--ssl-cert": String,
  "--ssl-key": String,
  "--ssl-pass": String,
  "-h": "--help",
  "-v": "--version",
  "-l": "--listen",
  "-s": "--single",
  "-d": "--debug",
  "-c": "--config",
  "-n": "--no-clipboard",
  "-u": "--no-compression",
  "-S": "--symlinks",
  "-C": "--cors",
  "-p": "--listen"
};
var helpText = chalk`
  {bold.cyan serve} - Static file serving and directory listing

  {bold USAGE}

    {bold $} {cyan serve} --help
    {bold $} {cyan serve} --version
    {bold $} {cyan serve} folder_name
    {bold $} {cyan serve} [-l {underline listen_uri} [-l ...]] [{underline directory}]

    By default, {cyan serve} will listen on {bold 0.0.0.0:3000} and serve the
    current working directory on that address.

    Specifying a single {bold --listen} argument will overwrite the default, not supplement it.

  {bold OPTIONS}

    --help                              Shows this help message

    -v, --version                       Displays the current version of serve

    -l, --listen {underline listen_uri}             Specify a URI endpoint on which to listen (see below) -
                                        more than one may be specified to listen in multiple places

    -p                                  Specify custom port

    -d, --debug                         Show debugging information

    -s, --single                        Rewrite all not-found requests to \`index.html\`

    -c, --config                        Specify custom path to \`serve.json\`

    -C, --cors                          Enable CORS, sets \`Access-Control-Allow-Origin\` to \`*\`

    -n, --no-clipboard                  Do not copy the local address to the clipboard

    -u, --no-compression                Do not compress files

    --no-etag                           Send \`Last-Modified\` header instead of \`ETag\`

    -S, --symlinks                      Resolve symlinks instead of showing 404 errors
    
    --ssl-cert                          Optional path to an SSL/TLS certificate to serve with HTTPS
    
    --ssl-key                           Optional path to the SSL/TLS certificate\'s private key

    --ssl-pass                          Optional path to the SSL/TLS certificate\'s passphrase

    --no-port-switching                 Do not open a port other than the one specified when it\'s taken.

  {bold ENDPOINTS}

    Listen endpoints (specified by the {bold --listen} or {bold -l} options above) instruct {cyan serve}
    to listen on one or more interfaces/ports, UNIX domain sockets, or Windows named pipes.

    For TCP ports on hostname "localhost":

      {bold $} {cyan serve} -l {underline 1234}

    For TCP (traditional host/port) endpoints:

      {bold $} {cyan serve} -l tcp://{underline hostname}:{underline 1234}

    For UNIX domain socket endpoints:

      {bold $} {cyan serve} -l unix:{underline /path/to/socket.sock}

    For Windows named pipe endpoints:

      {bold $} {cyan serve} -l pipe:\\\\.\\pipe\\{underline PipeName}
`;
var parseArguments = () => parseArgv(options);
var getHelpText = () => helpText;

// source/utilities/config.ts
import {
  resolve as resolvePath,
  relative as resolveRelativePath
} from "node:path";
import { readFile as readFile2 } from "node:fs/promises";
import Ajv from "ajv";
import schema from "@zeit/schemas/deployment/config-static.js";
var loadConfiguration = async (cwd2, entry2, args2) => {
  const files = ["serve.json", "now.json", "package.json"];
  if (args2["--config"])
    files.unshift(args2["--config"]);
  const config2 = {};
  for (const file of files) {
    const location = resolvePath(entry2, file);
    const [error2, rawContents] = await resolve(readFile2(location, "utf8"));
    if (error2) {
      if (error2.code === "ENOENT" && file !== args2["--config"])
        continue;
      else
        throw new Error(`Could not read configuration from file ${location}: ${error2.message}`);
    }
    let parsedJson;
    try {
      parsedJson = JSON.parse(rawContents);
      if (typeof parsedJson !== "object")
        throw new Error("configuration is not an object");
    } catch (parserError) {
      throw new Error(`Could not parse ${location} as JSON: ${parserError.message}`);
    }
    if (file === "now.json") {
      parsedJson = parsedJson;
      parsedJson = parsedJson.now.static;
    } else if (file === "package.json") {
      parsedJson = parsedJson;
      parsedJson = parsedJson.static;
    }
    if (!parsedJson)
      continue;
    Object.assign(config2, parsedJson);
    break;
  }
  if (entry2) {
    const staticDirectory = config2.public;
    config2.public = resolveRelativePath(cwd2, staticDirectory ? resolvePath(entry2, staticDirectory) : entry2);
  }
  if (Object.keys(config2).length !== 0) {
    const ajv = new Ajv({ allowUnionTypes: true });
    const validate = ajv.compile(schema);
    if (!validate(config2) && validate.errors) {
      const defaultMessage = "The configuration you provided is invalid:";
      const error2 = validate.errors[0];
      throw new Error(`${defaultMessage}
${error2.message ?? ""}
${JSON.stringify(error2.params)}`);
    }
  }
  config2.etag = !args2["--no-etag"];
  config2.symlinks = args2["--symlinks"] || config2.symlinks;
  return config2;
};

// source/utilities/logger.ts
import chalk2 from "chalk";
var info = (...message) => console.error(chalk2.magenta("INFO:", ...message));
var warn = (...message) => console.error(chalk2.yellow("WARNING:", ...message));
var error = (...message) => console.error(chalk2.red("ERROR:", ...message));
var log = console.log;
var logger = { info, warn, error, log };

// source/main.ts
var printUpdateNotification = async (debugMode) => {
  const [error2, update] = await resolve(checkForUpdate(package_default));
  if (error2) {
    const suffix = debugMode ? ":" : " (use `--debug` to see full error).";
    logger.warn(`Checking for updates failed${suffix}`);
    if (debugMode)
      logger.error(error2.message);
  }
  if (!update)
    return;
  logger.log(chalk3.bgRed.white(" UPDATE "), `The latest version of \`serve\` is ${update.latest}.`);
};
var args;
try {
  args = parseArguments();
} catch (error2) {
  logger.error(error2.message);
  process.exit(1);
}
if (process.env.NO_UPDATE_CHECK !== "1")
  await printUpdateNotification(args["--debug"]);
if (args["--version"]) {
  logger.log(package_default.version);
  process.exit(0);
}
if (args["--help"]) {
  logger.log(getHelpText());
  process.exit(0);
}
if (!args["--listen"])
  args["--listen"] = [
    [process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3]
  ];
if (args._.length > 1) {
  logger.error("Please provide one path argument at maximum");
  process.exit(1);
}
if (args["--config"] === "now.json" || args["--config"] === "package.json")
  logger.warn("The config files `now.json` and `package.json` are deprecated. Please use `serve.json`.");
var cwd = process.cwd();
var entry = args._[0] ? path.resolve(args._[0]) : cwd;
var config = await loadConfiguration(cwd, entry, args);
if (args["--single"]) {
  const { rewrites } = config;
  const existingRewrites = Array.isArray(rewrites) ? rewrites : [];
  config.rewrites = [
    {
      source: "**",
      destination: "/index.html"
    },
    ...existingRewrites
  ];
}
for (const endpoint of args["--listen"]) {
  const { local, network, previous } = await startServer(endpoint, config, args);
  const copyAddress = !args["--no-clipboard"];
  if (!process.stdout.isTTY || process.env.NODE_ENV === "production") {
    const suffix = local ? ` at ${local}.` : ".";
    logger.info(`Accepting connections${suffix}`);
    continue;
  }
  let message = chalk3.green("Serving!");
  if (local) {
    const prefix = network ? "- " : "";
    const space = network ? "            " : "  ";
    message += `

${chalk3.bold(`${prefix}Local:`)}${space}${local}`;
  }
  if (network)
    message += `
${chalk3.bold("- On Your Network:")}  ${network}`;
  if (previous)
    message += chalk3.red(`

This port was picked because ${chalk3.underline(previous.toString())} is in use.`);
  if (copyAddress && local) {
    try {
      await clipboard.write(local);
      message += `

${chalk3.grey("Copied local address to clipboard!")}`;
    } catch (error2) {
      logger.error(`Cannot copy server address to clipboard: ${error2.message}.`);
    }
  }
  logger.log(boxen(message, {
    padding: 1,
    borderColor: "green",
    margin: 1
  }));
}
registerCloseListener(() => {
  logger.log();
  logger.info("Gracefully shutting down. Please wait...");
  process.on("SIGINT", () => {
    logger.log();
    logger.warn("Force-closing all open sockets...");
    process.exit(0);
  });
});
