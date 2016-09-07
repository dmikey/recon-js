'use strict';

var config = require('./config.json');

function parse(string) {
  var input = new StringIterator(string);
  var result = new DocumentParser().run(input);
  return result.state();
}

function stringify(value, options) {
  var writer = new ReconWriter();
  if (options && options.block === false) writer.writeValue(value);
  else writer.writeBlock(value);
  return writer.state();
}

function base64(string) {
  if (string === undefined) return new Uint8Array(0);
  var data = new DataBuilder();
  var cs = new StringIterator(string);
  while (!cs.isEmpty()) {
    data.appendBase64Char(cs.head());
    cs.step();
  }
  return data.state();
}

function isRecord(item) {
  return Array.isArray(item) && !(item instanceof Uint8Array);
}

function isObject(item) {
  return item !== null && typeof item === 'object' && !(item instanceof Uint8Array);
}

function isField(item) {
  return item !== null && typeof item === 'object' && !Array.isArray(item) && !(item instanceof Uint8Array);
}

function isAttr(item) {
  if (!isField(item)) return false;
  var keys = Object.keys(item);
  var n = keys.length;
  if (n === 0) return false;
  for (var i = 0; i < n; i += 1) {
    var key = keys[i];
    if (key.length === 0 || key.charCodeAt(0) !== 64/*'@'*/) return false;
  }
  return true;
}

function isBlockSafe(record) {
  for (var i = 0, n = record.length; i < n; i += 1) {
    if (isAttr(record[i])) return false;
  }
  return true;
}

function isMarkupSafe(record) {
  var n = record.length;
  if (n === 0 || !isAttr(record[0])) return false;
  for (var i = 1; i < n; i += 1) {
    if (isAttr(record[i])) return false;
  }
  return true;
}

function size(value) {
  if (isRecord(value)) return value.length;
  else if (isObject(value)) return Object.keys(value).length;
  else return 0;
}

function head(value) {
  if (isRecord(value)) {
    var header = value[0];
    if (isField(header)) {
      if (header.$key) return header.$value;
      else return header[Object.keys(header)[0]];
    }
    else return header;
  }
  else if (isObject(value)) return value[Object.keys(value)[0]];
  else return value;
}

function tail(value) {
  var i, n, builder;
  if (isRecord(value)) {
    builder = new RecordBuilder();
    for (i = 1, n = value.length; i < n; i += 1) {
      builder.appendItem(value[i]);
    }
    return builder.state();
  }
  else if (isObject(value)) {
    var keys = Object.keys(value);
    for (i = 1, n = keys.length; i < n; i += 1) {
      var key = keys[i];
      builder.appendField(key, value[key]);
    }
    return builder.state();
  }
}

function tag(value) {
  if (isRecord(value)) {
    var header = value[0];
    if (isField(header)) return header.$key || Object.keys(header)[0];
  }
  else if (isObject(value)) return Object.keys(value)[0];
}

function has(record, key) {
  return get(record, key) !== undefined;
}

function get(record, key) {
  var i, n, item, value;
  if (typeof key === 'string') {
    value = record[key];
    if (value !== undefined) return value;
    for (i = 0, n = record.length; i < n; i += 1) {
      item = record[i];
      if (isField(item)) {
        if (item[key] !== undefined) return item[key];
        else if (equal(item.$key, key)) return item.$value;
      }
    }
  }
  else {
    for (i = 0, n = record.length; i < n; i += 1) {
      item = record[i];
      if (isField(item)) {
        if (equal(item.$key, key)) return item.$value;
      }
    }
  }
}

function set(record, key, value) {
  value = coerceValue(value);
  if (isRecord(record)) setRecord(record, key, value);
  else if (isObject(record)) setObject(record, key, value);
}
function setRecord(record, key, value) {
  var updated = false;
  var field;
  for (var i = 0, n = record.length; i < n; i += 1) {
    var item = record[i];
    if (isField(item)) {
      if (item[key] !== undefined) {
        item[key] = value;
        updated = true;
      }
      else if (equal(item.$key, key)) {
        item.$value = value;
        updated = true;
      }
    }
  }
  if (typeof key === 'string') {
    if (!updated) {
      field = {};
      field[key] = value;
      record.push(field);
    }
    record[key] = value;
  }
  else if (!updated) {
    field = {};
    field.$key = key;
    field.$value = value;
    record.push(field);
  }
}
function setObject(record, key, value) {
  if (typeof key === 'string') {
    record[key] = value;
  }
}

function remove(record, key) {
  if (isRecord(record)) removeRecord(record, key);
  else if (isObject(record)) removeObject(record, key);
}
function removeRecord(record, key) {
  for (var i = 0, n = record.length; i < n; i += 1) {
    var item = record[i];
    if (isField(item)) {
      if (item[key] !== undefined) {
        delete item[key];
        delete record[key];
        if (Object.keys(item).length === 0) {
          record.splice(i, 1);
          i -= 1;
          n -= 1;
        }
      }
      else if (equal(item.$key, key)) {
        record.splice(i, 1);
        i -= 1;
        n -= 1;
      }
    }
  }
}
function removeObject(record, key) {
  if (typeof key === 'string') {
    delete record[key];
  }
}

function keys(record) {
  if (isRecord(record)) {
    var keys = [];
    for (var i = 0, n = record.length; i < n; i += 1) {
      var item = record[i];
      if (isField(item)) {
        var key = item.$key;
        if (key !== undefined) keys.push(key);
        else Array.prototype.push.apply(keys, Object.keys(item));
      }
    }
    return keys;
  }
  else if (isObject(record)) {
    return Object.keys(record);
  }
  else {
    return [];
  }
}

function values(record) {
  var values = [];
  var key;
  if (isRecord(record)) {
    for (var i = 0, n = record.length; i < n; i += 1) {
      var item = record[i];
      if (isField(item)) {
        key = item.$key;
        if (key !== undefined) {
          values.push(item.$value);
        }
        else {
          for (key in item) {
            values.push(item[key]);
          }
        }
      }
      else {
        values.push(item);
      }
    }
  }
  else if (isObject(record)) {
    for (key in record) {
      values.push(record[key]);
    }
  }
  return values;
}

