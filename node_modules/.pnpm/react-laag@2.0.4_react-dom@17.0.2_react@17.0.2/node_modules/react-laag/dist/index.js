if (process.env.NODE_ENV === "production") {
  module.exports = require("./react-laag.cjs.production.min.js");
} else {
  module.exports = require("./react-laag.cjs.development.js");
}