'use strict';

var isUnreservedChar = require('./isunreservedchar');
var isSubDelimChar = require('./issubdelimchar');

function isFragmentChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 47/*'/'*/ || c === 58/*':'*/ ||
    c === 63/*'?'*/ || c === 64/*'@'*/);
}

module.exports = isFragmentChar;