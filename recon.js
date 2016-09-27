'use strict';

var config = require('./config.json');

var parse = require('./src/parse');
var stringify = require('./src/stringify');
var base64 = require('./src/base64');
var isRecord = require('./src/isrecord');
var isObject = require('./src/isobject');
var isField = require('./src/isfield');
var isAttr = reqire('./src/isattr');
var isBlockSafe = require('./src/isblocksafe');
var isMarkupSafe = require('./src/ismarkupsafe');
var size = require('./src/size');
var head = require('./src/head');
var tail = require('./src/tail');
var tag = require('./src/tag');
var has = require('./src/has');
var get = require('./src/get');
var set = require('./src/set');
var setRecord = require('./src/setrecord');
var setObject = require('./src/setobject');
var remove = require('./src/remove');
var removeRecord = require('./src/removerecord');
var removeObject = require('./src/removeobject');
var keys = require('./src/keys');
var values = require('./src/values');
var forEach = require('./src/foreach');
var concat = require('./src/concat');
var equal = require('./src/equal');
var equalRecord = require('./src/equalrecord');
var equalFields = require('./src/equalfields');
var equalData = require('./src/equaldata');
var compare = require('./src/compare');
var compareRecord = require('./src/comparerecord');
var compareFields = require('./src/comparefields');
var compareName = require('./src/comparename');
var compareData = require('./src/comparedata');
var coerce = require('./src/coerce');
var coerceValue = require('./src/coercevalue');
var coerceRecord = require('./src/coercerecord');
var coerceObject = require('./src/coerceobject');
var RecordBuilder = require('./src/recordbuilder');
var ValueBuilder = require('./src/valuebuilder');
var StringIterator = require('./src/stringiterator');
var StringIteratee = require('./src/stringiteratee');
var StringBuiler = require('./src/stringbuilder');
var DataBuilder = require('./src/databuilder');








function isSpace(c) {
  return c === 0x20 || c === 0x9;
}
function isNewline(c) {
  return c === 0xA || c === 0xD;
}
function isWhitespace(c) {
  return isSpace(c) || isNewline(c);
}
function isNameStartChar(c) {
  return (
    c >= 65/*'A'*/ && c <= 90/*'Z'*/ ||
    c === 95/*'_'*/ ||
    c >= 97/*'a'*/ && c <= 122/*'z'*/ ||
    c >= 0xC0 && c <= 0xD6 ||
    c >= 0xD8 && c <= 0xF6 ||
    c >= 0xF8 && c <= 0x2FF ||
    c >= 0x370 && c <= 0x37D ||
    c >= 0x37F && c <= 0x1FFF ||
    c >= 0x200C && c <= 0x200D ||
    c >= 0x2070 && c <= 0x218F ||
    c >= 0x2C00 && c <= 0x2FEF ||
    c >= 0x3001 && c <= 0xD7FF ||
    c >= 0xF900 && c <= 0xFDCF ||
    c >= 0xFDF0 && c <= 0xFFFD ||
    c >= 0x10000 && c <= 0xEFFFF);
}
function isNameChar(c) {
  return (
    c === 45/*'-'*/ ||
    c >= 48/*'0'*/ && c <= 57/*'9'*/ ||
    c >= 65/*'A'*/ && c <= 90/*'Z'*/ ||
    c === 95/*'_'*/ ||
    c >= 97/*'a'*/ && c <= 122/*'z'*/ ||
    c === 0xB7 ||
    c >= 0xC0 && c <= 0xD6 ||
    c >= 0xD8 && c <= 0xF6 ||
    c >= 0xF8 && c <= 0x37D ||
    c >= 0x37F && c <= 0x1FFF ||
    c >= 0x200C && c <= 0x200D ||
    c >= 0x203F && c <= 0x2040 ||
    c >= 0x2070 && c <= 0x218F ||
    c >= 0x2C00 && c <= 0x2FEF ||
    c >= 0x3001 && c <= 0xD7FF ||
    c >= 0xF900 && c <= 0xFDCF ||
    c >= 0xFDF0 && c <= 0xFFFD ||
    c >= 0x10000 && c <= 0xEFFFF);
}
function isBase64Char(c) {
  return (
    c >= 48/*'0'*/ && c <= 57/*'9'*/ ||
    c >= 65/*'A'*/ && c <= 90/*'Z'*/ ||
    c >= 97/*'a'*/ && c <= 122/*'z'*/ ||
    c === 43/*'+'*/ || c === 45/*'-'*/ ||
    c === 47/*'/'*/ || c === 95/*'_'*/);
}



