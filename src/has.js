'use strict';

function has(record, key) {
  return get(record, key) !== undefined;
}

module.exports = has;