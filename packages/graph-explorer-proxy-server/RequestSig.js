const aws4 = require("aws4");

class RequestSig {
    _algorithm = "AWS4-HMAC-SHA256";
    _region;
<<<<<<< HEAD
    _service = "neptune-db";
=======
    _service;
>>>>>>> beca7aa (12/09 12:22PM push)
    _host;
    _ac;
    _sac;
  
    constructor(host, region, accessKey, secretAccessKey, sessionToken) {
      this._region = region;
<<<<<<< HEAD
=======
      this._service = "neptune-db";
>>>>>>> beca7aa (12/09 12:22PM push)
      this._host = host;
      this._ac = accessKey;
      this._sac = secretAccessKey;
      this._st = sessionToken;
    }

    requestAuthHeaders(inputPort, requestedPath) {
      var opts = { host: this._host.split(":")[0], path: requestedPath, service: this._service, region: this._region, port: inputPort };

<<<<<<< HEAD
      return aws4.sign(opts, {accessKeyId: this._ac, secretAccessKey: this._sac, sessionToken: this._st});
=======
        return aws4.sign(opts, {accessKeyId: this._ac, secretAccessKey: this._sac, sessionToken: this._st});
>>>>>>> beca7aa (12/09 12:22PM push)
    }
  }

  module.exports = {
    RequestSig
  };