'use strict';

var StringIteratee = require('./stringiteratee');
var StringBuilder = require('./stringbuilder');
var InlineValueParser = require('./inlinevalueparser');
var RecordParser = require('./recordparser');
var RecordBuilder = require('./recordbuilder');

function MarkupParser(builder, text, value, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.text = text || null;
  this.value = value || null;
  this.s = s || 1;
}
MarkupParser.prototype = Object.create(StringIteratee.prototype);
MarkupParser.prototype.constructor = MarkupParser;
MarkupParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var value = this.value;
  var text = this.text;
  var builder = this.builder;
  if (s === 1) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 91/*'['*/) {
        input.step();
        s = 2;
      }
      else return new StringIteratee.Error({expected: '\'[\'', found: c});
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  while (!input.isEmpty() || input.isDone()) {
    if (s === 2) {
      while (!input.isEmpty() && (c = input.head(),
          c !== 64/*'@'*/ &&
          c !== 91/*'['*/ &&
          c !== 92/*'\\'*/ &&
          c !== 93/*']'*/ &&
          c !== 123/*'{'*/ &&
          c !== 125/*'}'*/)) {
        input.step();
        text = text || new StringBuilder();
        text.append(c);
      }
      if (!input.isEmpty()) {
        if (c === 93/*']'*/) {
          input.step();
          builder = builder || new RecordBuilder();
          if (text) builder.appendValue(text.state());
          return new StringIteratee.Done(builder.state());
        }
        else if (c === 64/*'@'*/) {
          builder = builder || new RecordBuilder();
          if (text) {
            builder.appendValue(text.state());
            text = null;
          }
          value = new InlineValueParser();
          s = 3;
        }
        else if (c === 123/*'{'*/) {
          builder = builder || new RecordBuilder();
          if (text) {
            builder.appendValue(text.state());
            text = null;
          }
          value = new RecordParser(builder);
          s = 4;
        }
        else if (c === 91/*'['*/) {
          builder = builder || new RecordBuilder();
          if (text) {
            builder.appendValue(text.state());
            text = null;
          }
          value = new MarkupParser(builder);
          s = 4;
        }
        else if (c === 92/*'\\'*/) {
          input.step();
          s = 5;
        }
        else new StringIteratee.Error({found: c});
      }
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 3) {
      while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
      if (value.isDone()) {
        builder.appendValue(value.state());
        value = null;
        s = 2;
      }
      else if (value.isError()) return value;
    }
    if (s === 4) {
      while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
      if (value.isDone()) {
        value = null;
        s = 2;
      }
      else if (value.isError()) return value;
    }
    if (s === 5) {
      if (!input.isEmpty()) {
        c = input.head();
        text = text || new StringBuilder();
        if (c === 34/*'"'*/ ||
            c === 47/*'/'*/ ||
            c === 64/*'@'*/ ||
            c === 91/*'['*/ ||
            c === 92/*'\\'*/ ||
            c === 93/*']'*/ ||
            c === 123/*'{'*/ ||
            c === 125/*'}'*/) {
          input.step();
          text.append(c);
          s = 2;
        }
        else if (c === 98/*'b'*/) {
          input.step();
          text.append(8/*'\b'*/);
          s = 2;
        }
        else if (c === 102/*'f'*/) {
          input.step();
          text.append(12/*'\f'*/);
          s = 2;
        }
        else if (c === 110/*'n'*/) {
          input.step();
          text.append(10/*'\n'*/);
          s = 2;
        }
        else if (c === 114/*'r'*/) {
          input.step();
          text.append(13/*'\r'*/);
          s = 2;
        }
        else if (c === 116/*'t'*/) {
          input.step();
          text.append(9/*'\t'*/);
          s = 2;
        }
        else return new StringIteratee.Error({expected: 'escape character', found: c});
      }
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new MarkupParser(builder, text, value, s);
};

module.exports = MarkupParser;