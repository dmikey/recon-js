'use strict';

function isField(item) {
  return item !== null && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Uint8Array);
}

module.exports = isField;