function forEach(record, callback, thisArg) {
  var key, value;
  if (isRecord(record)) {
    for (var i = 0, n = record.length; i < n; i += 1) {
      var item = record[i];
      if (isField(item)) {
        key = item.$key;
        if (key !== undefined) {
          value = item.$value;
          callback.call(thisArg, value, key, record);
        }
        else {
          for (key in item) {
            value = item[key];
            callback.call(thisArg, value, key, record);
          }
        }
      }
      else {
        callback.call(thisArg, item, undefined, record);
      }
    }
  }
  else if (isObject(record)) {
    for (key in record) {
      value = record[key];
      callback.call(thisArg, value, key, record);
    }
  }
}

function concat(x, y) {
  var builder = new RecordBuilder();
  if (isRecord(x)) builder.appendRecord(x);
  else if (isObject(x)) builder.appendFields(x);
  else if (x !== undefined) builder.appendItem(x);
  if (isRecord(y)) builder.appendRecord(y);
  else if (isObject(y)) builder.appendFields(y);
  else if (y !== undefined) builder.appendItem(y);
  return builder.state();
}

function equal(x, y) {
  if (x === y) return true;
  if (isRecord(x) && isRecord(y)) return equalRecord(x, y);
  if (isField(x) && isField(y)) return equalFields(x, y);
  if (x instanceof Uint8Array && y instanceof Uint8Array) return equalData(x, y);
  return false;
}
function equalRecord(x, y) {
  var n = x.length;
  if (n !== y.length) return false;
  for (var i = 0; i < n; i += 1) {
    if (!equal(x[i], y[i])) return false;
  }
  return true;
}
function equalFields(x, y) {
  var xKeys = Object.keys(x);
  var yKeys = Object.keys(y);
  var n = xKeys.length;
  if (n !== yKeys.length) return false;
  for (var i = 0; i < n; i += 1) {
    var key = xKeys[i];
    if (!equal(x[key], y[key])) return false;
  }
  return true;
}
function equalData(x, y) {
  var n = x.length;
  if (n !== y.length) return false;
  for (var i = 0; i < n; i += 1) {
    if (x[i] !== y[i]) return false;
  }
  return true;
}

function compare(x, y) {
  if (x === true) x = 'true';
  else if (x === false) x = 'false';
  if (y === true) y = 'true';
  else if (y === false) y = 'false';

  if (x === undefined) {
    if (y === undefined) return 0;
    else return 1;
  }
  else if (x === null) {
    if (y === undefined) return -1;
    else if (y === null) return 0;
    else return 1;
  }
  else if (typeof x === 'number') {
    if (y === undefined || y === null) return -1;
    else if (typeof y === 'number') return x < y ? -1 : x > y ? 1 : 0;
    else return 1;
  }
  else if (typeof x === 'string') {
    if (y === undefined || y === null || typeof y === 'number') return -1;
    else if (typeof y === 'string') return x < y ? -1 : x > y ? 1 : 0;
    else return 1;
  }
  else if (x instanceof Uint8Array) {
    if (y === undefined || y === null || typeof y === 'number' || typeof y === 'string') return -1;
    else if (y instanceof Uint8Array) return compareData(x, y);
    else return 1;
  }
  else if (Array.isArray(x)) {
    if (y === undefined || y === null || typeof y === 'number' || typeof y === 'string' ||
        y instanceof Uint8Array) return -1;
    else if (Array.isArray(y)) return compareRecord(x, y);
    else return 1;
  }
  else {
    if (y === undefined || y === null || typeof y === 'number' || typeof y === 'string' ||
        y instanceof Uint8Array || Array.isArray(y)) return -1;
    else return compareFields(x, y);
  }
}
function compareRecord(x, y) {
  var p = x.length;
  var q = y.length;
  for (var i = 0, n = Math.min(p, q), order = 0; i < n && order === 0; i += 1) {
    order = compare(x[i], y[i]);
  }
  return order !== 0 ? order : p > q ? 1 : p < q ? -1 : 0;
}
function compareFields(x, y) {
  var xKeys = Object.keys(x);
  var yKeys = Object.keys(y);
  var p = xKeys.length;
  var q = yKeys.length;
  for (var i = 0, n = Math.min(p, q), order = 0; i < n && order === 0; i += 1) {
    var xKey = xKeys[i];
    var yKey = yKeys[i];
    order = compareName(xKey, yKey);
    if (order === 0) order = compare(x[xKey], y[yKey]);
  }
  return order !== 0 ? order : p > q ? 1 : p < q ? -1 : 0;
}
function compareName(x, y) {
  var p = x.length;
  var q = y.length;
  if (p > 0 && q > 0) {
    var x0 = x.charCodeAt(0);
    var y0 = y.charCodeAt(0);
    if (x0 === 64/*'@'*/ && y0 !== 64/*'@'*/) return -1;
    else if (x0 !== 64/*'@'*/ && y0 === 64/*'@'*/) return 1;
    else return x < y ? -1 : x > y ? 1 : 0;
  }
  else if (p > 0) return 1;
  else if (q > 0) return -1;
  else return 0;
}
function compareData(x, y) {
  var p = x.length;
  var q = y.length;
  for (var i = 0, n = Math.min(p, q), order = 0; i < n && order === 0; i += 1) {
    order = x[i] - y[i];
  }
  return order > 0 ? 1 : order < 0 ? -1 : p > q ? 1 : p < q ? -1 : 0;
}

