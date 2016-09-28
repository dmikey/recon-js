'use strict';

function isUserInfoChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 58/*':'*/);
}

module.exports = isUserInfoChar;