var DocumentParser = require('./src/documentparser');
var BlockParser = require('./src/blockparser');
var AttrParser = require('./src/attrparser');
var BlockValueParser = require('./src/blockvalueparser');
var InlineValueParser = require('./src/inlinevalueparser');
var RecordParser = require('./src/recordparser');
var MarkupParser = require('./src/markupparser');



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


function IdentParser(builder, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.s = s || 1;
}
IdentParser.prototype = Object.create(StringIteratee.prototype);
IdentParser.prototype.constructor = IdentParser;
IdentParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var builder = this.builder;
  if (s === 1) {
    if (!input.isEmpty() && (c = input.head(), isNameStartChar(c))) {
      builder = builder || new StringBuilder();
      input.step();
      builder.append(c);
      s = 2;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'identitifer', found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 2) {
    while (!input.isEmpty() && (c = input.head(), isNameChar(c))) {
      input.step();
      builder.append(c);
    }
    if (!input.isEmpty() || input.isDone()) {
      var value = builder.state();
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      return new StringIteratee.Done(value);
    }
  }
  return new IdentParser(builder, s);
};


function StringParser(text, s) {
  StringIteratee.call(this);
  this.text = text || null;
  this.s = s || 1;
}
StringParser.prototype = Object.create(StringIteratee.prototype);
StringParser.prototype.constructor = StringParser;
StringParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var text = this.text;
  if (s === 1) {
    if (!input.isEmpty() && (c = input.head(), c === 34/*'"'*/)) {
      input.step();
      s = 2;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: '\'"\'', found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  while (!input.isEmpty() || input.isDone()) {
    if (s === 2) {
      text = text || new StringBuilder();
      while (!input.isEmpty() && (c = input.head(), c !== 34/*'"'*/ && c !== 92/*'\\'*/)) {
        input.step();
        text.append(c);
      }
      if (!input.isEmpty()) {
        if (c === 34/*'"'*/) {
          input.step();
          return new StringIteratee.Done(text.state());
        }
        else if (c === 92/*'\\'*/) {
          input.step();
          s = 3;
        }
      }
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 3) {
      if (!input.isEmpty()) {
        c = input.head();
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
  return new StringParser(text, s);
};


function NumberParser(builder, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.s = s || 1;
}
NumberParser.prototype = Object.create(StringIteratee.prototype);
NumberParser.prototype.constructor = NumberParser;
NumberParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var builder = this.builder || new StringBuilder();
  if (s === 1) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 45/*'-'*/) {
        input.step();
        builder.append(c);
      }
      s = 2;
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 2) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 48/*'0'*/) {
        input.step();
        builder.append(c);
        s = 4;
      }
      else if (c >= 49/*'1'*/ && c <= 57/*'9'*/) {
        input.step();
        builder.append(c);
        s = 3;
      }
      else return new StringIteratee.Error({expected: 'digit', found: c});
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 3) {
    while (!input.isEmpty() && (c = input.head(), c >= 48/*'0'*/ && c <= 57/*'9'*/)) {
      input.step();
      builder.append(c);
    }
    if (!input.isEmpty()) s = 4;
    else if (input.isDone()) return new StringIteratee.Done(Number(builder.state()));
  }
  if (s === 4) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 46/*'.'*/) {
        input.step();
        builder.append(c);
        s = 5;
      }
      else if (c === 69/*'E'*/ || c === 101/*'e'*/) {
        input.step();
        builder.append(c);
        s = 8;
      }
      else return new StringIteratee.Done(Number(builder.state()));
    }
    else if (input.isDone()) return new StringIteratee.Done(Number(builder.state()));
  }
  if (s === 5) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c >= 48/*'0'*/ && c <= 57/*'9'*/) {
        input.step();
        builder.append(c);
        s = 6;
      }
      else return new StringIteratee.Error({expected: 'digit', found: c});
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 6) {
    while (!input.isEmpty() && (c = input.head(), c >= 48/*'0'*/ && c <= 57/*'9'*/)) {
      input.step();
      builder.append(c);
    }
    if (!input.isEmpty()) s = 7;
    else if (input.isDone()) return new StringIteratee.Done(Number(builder.state()));
  }
  if (s === 7) {
    c = input.head();
    if (c === 69/*'E'*/ || c === 101/*'e'*/) {
      input.step();
      builder.append(c);
      s = 8;
    }
    else return new StringIteratee.Done(Number(builder.state()));
  }
  if (s === 8) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 43/*'+'*/ || c === 45/*'-'*/) {
        input.step();
        builder.append(c);
      }
      s = 9;
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 9) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c >= 48/*'0'*/ && c <= 57/*'9'*/) {
        input.step();
        builder.append(c);
        s = 10;
      }
      else return new StringIteratee.Error({expected: 'digit', found: c});
    }
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 10) {
    while (!input.isEmpty() && (c = input.head(), c >= 48/*'0'*/ && c <= 57/*'9'*/)) {
      input.step();
      builder.append(c);
    }
    if (!input.isEmpty() || input.isDone()) return new StringIteratee.Done(Number(builder.state()));
  }
  return new NumberParser(builder, s);
};