function coerce() {
  if (arguments.length === 1) return coerceValue(arguments[0]);
  else if (arguments.length > 1) return coerceRecord(arguments);
}
function coerceValue(value) {
  if (isRecord(value)) return coerceRecord(value);
  else if (isObject(value)) return coerceObject(value);
  else return value;
}
function coerceRecord(items) {
  var record = [];
  var i, n;
  for (i = 0, n = items.length; i < n; i += 1) {
    record.push(items[i]);
  }
  var keys = Object.keys(items);
  for (i = 0, n = keys.length; i < n; i += 1) {
    var key = keys[i];
    if (isNaN(parseInt(key)) && key.length > 0 && key.charCodeAt(0) !== 36/*'$'*/) {
      var value = coerceValue(items[key]);
      set(record, key, value);
    }
  }
  return record;
}
function coerceObject(fields) {
  var keys = Object.keys(fields);
  var n = keys.length;
  var record = new Array(n);
  for (var i = 0; i < n; i += 1) {
    var key = keys[i];
    var value = coerceValue(fields[key]);
    var field = {};
    field[key] = value;
    record[i] = field;
    record[key] = value;
  }
  return record;
}


function RecordBuilder() {
  this.items = [];
}
RecordBuilder.prototype.appendItem = function (item) {
  if (isField(item)) this.appendFields(item);
  else this.appendValue(item);
};
RecordBuilder.prototype.appendFields = function (fields) {
  var keys = Object.keys(fields);
  for (var i = 0, n = keys.length; i < n; i += 1) {
    var key = keys[i];
    var value = fields[key];
    this.appendField(key, value);
  }
};
RecordBuilder.prototype.appendField = function (key, value) {
  var field = {};
  if (typeof key === 'string') {
    field[key] = value;
    this.items.push(field);
    this.items[key] = value;
  }
  else {
    field.$key = key;
    field.$value = value;
    this.items.push(field);
  }
};
RecordBuilder.prototype.appendValue = function (value) {
  this.items.push(value);
};
RecordBuilder.prototype.appendRecord = function (record) {
  for (var i = 0, n = record.length; i < n; i += 1) {
    this.appendItem(record[i]);
  }
};
RecordBuilder.prototype.state = function () {
  return this.items;
};


function ValueBuilder() {
  this.items = null;
  this.value = null;
}
ValueBuilder.prototype.appendItem = function (item) {
  if (isField(item)) this.appendField(item);
  else this.appendValue(item);
};
ValueBuilder.prototype.appendFields = function (fields) {
  var keys = Object.keys(fields);
  for (var i = 0, n = keys.length; i < n; i += 1) {
    var key = keys[i];
    var value = fields[key];
    this.appendField(key, value);
  }
};
ValueBuilder.prototype.appendField = function (key, value) {
  if (this.items === null) {
    this.items = [];
    if (this.value !== null) {
      this.items.push(this.value);
      this.value = null;
    }
  }
  var field = {};
  if (typeof key === 'string') {
    field[key] = value;
    this.items.push(field);
    this.items[key] = value;
  }
  else {
    field.$key = key;
    field.$value = value;
    this.items.push(field);
  }
};
ValueBuilder.prototype.appendValue = function (value) {
  if (this.items !== null) this.items.push(value);
  else if (this.value === null) this.value = value;
  else {
    this.items = [];
    this.items.push(this.value);
    this.value = null;
    this.items.push(value);
  }
};
ValueBuilder.prototype.state = function () {
  if (this.value !== null) return this.value;
  else if (this.items !== null) return this.items;
};


function StringIterator(string, index, more) {
  this.string = string || '';
  this.index = index || 0;
  this.more = more || false;
}
StringIterator.prototype.isDone = function () {
  return this.isEmpty() && !this.more;
};
StringIterator.prototype.isEmpty = function () {
  return this.index >= this.string.length;
};
StringIterator.prototype.head = function () {
  var c1 = this.string.charCodeAt(this.index);
  if (c1 <= 0xD7FF || c1 >= 0xE000) return c1; // U+0000..U+D7FF | U+E000..U+FFFF
  else if (c1 <= 0xDBFF && this.index + 1 < this.string.length) { // c1 >= 0xD800
    var c2 = this.string.charCodeAt(this.index + 1);
    if (c2 >= 0xDC00 && c2 <= 0xDFFF) // U+10000..U+10FFFF
      return (((c1 & 0x3FF) << 10) | (c2 & 0x3FF)) + 0x10000;
    else return 0xFFFD;
  }
  else return 0xFFFD;
};
StringIterator.prototype.step = function () {
  var c1 = this.string.charCodeAt(this.index);
  if (c1 <= 0xD7FF || c1 >= 0xE000) // U+0000..U+D7FF | U+E000..U+FFFF
    this.index += 1;
  else if (c1 <= 0xDBFF && this.index + 1 < this.string.length) { // c1 >= 0xD800
    var c2 = this.string.charCodeAt(this.index + 1);
    if (c2 >= 0xDC00 && c2 <= 0xDFFF) // U+10000..U+10FFFF
      this.index += 2;
    else this.index += 1;
  }
  else this.index += 1;
};
StringIterator.prototype.dup = function () {
  return new StringIterator(this.string, this.index, this.more);
};

StringIterator.Done = {
  isDone: function () {
    return true;
  },
  isEmpty: function () {
    return true;
  },
  head: function () {
    throw 'head of empty iterator';
  },
  step: function () {
    throw 'empty iterator step';
  }
};
StringIterator.Done.prototype = Object.create(StringIterator.prototype);


function StringIteratee() {}
StringIteratee.prototype.isCont = function () {
  return true;
};
StringIteratee.prototype.isDone = function () {
  return false;
};
StringIteratee.prototype.isError = function () {
  return false;
};
StringIteratee.prototype.feed = function (input) {
  return this;
};
StringIteratee.prototype.run = function (input) {
  var next = this;
  do next = next.feed(input);
  while (!input.isEmpty() && next.isCont());
  if (input.isEmpty() && !input.isDone() && next.isCont()) {
    next = next.feed(StringIterator.Done);
  }
  return next;
};
StringIteratee.prototype.state = function () {};

