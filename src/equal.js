'use strict';

var isRecord = require('./isrecord');
var equalRecord = require('./equalrecord');
var isField = require('./isfield');
var equalFields = require('./equalfields');
var equalData = require('./equaldata');

function equal(x, y) {
  if (x === y) return true;
  if (isRecord(x) && isRecord(y)) return equalRecord(x, y);
  if (isField(x) && isField(y)) return equalFields(x, y);
  if (x instanceof Uint8Array && y instanceof Uint8Array) return equalData(x, y);
  return false;
}

module.exports = equal;