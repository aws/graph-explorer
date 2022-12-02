const aws4 = require("aws4");

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

    requestAuthHeaders(inputPort, requestedPath) {
      var opts = { host: this._host.split(":")[0], path: requestedPath, service: this._service, region: this._region, port: inputPort };

      if (process.env.REACT_APP_AWS_AUTH_REQUIRED) {
        return aws4.sign(opts, {accessKeyId: this._ac, secretAccessKey: this._sac, sessionToken: this._st});
      } else {
        return opts;
      }
    }
  }

  module.exports = {
    RequestSig
  };