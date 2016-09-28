'use strict';


function isQueryChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 47/*'/'*/ || c === 58/*':'*/ ||
    c === 63/*'?'*/ || c === 64/*'@'*/);
}

module.exports = isQueryChar;