'use strict';

var StringIteratee = require('./stringiteratee');
var StringBuilder = require('./stringbuilder');
var isHostChar = require('./ishostchar');
var toLowerCase = require('./tolowercase');

function HostLiteralParser(builder, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.s = s || 1;
}
HostLiteralParser.prototype = Object.create(StringIteratee.prototype);
HostLiteralParser.prototype.constructor = HostLiteralParser;
HostLiteralParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var builder = this.builder;
  if (s === 1) {
    if (!input.isEmpty() && (c = input.head(), c === 91/*'['*/)) {
      input.step();
      s = 2;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: '\'[\'', found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 2) {
    builder = builder || new StringBuilder();
    while (!input.isEmpty() && (c = input.head(), isHostChar(c) || c === 58/*':'*/)) {
      input.step();
      builder.append(toLowerCase(c));
    }
    if (!input.isEmpty() && c === 93/*']'*/) {
      input.step();
      var host = {ipv6: builder.state()};
      return new StringIteratee.Done(host);
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  return new HostLiteralParser(builder, s);
};
HostLiteralParser.prototype.state = function () {
  if (this.builder) return {ipv6: this.builder.state()};
};

module.exports = HostLiteralParser;