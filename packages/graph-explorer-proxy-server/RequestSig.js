const aws4 = require("aws4");

class RequestSig {
    _algorithm = "AWS4-HMAC-SHA256";
    _region;
    _service = "neptune-db";
    _host;
    _ac;
    _sac;
  
    constructor(host, region, accessKey, secretAccessKey, sessionToken) {
      this._region = region;
      this._host = host;
      this._ac = accessKey;
      this._sac = secretAccessKey;
      this._st = sessionToken;
    }

    requestAuthHeaders(inputPort, requestedPath) {
      var opts = { host: this._host.split(":")[0], path: requestedPath, service: this._service, region: this._region, port: inputPort };
      console.log("----ABOUT TO SIGN REQUEST WITH ----");
      console.log(this._ac);
      console.log(this._sac);
      console.log(this._region);
      console.log(this._host);
      console.log(this._service);
      console.log("--------");
      return aws4.sign(opts, {accessKeyId: this._ac, secretAccessKey: this._sac, sessionToken: this._st});
    }
  }

  module.exports = {
    RequestSig
  };