function DataParser(data, s) {
  StringIteratee.call(this);
  this.data = data || null;
  this.s = s || 1;
}
DataParser.prototype = Object.create(StringIteratee.prototype);
DataParser.prototype.constructor = DataParser;
DataParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var data = this.data || new DataBuilder();
  if (s === 1) {
    if (!input.isEmpty() && (c = input.head(), c === 37/*'%'*/)) {
      input.step();
      s = 2;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: '\'%\'', found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  while (!input.isEmpty() || input.isDone()) {
    if (s === 2) {
      if (!input.isEmpty() && (c = input.head(), isBase64Char(c))) {
        input.step();
        data.appendBase64Char(c);
        s = 3;
      }
      else if (!input.isEmpty() || input.isDone()) return new StringIteratee.Done(data.state());
    }
    if (s === 3) {
      if (!input.isEmpty() && (c = input.head(), isBase64Char(c))) {
        input.step();
        data.appendBase64Char(c);
        s = 4;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'base64 digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 4) {
      if (!input.isEmpty() && (c = input.head(), isBase64Char(c) || c === 61/*'='*/)) {
        input.step();
        data.appendBase64Char(c);
        if (c !== 61/*'='*/) s = 5;
        else s = 6;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'base64 digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 5) {
      if (!input.isEmpty() && (c = input.head(), isBase64Char(c) || c === 61/*'='*/)) {
        input.step();
        data.appendBase64Char(c);
        if (c !== 61/*'='*/) s = 2;
        else return new StringIteratee.Done(data.state());
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'base64 digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    else if (s === 6) {
      if (!input.isEmpty() && (c = input.head(), c === 61/*'='*/)) {
        input.step();
        data.appendBase64Char(c);
        return new StringIteratee.Done(data.state());
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: '\'=\'', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new DataParser(data, s);
};


function ReconWriter(builder) {
  this.builder = builder || new StringBuilder();
}
ReconWriter.prototype.writeValue = function (value) {
  if (typeof value === 'string') this.writeText(value);
  else if (typeof value === 'number') this.writeNumber(value);
  else if (typeof value === 'boolean') this.writeBool(value);
  else if (value instanceof Uint8Array) this.writeData(value);
  else if (isRecord(value)) this.writeRecord(value);
  else if (isObject(value)) this.writeRecord(coerceObject(value));
};
ReconWriter.prototype.writeItem = function (item) {
  if (isField(item)) this.writeSlots(item);
  else this.writeValue(item);
};
ReconWriter.prototype.writeAttrs = function (attrs) {
  var keys = Object.keys(attrs);
  for (var i = 0, n = keys.length; i < n; i += 1) {
    var key = keys[i];
    if (key.length > 0 && key.charCodeAt(0) === 64/*'@'*/) {
      var value = attrs[key];
      this.writeAttr(key.substring(1), value);
    }
  }
};
ReconWriter.prototype.writeAttr = function (key, value) {
  this.builder.append(64/*'@'*/);
  this.writeIdent(key);
  if (value !== null) {
    this.builder.append(40/*'('*/);
    this.writeBlock(value);
    this.builder.append(41/*')'*/);
  }
};
ReconWriter.prototype.writeSlots = function (slots) {
  var keys = Object.keys(slots);
  var key;
  var value;
  var n = keys.length;
  if (n === 2 && slots.$key !== undefined && slots.$value !== undefined) {
    key = slots.$key;
    value = slots.$value;
    this.writeSlot(key, value);
  }
  else for (var i = 0; i < n; i += 1) {
    key = keys[i];
    value = slots[key];
    if (i > 0) this.builder.append(44/*','*/);
    this.writeSlot(key, value);
  }
};
ReconWriter.prototype.writeSlot = function (key, value) {
  this.writeValue(key);
  this.builder.append(58/*':'*/);
  if (value !== null) this.writeValue(value);
};
ReconWriter.prototype.writeBlock = function (value) {
  if (!isObject(value)) this.writeValue(value);
  else {
    if (!isRecord(value)) value = coerceObject(value);
    if (value.length > 0) this.writeItems(value, isBlockSafe(value), false);
    else {
      this.builder.append(123/*'{'*/);
      this.builder.append(125/*'}'*/);
    }
  }
};
ReconWriter.prototype.writeRecord = function (record) {
  if (record.length > 0) this.writeItems(record, false, false);
  else {
    this.builder.append(123/*'{'*/);
    this.builder.append(125/*'}'*/);
  }
};
ReconWriter.prototype.writeItems = function (items, inBlock, inMarkup) {
  var i = 0;
  var n = items.length;
  var inBraces = false;
  var inBrackets = false;
  var first = true;
  while (i < n) {
    var item = items[i];
    i += 1;
    if (inBrackets && isAttr(item)) {
      if (inBraces) {
        this.builder.append(125/*'}'*/);
        inBraces = false;
      }
      this.builder.append(93/*']'*/);
      inBrackets = false;
    }
    if (isAttr(item)) {
      if (inBraces) {
        this.builder.append(125/*'}'*/);
        inBraces = false;
      }
      else if (inBrackets) {
        this.builder.append(93/*']'*/);
        inBrackets = false;
      }
      this.writeAttrs(item);
      first = false;
    }
    else if (inBrackets && typeof item === 'string') {
      if (inBraces) {
        this.builder.append(125/*'}'*/);
        inBraces = false;
      }
      this.writeMarkupText(item);
    }
    else if (inBraces) {
      if (!first) this.builder.append(44/*','*/);
      else first = false;
      this.writeItem(item);
    }
    else if (inBrackets) {
      if (isRecord(item) && isMarkupSafe(item)) {
        this.writeItems(item, false, true);
        if (i < n && typeof items[i] === 'string') {
          this.writeMarkupText(items[i]);
          i += 1;
        }
        else if (i < n && !isAttr(items[i])) {
          this.builder.append(123/*'{'*/);
          inBraces = true;
          first = true;
        }
        else {
          this.builder.append(93/*']'*/);
          inBrackets = false;
        }
      }
      else {
        this.builder.append(123/*'{'*/);
        this.writeItem(item);
        inBraces = true;
        first = false;
      }
    }
    else if (typeof item === 'string' &&
        i < n && !isField(items[i]) &&
        typeof items[i] !== 'string' && typeof items[i] !== 'boolean') {
      this.builder.append(91/*'['*/);
      this.writeMarkupText(item);
      inBrackets = true;
    }
    else if (inBlock && !inBraces) {
      if (!first) this.builder.append(44/*','*/);
      else first = false;
      this.writeItem(item);
    }
    else if (inMarkup && typeof item === 'string' && i >= n) {
      this.builder.append(91/*'['*/);
      this.writeMarkupText(item);
      this.builder.append(93/*']'*/);
    }
    else if (!inMarkup && !isField(item) && !isRecord(item) &&
            (!first && i >= n || i < n && isAttr(items[i]))) {
      if (!first && (typeof item === 'string' && this.isIdent(item) ||
                     typeof item === 'number' ||
                     typeof item === 'boolean'))
        this.builder.append(32/*' '*/);
      this.writeValue(item);
    }
    else {
      this.builder.append(123/*'{'*/);
      this.writeItem(item);
      inBraces = true;
      first = false;
    }
  }
  if (inBraces) this.builder.append(125/*'}'*/);
  if (inBrackets) this.builder.append(93/*']'*/);
};
ReconWriter.prototype.isIdent = function (text) {
  var cs = new StringIterator(text);
  if (cs.isEmpty() || !isNameStartChar(cs.head())) return false;
  cs.step();
  while (!cs.isEmpty() && isNameChar(cs.head())) cs.step();
  return cs.isEmpty();
};
ReconWriter.prototype.writeText = function (text) {
  if (this.isIdent(text)) this.writeIdent(text);
  else this.writeString(text);
};
ReconWriter.prototype.writeIdent = function (ident) {
  this.builder.appendString(ident);
};
ReconWriter.prototype.writeString = function (string) {
  var cs = new StringIterator(string);
  this.builder.append(34/*'"'*/);
  while (!cs.isEmpty()) {
    var c = cs.head();
    switch (c) {
      case 34/*'"'*/:
      case 92/*'\\'*/: this.builder.append(92/*'\\'*/); this.builder.append(c); break;
      case 8/*'\b'*/: this.builder.append(92/*'\\'*/); this.builder.append(98/*'b'*/); break;
      case 12/*'\f'*/: this.builder.append(92/*'\\'*/); this.builder.append(102/*'f'*/); break;
      case 10/*'\n'*/: this.builder.append(92/*'\\'*/); this.builder.append(110/*'n'*/); break;
      case 13/*'\r'*/: this.builder.append(92/*'\\'*/); this.builder.append(114/*'r'*/); break;
      case 9/*'\t'*/: this.builder.append(92/*'\\'*/); this.builder.append(116/*'t'*/); break;
      default: this.builder.append(c);
    }
    cs.step();
  }
  this.builder.append(34/*'"'*/);
};
ReconWriter.prototype.writeMarkupText = function (text) {
  var cs = new StringIterator(text);
  while (!cs.isEmpty()) {
    var c = cs.head();
    switch (c) {
      case 64/*'@'*/:
      case 91/*'['*/:
      case 92/*'\\'*/:
      case 93/*']'*/:
      case 123/*'{'*/:
      case 125/*'}'*/: this.builder.append(92/*'\\'*/); this.builder.append(c); break;
      case 8/*'\b'*/: this.builder.append(92/*'\\'*/); this.builder.append(98/*'b'*/); break;
      case 12/*'\f'*/: this.builder.append(92/*'\\'*/); this.builder.append(102/*'f'*/); break;
      case 10/*'\n'*/: this.builder.append(92/*'\\'*/); this.builder.append(110/*'n'*/); break;
      case 13/*'\r'*/: this.builder.append(92/*'\\'*/); this.builder.append(114/*'r'*/); break;
      case 9/*'\t'*/: this.builder.append(92/*'\\'*/); this.builder.append(116/*'t'*/); break;
      default: this.builder.append(c);
    }
    cs.step();
  }
};
ReconWriter.prototype.writeNumber = function (number) {
  this.builder.appendString(number.toString());
};
ReconWriter.prototype.writeBool = function (bool) {
  this.builder.appendString(bool.toString());
};
ReconWriter.prototype.writeData = function (data) {
  function encodeBase64Digit(x) {
    if (x >= 0 && x < 26) return x + 65/*'A'*/;
    else if (x >= 26 && x < 52) return x + 71/*('a' - 26)*/;
    else if (x >= 52 && x < 62) return x - 4/*-('0' - 52)*/;
    else if (x === 62) return 43/*'+'*/;
    else if (x === 63) return 47/*'/'*/;
  }
  this.builder.append(37/*'%'*/);
  var i = 0;
  var n = data.length;
  var x, y, z;
  while (i + 2 < n) {
    x = data[i];
    y = data[i + 1];
    z = data[i + 2];
    this.builder.append(encodeBase64Digit(x >>> 2));
    this.builder.append(encodeBase64Digit(((x << 4) | (y >>> 4)) & 0x3F));
    this.builder.append(encodeBase64Digit(((y << 2) | (z >>> 6)) & 0x3F));
    this.builder.append(encodeBase64Digit(z & 0x3F));
    i += 3;
  }
  if (i + 1 < n) {
    x = data[i];
    y = data[i + 1];
    this.builder.append(encodeBase64Digit(x >>> 2));
    this.builder.append(encodeBase64Digit(((x << 4) | (y >>> 4)) & 0x3F));
    this.builder.append(encodeBase64Digit((y << 2) & 0x3F));
    this.builder.append(61/*'='*/);
    i += 2;
  }
  else if (i < n) {
    x = data[i];
    this.builder.append(encodeBase64Digit(x >>> 2));
    this.builder.append(encodeBase64Digit((x << 4) & 0x3F));
    this.builder.append(61/*'='*/);
    this.builder.append(61/*'='*/);
    i += 1;
  }
};
ReconWriter.prototype.state = function () {
  return this.builder.state();
};


function isUnreservedChar(c) {
  return (
    c >= 65/*'A'*/ && c <= 90/*'Z'*/ ||
    c >= 97/*'a'*/ && c <= 122/*'z'*/ ||
    c >= 48/*'0'*/ && c <= 57/*'9'*/ ||
    c === 45/*'-'*/ || c === 46/*'.'*/ ||
    c === 95/*'_'*/ || c === 126/*'~'*/);
}

function isSubDelimChar(c) {
  return (
    c === 33/*'!'*/ || c === 36/*'$'*/ ||
    c === 38/*'&'*/ || c === 40/*'('*/ ||
    c === 41/*')'*/ || c === 42/*'*'*/ ||
    c === 43/*'+'*/ || c === 44/*','*/ ||
    c === 59/*';'*/ || c === 61/*'='*/ ||
    c === 39/*'\''*/);
}

function isSchemeChar(c) {
  return (
    c >= 65/*'A'*/ && c <= 90/*'Z'*/ ||
    c >= 97/*'a'*/ && c <= 122/*'z'*/ ||
    c >= 48/*'0'*/ && c <= 57/*'9'*/ ||
    c === 43/*'+'*/ || c === 45/*'-'*/ ||
    c === 46/*'.'*/);
}

function isUserInfoChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 58/*':'*/);
}

function isUserChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c));
}

function isHostChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c));
}

function isPathChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 58/*':'*/ || c === 64/*'@'*/);
}

function isQueryChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 47/*'/'*/ || c === 58/*':'*/ ||
    c === 63/*'?'*/ || c === 64/*'@'*/);
}

function isParamChar(c) {
  return (
    isUnreservedChar(c) ||
    c === 33/*'!'*/ || c === 36/*'$'*/ ||
    c === 40/*'('*/ || c === 41/*')'*/ ||
    c === 42/*'*'*/ || c === 43/*'+'*/ ||
    c === 44/*','*/ || c === 47/*'/'*/ ||
    c === 58/*':'*/ || c === 59/*';'*/ ||
    c === 63/*'?'*/ || c === 64/*'@'*/ ||
    c === 39/*'\''*/);
}

function isFragmentChar(c) {
  return (
    isUnreservedChar(c) ||
    isSubDelimChar(c) ||
    c === 47/*'/'*/ || c === 58/*':'*/ ||
    c === 63/*'?'*/ || c === 64/*'@'*/);
}

function isAlpha(c) {
  return (
    c >= 65/*'A'*/ && c <= 90/*'Z'*/ ||
    c >= 97/*'a'*/ && c <= 122/*'z'*/);
}

function isDigit(c) {
  return c >= 48/*'0'*/ && c <= 57/*'9'*/;
}

