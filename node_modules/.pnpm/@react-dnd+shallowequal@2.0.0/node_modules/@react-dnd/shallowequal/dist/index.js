
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./shallowequal.cjs.production.min.js')
} else {
  module.exports = require('./shallowequal.cjs.development.js')
}