StringIteratee.Done = function (value) {
  StringIteratee.call(this);
  this.value = value;
};
StringIteratee.Done.prototype = Object.create(StringIteratee.prototype);
StringIteratee.Done.prototype.constructor = StringIteratee.Done;
StringIteratee.Done.prototype.isCont = function () {
  return false;
};
StringIteratee.Done.prototype.isDone = function () {
  return true;
};
StringIteratee.Done.prototype.feed = function (input) {
  return this;
};
StringIteratee.Done.prototype.state = function () {
  return this.value;
};

StringIteratee.Error = function (error) {
  StringIteratee.call(this);
  if (typeof error.found === 'number') error.found = String.fromCharCode(error.found);
  this.error = error;
};
StringIteratee.Error.prototype = Object.create(StringIteratee.prototype);
StringIteratee.Error.prototype.constructor = StringIteratee.Error;
StringIteratee.Error.prototype.isCont = function () {
  return false;
};
StringIteratee.Error.prototype.isError = function () {
  return true;
};
StringIteratee.Error.prototype.feed = function (input) {
  return this;
};
StringIteratee.Error.prototype.state = function () {
  throw this.error;
};

StringIteratee.unexpectedEOF = new StringIteratee.Error('unexpected end of input');


function StringBuilder(s) {
  this.string = s || '';
}
StringBuilder.prototype.append = function (c) {
  if ((c >= 0x0000 && c <= 0xD7FF) ||
      (c >= 0xE000 && c <= 0xFFFF)) { // U+0000..U+D7FF | U+E000..U+FFFF
    this.string += String.fromCharCode(c);
  }
  else if (c >= 0x10000 && c <= 0x10FFFF) { // U+10000..U+10FFFF
    var u = c - 0x10000;
    this.string += String.fromCharCode(0xD800 | (u >>> 10), 0xDC00 | (u & 0x3FF));
  }
  else { // invalid code point
    this.string += String.fromCharCode(0xFFFD);
  }
};
StringBuilder.prototype.appendString = function (s) {
  var cs = new StringIterator(s);
  while (!cs.isEmpty()) {
    this.append(cs.head());
    cs.step();
  }
};
StringBuilder.prototype.state = function () {
  return this.string;
};


function DataBuilder() {
  this.buffer = null;
  this.offset = 0;
  this.aliased = true;
  this.p = 0;
  this.q = 0;
  this.r = 0;
  this.s = 0;
}
DataBuilder.prototype.prepare = function (size) {
  function expand(base, size) {
    var n = Math.max(base, size) - 1;
    n |= n >> 1; n |= n >> 2; n |= n >> 4; n |= n >> 8;
    return n + 1;
  }
  if (this.aliased || size > this.buffer.length) {
    var array = new Uint8Array(expand(256, size));
    if (this.buffer) array.set(this.buffer);
    this.buffer = array;
    this.aliased = false;
  }
};
DataBuilder.prototype.appendByte = function (value) {
  this.prepare(this.offset + 1);
  this.buffer[this.offset] = value;
  this.offset += 1;
};
DataBuilder.prototype.decodeBase64Digit = function (c) {
  if (c >= 65/*'A'*/ && c <= 90/*'Z'*/) return c - 65/*'A'*/;
  else if (c >= 97/*'a'*/ && c <= 122/*'z'*/) return c - 71/*'a' - 26*/;
  else if (c >= 48/*'0'*/ && c <= 57/*'9'*/) return c + 4/*52 - '0'*/;
  else if (c === 43/*'+'*/ || c === 45/*'-'*/) return 62;
  else if (c === 47/*'/'*/ || c === 95/*'_'*/) return 63;
};
DataBuilder.prototype.decodeBase64Quantum = function () {
  var x = this.decodeBase64Digit(this.p);
  var y = this.decodeBase64Digit(this.q);
  if (this.r !== 61/*'='*/) {
    var z = this.decodeBase64Digit(this.r);
    if (this.s !== 61/*'='*/) {
      var w = this.decodeBase64Digit(this.s);
      this.appendByte((x << 2) | (y >>> 4));
      this.appendByte((y << 4) | (z >>> 2));
      this.appendByte((z << 6) | w);
    }
    else {
      this.appendByte((x << 2) | (y >>> 4));
      this.appendByte((y << 4) | (z >>> 2));
    }
  }
  else {
    if (this.s !== 61/*'='*/) throw 'incomplete base64 quantum';
    this.appendByte((x << 2) | (y >>> 4));
  }
};
DataBuilder.prototype.appendBase64Char = function (c) {
  if (this.p === 0) this.p = c;
  else if (this.q === 0) this.q = c;
  else if (this.r === 0) this.r = c;
  else {
    this.s = c;
    this.decodeBase64Quantum();
    this.s = 0;
    this.r = 0;
    this.q = 0;
    this.p = 0;
  }
};
DataBuilder.prototype.state = function (value) {
  if (!this.buffer) this.buffer = new Uint8Array(0);
  else if (this.buffer.length !== this.offset) {
    var array = new Uint8Array(this.offset);
    array.set(this.buffer.subarray(0, this.offset));
    this.buffer = array;
  }
  this.aliased = true;
  return this.buffer;
};


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


function DocumentParser(value) {
  StringIteratee.call(this);
  this.value = value || new BlockParser();
}
DocumentParser.prototype = Object.create(StringIteratee.prototype);
DocumentParser.prototype.constructor = DocumentParser;
DocumentParser.prototype.feed = function (input) {
  var value = this.value;
  while ((!input.isEmpty() || input.isDone()) && value.isCont()) value = value.feed(input);
  if (value.isError()) return value;
  if (value.isDone()) {
    if (!input.isEmpty()) return new StringIteratee.Error({found: input.head()});
    else if (input.isDone()) return value;
  }
  return new DocumentParser(value);
};


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


