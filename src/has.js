'use strict';

var get = require('./get');

function has(record, key) {
  return get(record, key) !== undefined;
}

module.exports = has;