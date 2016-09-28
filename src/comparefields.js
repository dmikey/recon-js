'use strict';

var compareName = require('./comparename');
var compare = require('./compare');

function compareFields(x, y) {
  var xKeys = Object.keys(x);
  var yKeys = Object.keys(y);
  var p = xKeys.length;
  var q = yKeys.length;
  for (var i = 0, n = Math.min(p, q), order = 0; i < n && order === 0; i += 1) {
    var xKey = xKeys[i];
    var yKey = yKeys[i];
    order = compareName(xKey, yKey);
    if (order === 0) order = compare(x[xKey], y[yKey]);
  }
  return order !== 0 ? order : p > q ? 1 : p < q ? -1 : 0;
}

module.exports = compareFields;