function AuthorityParser(userInfo, host, port, s) {
  StringIteratee.call(this);
  this.userInfo = userInfo || null;
  this.host = host || null;
  this.port = port || null;
  this.s = s || 1;
}
AuthorityParser.prototype = Object.create(StringIteratee.prototype);
AuthorityParser.prototype.constructor = AuthorityParser;
AuthorityParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var port = this.port;
  var host = this.host;
  var userInfo = this.userInfo;
  var authority, hostinfo, userinfo;
  if (s === 1) {
    if (!input.isEmpty()) {
      var look = input.dup();
      while (!look.isEmpty() && (c = look.head(), c !== 64/*'@'*/ && c !== 47/*'/'*/)) look.step();
      if (!look.isEmpty() && c === 64/*'@'*/) s = 2;
      else s = 3;
    }
    else if (input.isDone()) s = 3;
  }
  if (s === 2) {
    userInfo = userInfo || new UserInfoParser();
    userInfo = userInfo.feed(input);
    if (userInfo.isError()) return userInfo;
    else if (!input.isEmpty() && (c = input.head(), c === 64/*'@'*/)) {
      input.step();
      s = 3;
    }
    else if (!input.isEmpty()) return new StringIteratee.Error({expected: 64/*'@'*/, found: c});
    else if (input.isDone()) return StringIteratee.unexpectedEOF();
  }
  if (s === 3) {
    host = host || new HostParser();
    host = host.feed(input);
    if (host.isError()) return host;
    else if (!input.isEmpty() && input.head() === 58/*':'*/) {
      input.step();
      s = 4;
    }
    else if (!input.isEmpty() || input.isDone()) {
      if (host.state()) {
        authority = {};
        hostinfo = host.state();
        if (hostinfo.name !== undefined) authority.host = hostinfo.name;
        if (hostinfo.ipv4 !== undefined) authority.ipv4 = hostinfo.ipv4;
        if (hostinfo.ipv6 !== undefined) authority.ipv6 = hostinfo.ipv6;
        if (userInfo) {
          userinfo = userInfo.state();
          if (typeof userinfo === 'string') authority.userInfo = userinfo;
          else if (userinfo) {
            authority.username = userinfo.username;
            authority.password = userinfo.password;
          }
        }
        return new StringIteratee.Done(authority);
      }
      else if (userInfo) {
        authority = {};
        userinfo = userInfo.state();
        if (typeof userinfo === 'string') authority.userInfo = userinfo;
        else if (userinfo) {
          authority.username = userinfo.username;
          authority.password = userinfo.password;
        }
        return new StringIteratee.Done(authority);
      }
      return new StringIteratee.Done(undefined);
    }
  }
  if (s === 4) {
    port = port || new PortParser();
    port = port.feed(input);
    if (port.isError()) return port;
    else if (!input.isEmpty() || input.isDone()) {
      authority = {};
      hostinfo = host.state();
      if (hostinfo.name !== undefined) authority.host = hostinfo.name;
      if (hostinfo.ipv4 !== undefined) authority.ipv4 = hostinfo.ipv4;
      if (hostinfo.ipv6 !== undefined) authority.ipv6 = hostinfo.ipv6;
      authority.port = port.state();
      if (userInfo) {
        userinfo = userInfo.state();
        if (typeof userinfo === 'string') authority.userInfo = userinfo;
        else if (userinfo) {
          authority.username = userinfo.username;
          authority.password = userinfo.password;
        }
      }
      return new StringIteratee.Done(authority);
    }
  }
  return new AuthorityParser(userInfo, host, port, s);
};
AuthorityParser.prototype.state = function () {
  if (this.host && this.host.state()) {
    var authority = {};
    var hostinfo = this.host.state();
    if (hostinfo.name !== undefined) authority.host = hostinfo.name;
    if (hostinfo.ipv4 !== undefined) authority.ipv4 = hostinfo.ipv4;
    if (hostinfo.ipv6 !== undefined) authority.ipv6 = hostinfo.ipv6;
    if (this.port) authority.port = this.port.state();
    if (this.userInfo) {
      var userinfo = this.userInfo.state();
      if (typeof userinfo === 'string') authority.userInfo = userinfo;
      else if (userinfo) {
        authority.username = userinfo.username;
        authority.password = userinfo.password;
      }
    }
    return authority;
  }
};


function UserInfoParser(username, password, c1, s) {
  StringIteratee.call(this);
  this.username = username || null;
  this.password = password || null;
  this.c1 = c1 || 0;
  this.s = s || 1;
}
UserInfoParser.prototype = Object.create(StringIteratee.prototype);
UserInfoParser.prototype.constructor = UserInfoParser;
UserInfoParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var c1 = this.c1;
  var password = this.password;
  var username = this.username;
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      if (!username && !input.isEmpty()) username = new StringBuilder();
      while (!input.isEmpty() && (c = input.head(), isUserChar(c))) {
        input.step();
        username.append(c);
      }
      if (!input.isEmpty() && c === 58/*':'*/) {
        input.step();
        s = 4;
      }
      else if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 2;
      }
      else if (!input.isEmpty() || input.isDone()) {
        return new StringIteratee.Done(username.state());
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
        input.step();
        username.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 1;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 4) {
      password = password || new StringBuilder();
      while (!input.isEmpty() && (c = input.head(), isUserInfoChar(c))) {
        input.step();
        password.append(c);
      }
      if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 5;
      }
      else if (!input.isEmpty() || input.isDone()) {
        var userInfo = {username: username.state(), password: password.state()};
        return new StringIteratee.Done(userInfo);
      }
    }
    if (s === 5) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        c1 = c;
        s = 6;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 6) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        password.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 4;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new UserInfoParser(username, password, c1, s);
};
UserInfoParser.prototype.state = function () {
  if (this.password) return {username: this.username.state(), password: this.password.state()};
  else if (this.username) return this.username.state();
};


function HostParser() {
  StringIteratee.call(this);
}
HostParser.prototype = Object.create(StringIteratee.prototype);
HostParser.prototype.constructor = HostParser;
HostParser.prototype.feed = function (input) {
  if (!input.isEmpty()) {
    var c = input.head();
    if (c === 91/*'['*/) return new HostLiteralParser().feed(input);
    else return new HostAddressParser().feed(input);
  }
  return this;
};


