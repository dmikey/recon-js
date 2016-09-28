'use strict';

var equal = require('./equal');

function equalFields(x, y) {
  var xKeys = Object.keys(x);
  var yKeys = Object.keys(y);
  var n = xKeys.length;
  if (n !== yKeys.length) return false;
  for (var i = 0; i < n; i += 1) {
    var key = xKeys[i];
    if (!equal(x[key], y[key])) return false;
  }
  return true;
}

module.exports = equalFields;