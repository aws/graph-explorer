import crypto from "crypto-js";
import format from "date-fns/format";

function fixedEncodeURIComponent(str: string) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

// TODO - remove this flag
//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export default class RequestSig {
  private readonly _algorithm = "AWS4-HMAC-SHA256";
  private readonly _region: string;
  private readonly _service: string;
  private readonly _host: string;
  private readonly _ac: string;
  private readonly _sac: string;

  private static _instance: RequestSig | null = null;

  private constructor() {
    this._region = process.env.REACT_APP_AWS_REGION || "us-east-1";
    this._service = process.env.REACT_APP_AWS_SERVICE || "neptune-db";
    this._host = process.env.REACT_APP_AWS_CLUSTER_HOST || "";
    this._ac = process.env.REACT_APP_AWS_ACCESS_KEY || "";
    this._sac = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY || "";

    if (!process.env.REACT_APP_AWS_CLUSTER_HOST) {
      throw new Error(
        "Missing REACT_APP_AWS_CLUSTER_HOST. Host is required to sign requests"
      );
    }

    if (!process.env.REACT_APP_AWS_ACCESS_KEY) {
      throw new Error(
        "Missing REACT_APP_AWS_ACCESS_KEY. ACCESS_KEY is required to sign requests"
      );
    }

    if (!process.env.REACT_APP_AWS_SECRET_ACCESS_KEY) {
      throw new Error(
        "Missing REACT_APP_AWS_SECRET_ACCESS_KEY. SECRET_ACCESS_KEY is required to sign requests"
      );
    }
  }

  public static getInstance() {
    if (!RequestSig._instance) {
      RequestSig._instance = new RequestSig();
    }

    return RequestSig._instance;
  }

  public requestAuthHeaders(url: URL, method: string): HeadersInit {
    const headers = this._sigV4(method, url);

    return {
      ...headers,
      host: this._host,
    };
  }

  private _sigV4(method: string, url: URL) {
    const tmpNow = new Date();
    const now = new Date(
      tmpNow.getUTCFullYear(),
      tmpNow.getUTCMonth(),
      tmpNow.getUTCDate(),
      tmpNow.getUTCHours(),
      tmpNow.getUTCMinutes(),
      tmpNow.getUTCSeconds()
    );

    // Task 1: Canonical Request
    const { canonicalRequest, signedHeaders } = this._getCanonicalRequest(
      method,
      url,
      now
    );

    // Task 2: String to Sign
    const {
      stringToSign,
      credentialScope,
      requestDate,
    } = this._getStringToSign(canonicalRequest, now);

    // Task 3: Signature
    const signature = this._getSignature(this._sac, requestDate, stringToSign);

    // Task 4:
    const authorizationHeader = this._getAuthorizationHeader(
      this._ac,
      credentialScope,
      signedHeaders,
      signature
    );

    const headers: HeadersInit = {
      Authorization: authorizationHeader,
      "x-amz-date": format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    };

    if (process.env.REACT_APP_AWS_SESSION_TOKEN) {
      headers["x-amz-security-token"] = process.env.REACT_APP_AWS_SESSION_TOKEN;
    }

    return headers;
  }

  private _getCanonicalRequest(method: string, url: URL, date: Date) {
    // TODO: Add input checks
    // TODO: Add full conversion instead of simplified version
    //       (simplified version works for use case, but bad practice)

    // Query param processing
    const parsedQueryParams = new Map<string, string>();
    url.searchParams.forEach(function (value, key) {
      parsedQueryParams.set(key, value);
    });

    const sortedQueryParams = new Map([...parsedQueryParams].sort());
    let formattedQueryParams = "";
    sortedQueryParams.forEach(function (value, key) {
      formattedQueryParams +=
        fixedEncodeURIComponent(key) +
        "=" +
        fixedEncodeURIComponent(value) +
        "&";
    });
    formattedQueryParams = formattedQueryParams.slice(0, -1);

    // Header processing (Must include host)
    const parsedHeaders = new Map<string, string>();
    parsedHeaders.set("host", this._host);
    parsedHeaders.set("x-amz-date", format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'"));
    if (process.env.REACT_APP_AWS_SESSION_TOKEN) {
      parsedHeaders.set(
        "x-amz-security-token",
        process.env.REACT_APP_AWS_SESSION_TOKEN
      );
    }

    const sortedHeaders = new Map([...parsedHeaders].sort());
    let formattedHeaders = "";
    let signedHeaders = "";
    sortedHeaders.forEach(function (value, key) {
      formattedHeaders += key + ":" + value + "\n";
      signedHeaders += key + ";";
    });
    signedHeaders = signedHeaders.slice(0, -1);

    const payloadHash = crypto.SHA256("").toString();

    let canonicalRequest = "";
    canonicalRequest += method + "\n";
    canonicalRequest += url.pathname + "\n";
    canonicalRequest += formattedQueryParams + "\n";
    canonicalRequest += formattedHeaders + "\n";
    canonicalRequest += signedHeaders + "\n";
    canonicalRequest += payloadHash;

    return { canonicalRequest, signedHeaders };
  }

  private _getStringToSign(canonicalRequest: string, date: Date) {
    const requestDateTime = format(date, "yyyyMMdd'T'HHmmss'Z'");
    const requestDate = format(date, "yyyyMMdd");
    const credentialScope = `${requestDate}/${this._region}/${this._service}/aws4_request`;

    let stringToSign = "";
    stringToSign += this._algorithm + "\n";
    stringToSign += requestDateTime + "\n";
    stringToSign += credentialScope + "\n";
    stringToSign += crypto.SHA256(canonicalRequest);

    return { stringToSign, requestDate, credentialScope };
  }

  private _getSignature(key: string, dateStamp: string, stringToSign: string) {
    const kDate = crypto.HmacSHA256(dateStamp, "AWS4" + key);
    const kRegion = crypto.HmacSHA256(this._region, kDate);
    const kService = crypto.HmacSHA256(this._service, kRegion);
    const kSigning = crypto.HmacSHA256("aws4_request", kService);

    return crypto.HmacSHA256(stringToSign, kSigning).toString(crypto.enc.Hex);
  }

  private _getAuthorizationHeader(
    accessKey: string,
    credentialScope: string,
    signedHeaders: string,
    signature: string
  ) {
    return (
      `${this._algorithm} Credential=${accessKey}/${credentialScope},` +
      ` SignedHeaders=${signedHeaders}, Signature=${signature}`
    );
  }
}
