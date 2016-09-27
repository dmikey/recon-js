'use strict';

function isRecord(item) {
  return Array.isArray(item) && !(item instanceof Uint8Array);
}

module.exports = isRecord;