'use strict';



function InlineValueParser(builder, field, value, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.field = field || null;
  this.value = value || null;
  this.s = s || 1;
}
InlineValueParser.prototype = Object.create(StringIteratee.prototype);
InlineValueParser.prototype.constructor = InlineValueParser;
InlineValueParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var value = this.value;
  var field = this.field;
  var builder = this.builder;
  if (s === 1) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 64/*'@'*/) {
        field = new AttrParser();
        s = 2;
      }
      else if (c === 123/*'{'*/) {
        if (builder) {
          value = new RecordParser(builder);
          s = 5;
        }
        else {
          value = new RecordParser();
          s = 4;
        }
      }
      else if (c === 91/*'['*/) {
        if (builder) {
          value = new MarkupParser(builder);
          s = 5;
        }
        else {
          value = new MarkupParser();
          s = 4;
        }
      }
      else if (!builder) return new StringIteratee.Done(null);
      else return new StringIteratee.Done(builder.state());
    }
    else if (input.isDone()) {
      if (!builder) return new StringIteratee.Done(null);
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
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 123/*'{'*/) {
        value = new RecordParser(builder);
        s = 5;
      }
      else if (c === 91/*'['*/) {
        value = new MarkupParser(builder);
        s = 5;
      }
      else return new StringIteratee.Done(builder.state());
    }
    else if (input.isDone()) return new StringIteratee.Done(builder.state());
  }
  if (s === 4) {
    while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
    if (value.isDone()) {
      builder = builder || new ValueBuilder();
      builder.appendValue(value.state());
      return new StringIteratee.Done(builder.state());
    }
    else if (value.isError()) return value;
  }
  if (s === 5) {
    while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
    if (value.isDone()) return new StringIteratee.Done(builder.state());
    else if (value.isError()) return value;
  }
  return new InlineValueParser(builder, field, value, s);
};

module.exports = InlineValueParser;