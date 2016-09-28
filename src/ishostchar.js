'use strict'

function isHostChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c));
}

module.exports = isHostChar;