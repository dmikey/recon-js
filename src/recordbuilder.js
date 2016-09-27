'use strict';



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

module.exports = RecordBuilder;