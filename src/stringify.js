'use strict';

var ReconWriter = require('./reconwriter');

function stringify(value, options) {
  var writer = new ReconWriter();
  if (options && options.block === false) writer.writeValue(value);
  else writer.writeBlock(value);
  return writer.state();
}

module.exports = stringify;