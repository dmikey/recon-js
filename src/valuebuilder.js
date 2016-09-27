'use strict';

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

module.exports = ValueBuilder;