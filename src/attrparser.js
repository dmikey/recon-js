'use strict';

function AttrParser(ident, value, s) {
  StringIteratee.call(this);
  this.ident = ident || null;
  this.value = value || new BlockParser();
  this.s = s || 1;
}
AttrParser.prototype = Object.create(StringIteratee.prototype);
AttrParser.prototype.constructor = AttrParser;
AttrParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var value = this.value;
  var ident = this.ident;
  var field;
  if (s === 1) {
    if (!input.isEmpty() && (c = input.head(), c === 64/*'@'*/)) {
      input.step();
      s = 2;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: '\'@\'', found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 2) {
    if (!ident) ident = new IdentParser(new StringBuilder('@'));
    ident = ident.feed(input);
    if (ident.isDone()) s = 3;
    else if (ident.isError()) return ident;
  }
  if (s === 3) {
    if (!input.isEmpty() && input.head() === 40/*'('*/) {
      input.step();
      s = 4;
    }
    else if (!input.isEmpty() || input.isDone()) {
      field = {};
      field[ident.state()] = null;
      return new StringIteratee.Done(field);
    }
  }
  if (s === 4) {
    while (!input.isEmpty() && (c = input.head(), isWhitespace(c))) input.step();
    if (!input.isEmpty()) {
      if (c === 41/*')'*/) {
        input.step();
        field = {};
        field[ident.state()] = null;
        return new StringIteratee.Done(field);
      }
      else s = 5;
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 5) {
    while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
    if (value.isDone()) s = 6;
    else if (value.isError()) return value;
  }
  if (s === 6) {
    while (!input.isEmpty() && (c = input.head(), isWhitespace(c))) input.step();
    if (!input.isEmpty()) {
      if (c === 41/*')'*/) {
        input.step();
        field = {};
        field[ident.state()] = value.state();
        return new StringIteratee.Done(field);
      }
      else return new StringIteratee.Error({expected: '\')\'', found: c});
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  return new AttrParser(ident, value, s);
};

module.exports = AttrParser;