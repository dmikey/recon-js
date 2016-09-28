'use strict';

var StringIteratee = require('./stringiteratee');
var isAlpha = require('./isalpha');
var toLowerCase = require('./tolowercase');
var isSchemeChar = require('./isschemechar');
var StringBuilder = require('./stringbuilder');

function SchemeParser(builder, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.s = s || 1;
}
SchemeParser.prototype = Object.create(StringIteratee.prototype);
SchemeParser.prototype.constructor = SchemeParser;
SchemeParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var builder = this.builder || new StringBuilder();
  if (s === 1) {
    if (!input.isEmpty() && (c = input.head(), isAlpha(c))) {
      input.step();
      builder.append(toLowerCase(c));
      s = 2;
    }
    else if (!input.isEmpty() || input.isDone()) {
      return new StringIteratee.Error({expected: 'scheme', found: c});
    }
  }
  if (s === 2) {
    while (!input.isEmpty() && (c = input.head(), isSchemeChar(c))) {
      input.step();
      builder.append(toLowerCase(c));
    }
    if (!input.isEmpty() || input.isDone()) return new StringIteratee.Done(builder.state());
  }
  return new SchemeParser(builder, s);
};
SchemeParser.prototype.state = function () {
  if (this.builder) return this.builder.state();
};

module.exports = SchemeParser;