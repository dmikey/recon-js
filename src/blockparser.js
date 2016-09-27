'use strict';


function BlockParser(builder, key, value, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.key = key || null;
  this.value = value || null;
  this.s = s || 1;
}
BlockParser.prototype = Object.create(StringIteratee.prototype);
BlockParser.prototype.constructor = BlockParser;
BlockParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var value = this.value;
  var key = this.key;
  var builder = this.builder || new ValueBuilder();
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      while (!input.isEmpty() && (c = input.head(), isWhitespace(c))) input.step();
      if (!input.isEmpty()) {
        if (c === 64/*'@'*/ || c === 123/*'{'*/ || c === 91/*'['*/ || isNameStartChar(c) ||
            c === 34/*'"'*/ || c === 45/*'-'*/ || c >= 48/*'0'*/ && c <= 57/*'9'*/ || c === 37/*'%'*/)
          s = 2;
        else return new StringIteratee.Error({expected: 'block value', found: c});
      }
      else if (input.isDone()) return new StringIteratee.Done(builder.state());
    }
    if (s === 2) {
      key = key || new BlockValueParser();
      while ((!input.isEmpty() || input.isDone()) && key.isCont()) key = key.feed(input);
      if (key.isDone()) s = 3;
      else if (key.isError()) return key;
    }
    if (s === 3) {
      while (!input.isEmpty() && (c = input.head(), isSpace(c))) input.step();
      if (!input.isEmpty()) {
        if (c === 58/*':'*/) {
          input.step();
          s = 4;
        }
        else {
          builder.appendValue(key.state());
          key = null;
          s = 6;
        }
      }
      else if (input.isDone()) {
        builder.appendValue(key.state());
        return new StringIteratee.Done(builder.state());
      }
    }
    if (s === 4) {
      while (!input.isEmpty() && isSpace(input.head())) input.step();
      if (!input.isEmpty()) s = 5;
      else if (input.isDone()) {
        builder.appendField(key.state(), null);
        return new StringIteratee.Done(builder.state());
      }
    }
    if (s === 5) {
      value = value || new BlockValueParser();
      while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
      if (value.isDone()) {
        builder.appendField(key.state(), value.state());
        key = null;
        value = null;
        s = 6;
      }
      else if (value.isError()) return value;
    }
    if (s === 6) {
      while (!input.isEmpty() && (c = input.head(), isSpace(c))) input.step();
      if (!input.isEmpty()) {
        if (c === 44/*','*/ || c === 59/*';'*/ || isNewline(c)) {
          input.step();
          s = 1;
        }
        else return new StringIteratee.Done(builder.state());
      }
      else if (input.isDone()) return new StringIteratee.Done(builder.state());
    }
  }
  return new BlockParser(builder, key, value, s);
};

module.exports = BlockParser;