function isHexChar(c) {
  return (
    c >= 65/*'A'*/ && c <= 70/*'F'*/ ||
    c >= 97/*'a'*/ && c <= 102/*'f'*/ ||
    c >= 48/*'0'*/ && c <= 57/*'9'*/);
}

function decodeDigit(c) {
  if (c >= 48/*'0'*/ && c <= 57/*'9'*/) return c - 48/*'0'*/;
}

function decodeHex(c) {
  if (c >= 48/*'0'*/ && c <= 57/*'9'*/) return c - 48/*'0'*/;
  else if (c >= 65/*'A'*/ && c <= 70/*'F'*/) return 10 + (c - 65/*'A'*/);
  else if (c >= 97/*'a'*/ && c <= 102/*'f'*/) return 10 + (c - 97/*'a'*/);
}

function encodeHex(x) {
  if (x < 10) return 48/*'0'*/ + x;
  else return 65/*'A'*/ + (x - 10);
}

function toLowerCase(c) {
  if (c >= 65/*'A'*/ && c <= 90/*'Z'*/) return c + (97/*'a'*/ - 65/*'A'*/);
  else return c;
}


function UriParser(scheme, authority, path, query, fragment, s) {
  StringIteratee.call(this);
  this.scheme = scheme || null;
  this.authority = authority || null;
  this.path = path || null;
  this.query = query || null;
  this.fragment = fragment || null;
  this.s = s || 1;
}
UriParser.prototype = Object.create(StringIteratee.prototype);
UriParser.prototype.constructor = UriParser;
UriParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var fragment = this.fragment;
  var query = this.query;
  var path = this.path;
  var authority = this.authority;
  var scheme = this.scheme;
  var uri;
  if (s === 1) {
    if (!input.isEmpty()) {
      var look = input.dup();
      while (!look.isEmpty() && (c = look.head(), isSchemeChar(c))) look.step();
      if (!look.isEmpty() && c === 58/*':'*/) s = 2;
      else s = 3;
    }
    else if (input.isDone()) s = 3;
  }
  if (s === 2) {
    scheme = scheme || new SchemeParser();
    scheme = scheme.feed(input);
    if (scheme.isError()) return scheme;
    else if (!input.isEmpty() && (c = input.head(), c === 58/*':'*/)) {
      input.step();
      s = 3;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: '\':\'', found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF;
  }
  if (s === 3) {
    if (!input.isEmpty()) {
      c = input.head();
      if (c === 47/*'/'*/) {
        input.step();
        s = 4;
      }
      else if (c === 63/*'?'*/) {
        input.step();
        s = 7;
      }
      else if (c === 35/*'#'*/) {
        input.step();
        s = 8;
      }
      else s = 6;
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 4) {
    if (!input.isEmpty() && (c = input.head(), c === 47/*'/'*/)) {
      input.step();
      s = 5;
    }
    else if (!input.isEmpty()) {
      path = new PathParser(['/']);
      s = 6;
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      uri.path = ['/'];
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 5) {
    authority = authority || new AuthorityParser();
    authority = authority.feed(input);
    if (authority.isError()) return authority;
    else if (!input.isEmpty()) {
      c = input.head();
      if (c === 63/*'?'*/) {
        input.step();
        s = 7;
      }
      else if (c === 35/*'#'*/) {
        input.step();
        s = 8;
      }
      else s = 6;
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      if (authority.state()) uri.authority = authority.state();
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 6) {
    path = path || new PathParser();
    path = path.feed(input);
    if (path.isError()) return path;
    else if (!input.isEmpty()) {
      c = input.head();
      if (c === 63/*'?'*/) {
        input.step();
        s = 7;
      }
      else if (c === 35/*'#'*/) {
        input.step();
        s = 8;
      }
      else {
        uri = {};
        if (scheme) uri.scheme = scheme.state();
        if (authority) uri.authority = authority.state();
        uri.path = path.state();
        return new StringIteratee.Done(uri);
      }
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      if (authority) uri.authority = authority.state();
      uri.path = path.state();
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 7) {
    query = query || new QueryParser();
    query = query.feed(input);
    if (query.isError()) return query;
    else if (!input.isEmpty()) {
      c = input.head();
      if (c === 35/*'#'*/) {
        input.step();
        s = 8;
      }
      else {
        uri = {};
        if (scheme) uri.scheme = scheme.state();
        if (authority) uri.authority = authority.state();
        uri.path = path.state();
        uri.query = query.state();
        return new StringIteratee.Done(uri);
      }
    }
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      if (authority) uri.authority = authority.state();
      if (path) uri.path = path.state();
      uri.query = query.state();
      return new StringIteratee.Done(uri);
    }
  }
  if (s === 8) {
    fragment = fragment || new FragmentParser();
    fragment = fragment.feed(input);
    if (fragment.isError()) return fragment;
    else if (input.isDone()) {
      uri = {};
      if (scheme) uri.scheme = scheme.state();
      if (authority) uri.authority = authority.state();
      if (path) uri.path = path.state();
      if (query) uri.query = query.state();
      uri.fragment = fragment.state();
      return new StringIteratee.Done(uri);
    }
  }
  return new UriParser(scheme, authority, path, query, fragment, s);
};
UriParser.prototype.state = function () {
  var scheme = this.scheme.state();
  var authority = this.authority.state();
  var path = this.path.state();
  var query = this.query.state();
  var fragment = this.fragment.state();
  var uri = {};
  if (scheme !== undefined) uri.scheme = scheme;
  if (authority) uri.authority = authority;
  if (path) uri.path = path;
  if (query) uri.query = query;
  if (fragment !== undefined) uri.fragment = fragment;
  return uri;
};


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

var AuthorityParser = require('./src/authorityparser');
var UserInfoParser = require('./src/userinfoparser');
var HostParser = require('./src/hostparser');
var HostAddressParser = require('./src/hostaddressparser');
var HostLiteralParser = require('./src/hostliteralparser');
var PortParser = require('./src/portparser');
var PathParser = require('./src/pathparser');
var QueryParser = require('./src/queryparser');
var FragmentParser  = require('./src/fragmentparser');


function parseUri(string) {
  var input = new StringIterator(string);
  var result = new UriParser().run(input);
  return result.state();
}
function parseAuthority(string) {
  var input = new StringIterator(string);
  var result = new AuthorityParser().run(input);
  return result.state();
}
function parsePath(string) {
  var input = new StringIterator(string);
  var result = new PathParser().run(input);
  return result.state();
}
function stringifyUri(uri) {
  var writer = new UriWriter();
  writer.writeUri(uri);
  return writer.state();
}


var resolveUri = require('./src/resolveuri');
var mergeUriPath = require('./src/mergeuripath');
var mergePath = require('./src/mergepath');
var removeDotSegments = require('./src/removedotsegments');
var unresolveUri = require('./src/unresolveUri');
var unmergePath = require('./src/unmergepath');
var UriWriter = require('./src/uriwriter');

var uri = {};
uri.parse = parseUri;
uri.stringify = stringifyUri;
uri.resolve = resolveUri;
uri.unresolve = unresolveUri;


module.exports = function (value) {
  return coerce.apply(null, arguments);
};
exports = module.exports;
exports.parse = parse;
exports.stringify = stringify;
exports.base64 = base64;
exports.isRecord = isRecord;
exports.size = size;
exports.head = head;
exports.tail = tail;
exports.tag = tag;
exports.has = has;
exports.get = get;
exports.set = set;
exports.remove = remove;
exports.keys = keys;
exports.values = values;
exports.forEach = forEach;
exports.concat = concat;
exports.equal = equal;
exports.compare = compare;
exports.uri = uri;
exports.config = config;
exports.StringIterator = StringIterator;
exports.DocumentParser = DocumentParser;
exports.BlockParser = BlockParser;
exports.RecordParser = RecordParser;
exports.UriParser = UriParser;
exports.SchemeParser = SchemeParser;
exports.AuthorityParser = AuthorityParser;
exports.PathParser = PathParser;
exports.QueryParser = QueryParser;
exports.FragmentParser = FragmentParser;
