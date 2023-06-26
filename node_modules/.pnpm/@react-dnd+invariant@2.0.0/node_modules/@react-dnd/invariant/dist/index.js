
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./invariant.cjs.production.min.js')
} else {
  module.exports = require('./invariant.cjs.development.js')
}
