'use strict';


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

module.exports = ReconWriter;