function HostAddressParser(builder, c1, x, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.c1 = c1 || 0;
  this.x = x || 0;
  this.s = s || 1;
}
HostAddressParser.prototype = Object.create(StringIteratee.prototype);
HostAddressParser.prototype.constructor = HostAddressParser;
HostAddressParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var x = this.x;
  var c1 = this.c1;
  var builder = this.builder;
  var host;
  while (s <= 4 && (!input.isEmpty() || input.isDone())) {
    builder = builder || new StringBuilder();
    while (!input.isEmpty() && (c = input.head(), isDigit(c))) {
      input.step();
      builder.append(c);
      x = 10 * x + decodeDigit(c);
    }
    if (!input.isEmpty()) {
      if (c === 46/*'.'*/ && s < 4 && x <= 255) {
        input.step();
        builder.append(c);
        x = 0;
        s += 1;
      }
      else if (!isHostChar(c) && c !== 37/*'%'*/ && s === 4 && x <= 255) {
        host = {ipv4: builder.state()};
        return new StringIteratee.Done(host);
      }
      else {
        x = 0;
        s = 5;
      }
    }
    else if (input.isDone()) {
      if (s === 4 && x <= 255) {
        host = {ipv4: builder.state()};
        return new StringIteratee.Done(host);
      }
      else {
        host = {name: builder.state()};
        return new StringIteratee.Done(host);
      }
    }
  }
  while (!input.isEmpty() || input.isDone()) {
    if (s === 5) {
      while (!input.isEmpty() && (c = input.head(), isHostChar(c))) {
        input.step();
        builder.append(toLowerCase(c));
      }
      if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 6;
      }
      else if (!input.isEmpty() || input.isDone()) {
        host = {name: builder.state()};
        return new StringIteratee.Done(host);
      }
    }
    if (s === 6) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        c1 = c;
        s = 7;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 7) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        builder.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 5;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new HostAddressParser(builder, c1, x, s);
};
HostAddressParser.prototype.state = function () {
  if (this.builder) {
    if (this.s === 4 && this.x <= 255) return {ipv4: this.builder.state()};
    else return {name: this.builder.state()};
  }
};


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


function PortParser(port) {
  StringIteratee.call(this);
  this.port = port || 0;
}
PortParser.prototype = Object.create(StringIteratee.prototype);
PortParser.prototype.constructor = PortParser;
PortParser.prototype.feed = function (input) {
  var c = 0;
  var port = this.port;
  while (!input.isEmpty() && (c = input.head(), isDigit(c))) {
    input.step();
    port = 10 * port + decodeDigit(c);
  }
  if (!input.isEmpty() || input.isDone()) return new StringIteratee.Done(port);
  return new PortParser(port);
};
PortParser.prototype.state = function () {
  if (this.port !== 0) return this.port;
};


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


