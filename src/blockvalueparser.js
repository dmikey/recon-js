'use strict';

var StringIteratee = require('./stringiteratee');
var AttrParser = require('./attrparser');
var RecordBuilder = require('./recordbuilder');
var RecordParser = require('./recordparser');
var MarkupParser = require('./markupparser');
var isNameStartChar = require('./isnamestartchar');
var IdentParser = require('./identparser');
var StringParser = require('./stringparser');
var NumberParser = require('./numberparser');
var DataParser = require('./dataparser');
var ValueBuilder = require('./valuebuilder');
var isSpace = require('./isspace');

function BlockValueParser(builder, field, value, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.field = field || null;
  this.value = value || null;
  this.s = s || 1;
}
BlockValueParser.prototype = Object.create(StringIteratee.prototype);
BlockValueParser.prototype.constructor = BlockValueParser;
BlockValueParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var value = this.value;
  var field = this.field;
  var builder = this.builder;
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      if (!input.isEmpty()) {
        c = input.head();
        if (c === 64/*'@'*/) {
          field = new AttrParser();
          s = 2;
        }
        else if (c === 123/*'{'*/) {
          builder = builder || new RecordBuilder();
          value = new RecordParser(builder);
          s = 5;
        }
        else if (c === 91/*'['*/) {
          builder = builder || new RecordBuilder();
          value = new MarkupParser(builder);
          s = 5;
        }
        else if (isNameStartChar(c)) {
          value = new IdentParser();
          s = 4;
        }
        else if (c === 34/*'"'*/) {
          value = new StringParser();
          s = 4;
        }
        else if (c === 45/*'-'*/ || c >= 48/*'0'*/ && c <= 57/*'9'*/) {
          value = new NumberParser();
          s = 4;
        }
        else if (c === 37/*'%'*/) {
          value = new DataParser();
          s = 4;
        }
        else if (!builder) return new StringIteratee.Done(undefined);
        else return new StringIteratee.Done(builder.state());
      }
      else if (input.isDone()) {
        if (!builder) return new StringIteratee.Done(undefined);
        else return new StringIteratee.Done(builder.state());
      }
    }
    if (s === 2) {
      while ((!input.isEmpty() || input.isDone()) && field.isCont()) field = field.feed(input);
      if (field.isDone()) {
        builder = builder || new ValueBuilder();
        builder.appendFields(field.state());
        field = null;
        s = 3;
      }
      else if (field.isError()) return field;
    }
    if (s === 3) {
      while (!input.isEmpty() && isSpace(input.head())) input.step();
      if (!input.isEmpty()) s = 1;
      else if (input.isDone()) return new StringIteratee.Done(builder.state());
    }
    if (s === 4) {
      while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
      if (value.isDone()) {
        builder = builder || new ValueBuilder();
        builder.appendValue(value.state());
        value = null;
        s = 6;
      }
      else if (value.isError()) return value;
    }
    if (s === 5) {
      while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
      if (value.isDone()) {
        value = null;
        s = 6;
      }
      else if (value.isError()) return value;
    }
    if (s === 6) {
      while (!input.isEmpty() && isSpace(input.head())) input.step();
      if (!input.isEmpty() && input.head() === 64/*'@'*/) s = 1;
      else return new StringIteratee.Done(builder.state());
    }
  }
  return new BlockValueParser(builder, field, value, s);
};

module.exports = BlockValueParser;