'use strict';

var StringIteratee = require('./stringiteratee');
var isPathChar = require('./ispathchar');
var StringBuilder = require('./stringbuilder');
var isHexChar = require('./ishexchar');
var decodeHex = require('./decodehex');

function PathParser(path, builder, c1, s) {
  StringIteratee.call(this);
  this.path = path || null;
  this.builder = builder || null;
  this.c1 = c1 || 0;
  this.s = s || 1;
}
PathParser.prototype = Object.create(StringIteratee.prototype);
PathParser.prototype.constructor = PathParser;
PathParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var c1 = this.c1;
  var builder = this.builder;
  var path = this.path;
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      while (!input.isEmpty() && (c = input.head(), isPathChar(c))) {
        builder = builder || new StringBuilder();
        input.step();
        builder.append(c);
      }
      if (!input.isEmpty() && c === 47/*'/'*/) {
        input.step();
        path = path || [];
        if (builder) {
          path.push(builder.state());
          builder = null;
        }
        path.push('/');
      }
      else if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 2;
      }
      else if (!input.isEmpty() || input.isDone()) {
        path = path || [];
        if (builder) path.push(builder.state());
        return new StringIteratee.Done(path);
      }
    }
    if (s === 2) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        c1 = c;
        s = 3;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 3) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        builder = builder || new StringBuilder();
        input.step();
        builder.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 1;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new PathParser(path, builder, c1, s);
};
PathParser.prototype.state = function () {
  if (this.path) return this.path;
  else return [];
};

module.exports = PathParser;