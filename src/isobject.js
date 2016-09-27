'use strict';

function isObject(item) {
  return item !== null && typeof item === 'object' && !(item instanceof Uint8Array);
}

module.exports = isObject;