'use strict';

function isUserChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c));
}

module.exports = isUserChar;