function QueryParser(key, value, query, c1, s) {
  StringIteratee.call(this);
  this.key = key || null;
  this.value = value || null;
  this.query = query || null;
  this.c1 = c1 || 0;
  this.s = s || 1;
}
QueryParser.prototype = Object.create(StringIteratee.prototype);
QueryParser.prototype.constructor = QueryParser;
QueryParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var c1 = this.c1;
  var query = this.query;
  var value = this.value;
  var key = this.key;
  var k, v, param;
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      key = key || new StringBuilder();
      while (!input.isEmpty() && (c = input.head(), isParamChar(c))) {
        input.step();
        key.append(c);
      }
      if (!input.isEmpty() && c === 61/*'='*/) {
        input.step();
        s = 4;
      }
      else if (!input.isEmpty() && c === 38/*'&'*/) {
        input.step();
        query = query || [];
        query.push(key.state());
        key = null;
        s = 1;
      }
      else if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 2;
      }
      else if (!input.isEmpty() || input.isDone()) {
        if (!query) return new StringIteratee.Done(key.state());
        else {
          query.push(key.state());
          return new StringIteratee.Done(query);
        }
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
        input.step();
        key.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 1;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 4) {
      value = value || new StringBuilder();
      while (!input.isEmpty() && (c = input.head(), isParamChar(c) || c === 61/*'='*/)) {
        input.step();
        value.append(c);
      }
      if (!input.isEmpty() && c === 38/*'&'*/) {
        input.step();
        k = key.state();
        v = value.state();
        param = {};
        param[k] = v;
        query = query || [];
        query.push(param);
        query[k] = v;
        key = null;
        value = null;
        s = 1;
      }
      else if (!input.isEmpty() && c === 38/*'%'*/) {
        input.step();
        s = 5;
      }
      else if (!input.isEmpty() || input.isDone()) {
        k = key.state();
        v = value.state();
        param = {};
        param[k] = v;
        query = query || [];
        query.push(param);
        query[k] = v;
        return new StringIteratee.Done(query);
      }
    }
    if (s === 5) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        c1 = c;
        s = 6;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
    if (s === 6) {
      if (!input.isEmpty() && (c = input.head(), isHexChar(c))) {
        input.step();
        value.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 4;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new QueryParser(key, value, query, c1, s);
};
QueryParser.prototype.state = function () {
  if (this.query) return this.query;
};


function FragmentParser(builder, c1, s) {
  StringIteratee.call(this);
  this.builder = builder || null;
  this.c1 = c1 || 0;
  this.s = s || 1;
}
FragmentParser.prototype = Object.create(StringIteratee.prototype);
FragmentParser.prototype.constructor = FragmentParser;
FragmentParser.prototype.feed = function (input) {
  var c = 0;
  var s = this.s;
  var c1 = this.c1;
  var builder = this.builder || new StringBuilder();
  while (!input.isEmpty() || input.isDone()) {
    if (s === 1) {
      while (!input.isEmpty() && (c = input.head(), isFragmentChar(c))) {
        input.step();
        builder.append(c);
      }
      if (!input.isEmpty() && c === 37/*'%'*/) {
        input.step();
        s = 2;
      }
      else if (!input.isEmpty() || input.isDone()) {
        return new StringIteratee.Done(builder.state());
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
        input.step();
        builder.append((decodeHex(c1) << 4) + decodeHex(c));
        c1 = 0;
        s = 1;
      }
      else if (!input.isEmpty()) return new StringIteratee.Error({expected: 'hex digit', found: c});
      else if (input.isDone()) return StringIteratee.unexpectedEOF;
    }
  }
  return new FragmentParser(builder, c1, s);
};
FragmentParser.prototype.state = function () {
  if (this.builder) return this.builder.state();
};


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
function resolveUri(base, relative) {
  if (typeof base === 'string') base = parseUri(base);
  if (typeof relative === 'string') relative = parseUri(relative);
  var absolute = {};
  if (relative.scheme) {
    absolute.scheme = relative.scheme;
    if (relative.authority) absolute.authority = relative.authority;
    if (relative.path) absolute.path = removeDotSegments(relative.path);
    if (relative.query !== undefined) absolute.query = relative.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  else if (relative.authority) {
    if (base.scheme) absolute.scheme = base.scheme;
    absolute.authority = relative.authority;
    if (relative.path) absolute.path = removeDotSegments(relative.path);
    if (relative.query !== undefined) absolute.query = relative.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  else if (!relative.path || !relative.path.length) {
    if (base.scheme) absolute.scheme = base.scheme;
    if (base.authority) absolute.authority = base.authority;
    if (base.path) absolute.path = base.path;
    if (relative.query !== undefined) absolute.query = relative.query;
    else if (base.query !== undefined) absolute.query = base.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  else if (relative.path[0] === '/') {
    if (base.scheme) absolute.scheme = base.scheme;
    if (base.authority) absolute.authority = base.authority;
    if (relative.path) absolute.path = removeDotSegments(relative.path);
    if (relative.query !== undefined) absolute.query = relative.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  else {
    if (base.scheme) absolute.scheme = base.scheme;
    if (base.authority) absolute.authority = base.authority;
    absolute.path = removeDotSegments(mergeUriPath(base, relative.path));
    if (relative.query !== undefined) absolute.query = relative.query;
    if (relative.fragment !== undefined) absolute.fragment = relative.fragment;
  }
  return absolute;
}
function mergeUriPath(base, relativePath) {
  if (base.authority && (!base.path || !base.path.length)) {
    var segments = relativePath.slice();
    segments.unshift('/');
    return segments;
  }
  else if (!base.path || !base.path.length) return relativePath;
  else return mergePath(base.path.slice(), relativePath);
}
function mergePath(basePath, relativePath) {
  var segments = [];
  var head = basePath.shift();
  while (basePath.length > 0) {
    segments.push(head);
    head = basePath.shift();
  }
  if (head === '/') segments.push(head);
  for (var i = 0, n = relativePath.length; i < n; i += 1) {
    segments.push(relativePath[i]);
  }
  return segments;
}
function removeDotSegments(path) {
  var segments = [];
  while (path.length > 0) {
    var head = path[0];
    if (head === '.' || head === '..') {
      path = path.slice(path.length > 1 ? 2 : 1);
    }
    else if (head === '/') {
      if (path.length > 1) {
        var next = path[1];
        if (next === '.') {
          path = path.length > 2 ? path.slice(2) : ['/'];
        }
        else if (next === '..') {
          path = path.length > 2 ? path.slice(2) : ['/'];
          if (segments.length > 1 && segments[segments.length - 1] !== '/') {
            segments = segments.slice(0, segments.length - 2);
          }
          else if (segments.length > 0) {
            segments = segments.slice(0, segments.length - 1);
          }
        }
        else {
          segments.push(head);
          segments.push(next);
          path = path.slice(2);
        }
      }
      else {
        segments.push('/');
        path.shift();
      }
    }
    else {
      segments.push(head);
      path.shift();
    }
  }
  return segments;
}
function unresolveUri(base, absolute) {
  if (typeof base === 'string') base = parseUri(base);
  if (typeof absolute === 'string') absolute = parseUri(absolute);
  if (base.scheme !== absolute.scheme || !equal(base.authority, absolute.authority)) return absolute;
  var relative = {};
  var basePath = base.path;
  if (typeof basePath === 'string') basePath = parsePath(basePath);
  else if (!basePath) basePath = [];
  else basePath = basePath.slice();
  var absolutePath = absolute.path;
  if (typeof absolutePath === 'string') absolutePath = parsePath(absolutePath);
  else if (!absolutePath) absolutePath = [];
  var relativePath = unmergePath(basePath, absolutePath.slice(), absolutePath);
  if (relativePath.length > 0) relative.path = relativePath;
  if (absolute.query !== undefined) relative.query = absolute.query;
  if (absolute.fragment !== undefined) relative.fragment = absolute.fragment;
  return relative;
}
function unmergePath(basePath, relativePath, absolutePath) {
  if (basePath.length === 0) {
    if (relativePath.length > 1) relativePath.shift();
    return relativePath;
  }
  else if (basePath[0] !== '/') {
    return relativePath;
  }
  else if (relativePath.length === 0 || relativePath[0] !== '/') {
    relativePath.unshift('/');
    return relativePath;
  }
  else {
    basePath.shift();
    relativePath.shift();
    if (basePath.length > 0 && relativePath.length === 0) return ['/'];
    else if (basePath.length === 0 || relativePath.length === 0 || basePath[0] !== relativePath[0]) {
      return relativePath;
    }
    else {
      basePath.shift();
      relativePath.shift();
      if (basePath.length > 0 && relativePath.length === 0) return absolutePath;
      else return unmergePath(basePath, relativePath, absolutePath);
    }
  }
}

function UriWriter(builder) {
  this.builder = builder || new StringBuilder();
}
UriWriter.prototype.writeUri = function (uri) {
  if (uri.scheme) {
    this.writeScheme(uri.scheme);
    this.builder.append(58/*':'*/);
  }
  if (uri.authority) {
    this.builder.append(47/*'/'*/);
    this.builder.append(47/*'/'*/);
    this.writeAuthority(uri.authority);
  }
  if (uri.path) {
    this.writePath(uri.path);
  }
  if (uri.query !== undefined) {
    this.builder.append(63/*'?'*/);
    this.writeQuery(uri.query);
  }
  if (uri.fragment !== undefined) {
    this.builder.append(35/*'#'*/);
    this.writeFragment(uri.fragment);
  }
};
UriWriter.prototype.writeScheme = function (scheme) {
  var cs = new StringIterator(scheme);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isSchemeChar(c)) this.builder.append(c);
    else throw 'Invalid URI scheme: ' + scheme;
    cs.step();
  }
};
UriWriter.prototype.writeAuthority = function (authority) {
  if (typeof authority === 'string') authority = parseAuthority(authority);
  if (authority.userInfo !== undefined) {
    this.writeUserInfo(authority.userInfo);
    this.builder.append(64/*'@'*/);
  }
  else if (authority.username !== undefined && authority.password !== undefined) {
    this.writeUser(authority.username);
    this.builder.append(58/*':'*/);
    this.writeUserInfo(authority.password);
    this.builder.append(64/*'@'*/);
  }
  if (authority.host !== undefined) {
    this.writeHost(authority.host);
  }
  else if (authority.ipv4 !== undefined) {
    this.writeHost(authority.ipv4);
  }
  else if (authority.ipv6 !== undefined) {
    this.builder.append(91/*'['*/);
    this.writeHostLiteral(authority.ipv6);
    this.builder.append(93/*']'*/);
  }
  if (authority.port) {
    this.builder.append(58/*':'*/);
    this.writePort(authority.port);
  }
};
UriWriter.prototype.writeUserInfo = function (userInfo) {
  var cs = new StringIterator(userInfo);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isUserInfoChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeUser = function (user) {
  var cs = new StringIterator(user);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isUserChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeHost = function (host) {
  var cs = new StringIterator(host);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isHostChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeHostLiteral = function (host) {
  var cs = new StringIterator(host);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isHostChar(c) || c === 58/*':'*/) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writePort = function (port) {
  var i = 9;
  var digits = new Array(10);
  while (port > 0) {
    digits[i] = port % 10;
    port = Math.floor(port / 10);
    i -= 1;
  }
  i += 1;
  while (i < 10) {
    this.builder.append(48/*'0'*/ + digits[i]);
    i += 1;
  }
};
UriWriter.prototype.writePath = function (path) {
  if (typeof path === 'string') path = parsePath(path);
  for (var i = 0, n = path.length; i < n; i += 1) {
    var segment = path[i];
    if (segment === '/') this.builder.append(47/*'/'*/);
    else this.writePathSegment(segment);
  }
};
UriWriter.prototype.writePathSegment = function (segment) {
  var cs = new StringIterator(segment);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isPathChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeQuery = function (query) {
  if (typeof query === 'string') this.writeQueryPart(query);
  else if (Array.isArray(query)) this.writeQueryArray(query);
  else if (query) this.writeQueryParams(query);
};
UriWriter.prototype.writeQueryArray = function (query) {
  for (var i = 0, n = query.length; i < n; i += 1) {
    var param = query[i];
    if (typeof param === 'string') {
      if (i > 0) this.builder.append(38/*'&'*/);
      this.writeQueryParam(param);
    }
    else this.writeQueryParams(param, i);
  }
};
UriWriter.prototype.writeQueryParams = function (params, i) {
  var keys = Object.keys(params);
  for (var j = 0, n = keys.length; j < n; i += 1, j += 1) {
    var key = keys[j];
    var value = params[key];
    if (i > 0) this.builder.append(38/*'&'*/);
    this.writeQueryParam(key);
    this.builder.append(61/*'='*/);
    this.writeQueryParam(value);
  }
};
UriWriter.prototype.writeQueryParam = function (param) {
  var cs = new StringIterator(param);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isParamChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeQueryPart = function (query) {
  var cs = new StringIterator(query);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isQueryChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeFragment = function (fragment) {
  var cs = new StringIterator(fragment);
  while (!cs.isEmpty()) {
    var c = cs.head();
    if (isFragmentChar(c)) this.builder.append(c);
    else this.writeEncoded(c);
    cs.step();
  }
};
UriWriter.prototype.writeEncoded = function (c) {
  if (c === 0x00) { // modified UTF-8
    this.writePctEncoded(0xC0);
    this.writePctEncoded(0x80);
  }
  else if (c >= 0x00 && c <= 0x7F) { // U+0000..U+007F
    this.writePctEncoded(c);
  }
  else if (c >= 0x80 && c <= 0x07FF) { // U+0080..U+07FF
    this.writePctEncoded(0xC0 | (c >>> 6));
    this.writePctEncoded(0x80 | (c & 0x3F));
  }
  else if (c >= 0x0800 && c <= 0xFFFF || // U+0800..U+D7FF
           c >= 0xE000 && c <= 0xFFFF) { // U+E000..U+FFFF
    this.writePctEncoded(0xE0 | (c >>> 12));
    this.writePctEncoded(0x80 | (c >>> 6 & 0x3F));
    this.writePctEncoded(0x80 | (c & 0x3F));
  }
  else if (c >= 0x10000 && c <= 0x10FFFF) { // U+10000..U+10FFFF
    this.writePctEncoded(0xF0 | (c >>> 18));
    this.writePctEncoded(0x80 | (c >>> 12 & 0x3F));
    this.writePctEncoded(0x80 | (c >>> 6 & 0x3F));
    this.writePctEncoded(0x80 | (c & 0x3F));
  }
  else { // surrogate or invalid code point
    this.writePctEncoded(0xEF);
    this.writePctEncoded(0xBF);
    this.writePctEncoded(0xBD);
  }
};
UriWriter.prototype.writePctEncoded = function (c) {
  this.builder.append(37/*'%'*/);
  this.builder.append(encodeHex(c >>> 4 & 0xF));
  this.builder.append(encodeHex(c & 0xF));
};
UriWriter.prototype.state = function () {
  return this.builder.state();
};

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
