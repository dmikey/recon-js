'use strict';

function RecordParser(builder, key, value, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.key = key || null;
  this.value = value || null;
  this.s = s || 1;
}
RecordParser.prototype = Object.create(StringIteratee.prototype);
RecordParser.prototype.constructor = RecordParser;
RecordParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var value = this.value;
  var key = this.key;
  var builder = this.builder || new RecordBuilder();
  if (s === 1) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 123/*'{'*/) {
        input.step();
        s = 2;
      }
      else return new StringIteratee.Error({expected: '\'{\'', found: c});
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  while (!input.isEmpty() || input.isDone()) {
    if (s === 2) {
      while (!input.isEmpty() && (c = input.head(), isWhitespace(c))) input.step();
      if (!input.isEmpty()) {
        if (c === 125/*'}'*/) {
          input.step();
          return new StringIteratee.Done(builder.state());
        }
        else s = 3;
      }
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 3) {
      key = key || new BlockValueParser();
      while ((!input.isEmpty() || input.isDone()) && key.isCont()) key = key.feed(input);
      if (key.isDone()) s = 4;
      else if (key.isError()) return key;
    }
    if (s === 4) {
      while (!input.isEmpty() && (c = input.head(), isSpace(c))) input.step();
      if (!input.isEmpty()) {
        if (c === 58/*':'*/) {
          input.step();
          s = 5;
        }
        else {
          builder.appendValue(key.state());
          key = null;
          s = 7;
        }
      }
      else if (input.isDone()) {
        builder.appendValue(key.state());
        return new StringIteratee.Done(builder.state());
      }
    }
    if (s === 5) {
      while (!input.isEmpty() && isSpace(input.head())) input.step();
      if (!input.isEmpty()) s = 6;
      else if (input.isDone()) {
        builder.appendField(key, null);
        return new StringIteratee.Done(builder.state());
      }
    }
    if (s === 6) {
      value = value || new BlockValueParser();
      while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
      if (value.isDone()) {
        builder.appendField(key.state(), value.state());
        key = null;
        value = null;
        s = 7;
      }
      else if (value.isError()) return value;
    }
    if (s === 7) {
      while (!input.isEmpty() && (c = input.head(), isSpace(c))) input.step();
      if (!input.isEmpty()) {
        if (c === 44/*','*/ || c === 59/*';'*/ || isNewline(c)) {
          input.step();
          s = 2;
        }
        else if (c === 125/*'}'*/) {
          input.step();
          return new StringIteratee.Done(builder.state());
        }
       else return new StringIteratee.Error({expected: '\'}\', \';\', \',\', or newline', found: c});
      }
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new RecordParser(builder, key, value, s);
};

module.exports = RecordParser;