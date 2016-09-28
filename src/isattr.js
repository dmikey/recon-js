'use strict';

var isField = require('./isfield');

function isAttr(item) {
  if (!isField(item)) return false;
  var keys = Object.keys(item);
  var n = keys.length;
  if (n === 0) return false;
  for (var i = 0; i < n; i += 1) {
    var key = keys[i];
    if (key.length === 0 || key.charCodeAt(0) !== 64/*'@'*/) return false;
  }
  return true;
}

module.exports = isAttr;