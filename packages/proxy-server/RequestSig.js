const crypto = require("crypto-js");
const format = require("date-fns/format");

function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}


class RequestSig {
    _algorithm = "AWS4-HMAC-SHA256";
    _region;
    _service;
    _host;
    _ac;
    _sac;
  
    constructor(accessKey, secretAccessKey, sessionToken) {
      this._region = process.env.REACT_APP_AWS_REGION || "us-east-1";
      this._service = process.env.REACT_APP_AWS_SERVICE || "neptune-db";
      this._host = process.env.REACT_APP_AWS_CLUSTER_HOST || "";
      this._ac = accessKey;
      this._sac = secretAccessKey;
      this._st = sessionToken;

      if (!process.env.REACT_APP_AWS_CLUSTER_HOST) {
        throw new Error(
          "Missing REACT_APP_AWS_CLUSTER_HOST. Host is required to sign requests"
        );
      }
    }
  
    requestAuthHeaders(url, method) {
      const headers = this._sigV4(method, url);
  
      return {
        ...headers,
        host: this._host,
      };
    }
  
    _sigV4(method, url) {
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
  
      // Task 2 to Sign
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
  
      const headers = {
        Authorization: authorizationHeader,
        "x-amz-date": format(now, "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      };
  
      if (this._st) {
        headers["x-amz-security-token"] = this._st;
      }
  
      return headers;
    }
  
    _getCanonicalRequest(method, url, date) {
      // Query param processing
      const parsedQueryParams = new Map();
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
      const parsedHeaders = new Map();
      parsedHeaders.set("host", this._host);
      parsedHeaders.set("x-amz-date", format(date, "yyyy-MM-dd'T'HH:mm:ss'Z'"));
      if (this._st) {
        parsedHeaders.set(
          "x-amz-security-token",
          this._st
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
  
    _getStringToSign(canonicalRequest, date) {
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
  
    _getSignature(key, dateStamp, stringToSign) {
      const kDate = crypto.HmacSHA256(dateStamp, "AWS4" + key);
      const kRegion = crypto.HmacSHA256(this._region, kDate);
      const kService = crypto.HmacSHA256(this._service, kRegion);
      const kSigning = crypto.HmacSHA256("aws4_request", kService);
  
      return crypto.HmacSHA256(stringToSign, kSigning).toString(crypto.enc.Hex);
    }
  
    _getAuthorizationHeader(
      accessKey,
      credentialScope,
      signedHeaders,
      signature
    ) {
      return (
        `${this._algorithm} Credential=${accessKey}/${credentialScope},` +
        ` SignedHeaders=${signedHeaders}, Signature=${signature}`
      );
    }
  }

  module.exports = {
    RequestSig
  };