'use strict';

var StringIteratee = require('./stringiteratee');
var HostLiteralParser = require('./hostliteralparser');
var HostAddressParser = require('./hostaddressparser');

function HostParser() {
  StringIteratee.call(this);
}
HostParser.prototype = Object.create(StringIteratee.prototype);
HostParser.prototype.constructor = HostParser;
HostParser.prototype.feed = function (input) {
  if (!input.isEmpty()) {
    var c = input.head();
    if (c === 91/*'['*/) return new HostLiteralParser().feed(input);
    else return new HostAddressParser().feed(input);
  }
  return this;
};

module.exports = HostParser;