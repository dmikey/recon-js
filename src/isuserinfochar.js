'use strict';

var isUnreservedChar = require('./isunreservedchar');
var isSubDelimChar = require('./issubdelimchar');

function isUserInfoChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 58/*':'*/);
}

module.exports = isUserInfoChar;