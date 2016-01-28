'use strict';
/* global describe: false */
/* global it: false */

var assert = require('assert');
var recon = require('./recon.js');
var pkg = require('./package.json');
var parse = recon.parse;
var stringify = recon.stringify;
var base64 = recon.base64;
var uri = recon.uri;

assert.same = function (x, y) {
  if (!recon.equal(x, y)) {
    assert.fail(false, true, recon.stringify(x) + ' did not equal ' + recon.stringify(y));
  }
};
assert.orderBefore = function (x, y) {
  var order = recon.compare(x, y);
  if (order >= 0) {
    assert.fail(order, -1, recon.stringify(x) + ' did not order before ' + recon.stringify(y));
  }
};
assert.orderAfter = function (x, y) {
  var order = recon.compare(x, y);
  if (order <= 0) {
    assert.fail(order, 1, recon.stringify(x) + ' did not order after ' + recon.stringify(y));
  }
};
assert.orderSame = function (x, y) {
  var order = recon.compare(x, y);
  if (order !== 0) {
    assert.fail(order, 0, recon.stringify(x) + ' did not order the same as ' + recon.stringify(y));
  }
};


describe('RECON library', function () {
  it('should normalize JSON arrays', function () {
    assert.same(recon([1, 2, 3]), [1, 2, 3]);
    assert.same(recon(1, 2, 3), [1, 2, 3]);
  });

  it('should noramlize JSON objects', function () {
    var record = recon({'@hello': 'world', answer: 42});
    assert.same(record, [{'@hello': 'world'}, {answer: 42}]);
    assert.equal(record['@hello'], 'world');
    assert.equal(record.answer, 42);
  });

  it('should return the head value of a record', function () {
    var record = recon([1, 2]);
    assert.equal(recon.head(record), 1);
  });

  it('should return the head ident keyed slot value of a record', function () {
    var record = recon([{a: 1}, 2]);
    assert.equal(recon.head(record), 1);
  });

  it('should return the head value keyed slot value of a record', function () {
    var record = recon([{$key: true, $value: 1}, 2]);
    assert.equal(recon.head(record), 1);
  });

  it('should return the head attribute value of a record', function () {
    var record = recon([{'@a': 1}, 2]);
    assert.equal(recon.head(record), 1);
  });

  it('should return the head of a value as the value itself', function () {
    assert.equal(recon.head('test'), 'test');
    assert.equal(recon.head(42), 42);
    assert.equal(recon.head(true), true);
    assert.equal(recon.head(null), null);
    assert.equal(recon.head(undefined), undefined);
  });

  it('should return the tail of a record', function () {
    var record = recon.tail([{a: 1}, {b: 2}, 3, {d: 4}, 5]);
    assert.same(record, [{b: 2}, 3, {d: 4}, 5]);
    assert.equal(record.a, undefined);
    assert.equal(record.b, 2);
    assert.equal(record.d, 4);
  });

  it('should return an undefined tail for a value', function () {
    assert.equal(recon.tail('test'), undefined);
    assert.equal(recon.tail(42), undefined);
    assert.equal(recon.tail(true), undefined);
    assert.equal(recon.tail(null), undefined);
    assert.equal(recon.tail(undefined), undefined);
  });

  it('should return the ident tag of a record', function () {
    var record = recon([{a: 1}, 2]);
    assert.equal(recon.tag(record), 'a');
  });

  it('should return the value tag of a record', function () {
    var record = recon([{$key: true, $value: 1}, 2]);
    assert.equal(recon.tag(record), true);
  });

  it('should return the attribute tag of a record', function () {
    var record = recon([{'@a': 1}, 2]);
    assert.equal(recon.tag(record), '@a');
  });

  it('should return an undefined tag for a value', function () {
    assert.equal(recon.tag('test'), undefined);
    assert.equal(recon.tag(42), undefined);
    assert.equal(recon.tag(true), undefined);
    assert.equal(recon.tag(null), undefined);
    assert.equal(recon.tag(undefined), undefined);
  });

  it('should set ident keyed record slots', function () {
    var record = [1, {foo: 'bar'}, 3];
    recon.set(record, 'foo', 'baz');
    assert.same(record, [1, {foo: 'baz'}, 3]);
    assert.equal(record.foo, 'baz');
  });

  it('should set ident keyed record attributes', function () {
    var record = [1, {'@hello': 'there'}, 3];
    recon.set(record, '@hello', 'world');
    assert.same(record, [1, {'@hello': 'world'}, 3]);
    assert.equal(record['@hello'], 'world');
  });

  it('should set value keyed record slots', function () {
    var record = [1, {$key: [{'@planet': null}], $value: 'Neptune'}, 3];
    recon.set(record, [{'@planet': null}], 'Pluto');
    assert.same(record, [1, {$key: [{'@planet': null}], $value: 'Pluto'}, 3]);
    assert.equal(recon.get(record, [{'@planet': null}]), 'Pluto');
  });

  it('should concat two values', function () {
    assert.same(recon.concat(1, 2), [1, 2]);
  });

  it('should concat a record and a value', function () {
    var record = recon.concat([{'@a': true}, 2], 3);
    assert.same(record, [{'@a': true}, 2, 3]);
    assert.equal(record['@a'], true);
  });

  it('should concat a value and a record', function () {
    var record = recon.concat(1, [2, {'@z': false}]);
    assert.same(record, [1, 2, {'@z': false}]);
    assert.equal(record['@z'], false);
  });

  it('should concat two objects', function () {
    var record = recon.concat({a: 1}, {b: 2});
    assert.same(record, [{a: 1}, {b: 2}]);
    assert.equal(record.a, 1);
    assert.equal(record.b, 2);
  });

  it('should concat a record and an object', function () {
    var record = recon.concat([{a: 1}, true], {b: 2});
    assert.same(record, [{a: 1}, true, {b: 2}]);
    assert.equal(record.a, 1);
    assert.equal(record.b, 2);
  });

  it('should concat an object and a record', function () {
    var record = recon.concat({a: 1}, [true, {b: 2}]);
    assert.same(record, [{a: 1}, true, {b: 2}]);
    assert.equal(record.a, 1);
    assert.equal(record.b, 2);
  });

  it('should concat two records', function () {
    var record = recon.concat([{'@a': true}, 2], [3, {'@z': false}]);
    assert.same(record, [{'@a': true}, 2, 3, {'@z': false}]);
    assert.equal(record['@a'], true);
    assert.equal(record['@z'], false);
  });

  it('should concat undefined values', function () {
    assert.same(recon.concat(undefined, undefined), []);
    assert.same(recon.concat(1, undefined), [1]);
    assert.same(recon.concat(undefined, 2), [2]);
    assert.same(recon.concat([1, 2], undefined), [1, 2]);
    assert.same(recon.concat(undefined, [3, 4]), [3, 4]);
  });

  it('should expose its build config', function () {
    assert.equal(recon.config.version, pkg.version);
  });
});


describe('Item ordering', function () {
  it('Attributes should order by key then by value', function () {
    assert.orderBefore({'@a': null}, {'@b': null});
    assert.orderAfter({'@b': null}, {'@a': null});
    assert.orderBefore({'@a': 0}, {'@a': 1});
    assert.orderAfter({'@a': 1}, {'@a': 0});
    assert.orderSame({'@a': null}, {'@a': null});
    assert.orderSame({'@a': 0}, {'@a': 0});
  });

  it('Slots should order by key then by value', function () {
    assert.orderBefore({a: null}, {b: null});
    assert.orderAfter({b: null}, {a: null});
    assert.orderBefore({a: 0}, {a: 1});
    assert.orderAfter({a: 1}, {a: 0});
    assert.orderSame({a: null}, {a: null});
    assert.orderSame({a: 0}, {a: 0});
  });

  it('Records should order by sequential item order', function () {
    assert.orderBefore([], [1]);
    assert.orderAfter([1], []);
    assert.orderBefore([1], [1, 'a']);
    assert.orderAfter([1, 'a'], [1]);
    assert.orderBefore([1, 'a'], [1, 'b']);
    assert.orderAfter([1, 'b'], [1, 'a']);
    assert.orderBefore([0, 'a'], [1]);
    assert.orderAfter([1], [0, 'a']);
    assert.orderSame([], []);
    assert.orderSame([1], [1]);
    assert.orderSame([1, 'a'], [1, 'a']);
  });

  it('Strings should order by sequential character order', function () {
    assert.orderBefore('', 'a');
    assert.orderAfter('a', '');
    assert.orderBefore('a', 'aa');
    assert.orderAfter('aa', 'a');
    assert.orderBefore('aa', 'ab');
    assert.orderAfter('ab', 'aa');
    assert.orderBefore('ab', 'b');
    assert.orderAfter('b', 'ab');
    assert.orderSame('', '');
    assert.orderSame('a', 'a');
    assert.orderSame('ab', 'ab');
  });

  it('Data should order by sequential byte order', function () {
    assert.orderBefore(base64(''), base64('AA=='));
    assert.orderAfter(base64('AA=='), base64(''));
    assert.orderBefore(base64('AA=='), base64('AAA='));
    assert.orderAfter(base64('AAA='), base64('AA=='));
    assert.orderBefore(base64('AAA='), base64('AAE='));
    assert.orderAfter(base64('AAE='), base64('AAA='));
    assert.orderBefore(base64('AAE='), base64('AQ=='));
    assert.orderAfter(base64('AQ=='), base64('AAE='));
    assert.orderSame(base64(''), base64(''));
    assert.orderSame(base64('AA=='), base64('AA=='));
    assert.orderSame(base64('AAE='), base64('AAE='));
  });

  it('Numbers should order numerically', function () {
    assert.orderBefore(0, 1);
    assert.orderAfter(1, 0);
    assert.orderBefore(0.5, 1.0);
    assert.orderAfter(1.0, 0.5);
    assert.orderBefore(-1, 1);
    assert.orderAfter(1, -1);
    assert.orderSame(0, 0);
    assert.orderSame(1, 1);
    assert.orderSame(-1, -1);
    assert.orderSame(0.5, 0.5);
  });

  it('Null should order the same as itself', function () {
    assert.orderSame(null, null);
  });

  it('Undefined should order the same as itself', function () {
    assert.orderSame(null, null);
  });

  it('Attributes should order before slots, records, data, strings, numbers, null, and undefined', function () {
    assert.orderBefore({'@a': 1}, {a: 1});
    assert.orderBefore({'@a': 1}, []);
    assert.orderBefore({'@a': 1}, base64(''));
    assert.orderBefore({'@a': 1}, '');
    assert.orderBefore({'@a': 1}, 0);
    assert.orderBefore({'@a': 1}, null);
    assert.orderBefore({'@a': 1}, undefined);
  });

  it('Slots should order after attributes and before records, data, strings, numbers, null, and undefined', function () {
    assert.orderAfter({a: 1}, {'@a': 1});
    assert.orderBefore({a: 1}, []);
    assert.orderBefore({a: 1}, base64(''));
    assert.orderBefore({a: 1}, '');
    assert.orderBefore({a: 1}, 0);
    assert.orderBefore({a: 1}, null);
    assert.orderBefore({a: 1}, undefined);
  });

  it('Records should order after attributes and slots, and before data, strings, numbers, null, and undefined', function () {
    assert.orderAfter([], {'@a': 1});
    assert.orderAfter([], {a: 1});
    assert.orderBefore([], base64(''));
    assert.orderBefore([], '');
    assert.orderBefore([], 0);
    assert.orderBefore([], null);
    assert.orderBefore([], undefined);
  });

  it('Data should order after attributes, slots, and records, and before strings, numbers, null, and undefined', function () {
    assert.orderAfter(base64(''), {'@a': 1});
    assert.orderAfter(base64(''), {a: 1});
    assert.orderAfter(base64(''), []);
    assert.orderBefore(base64(''), '');
    assert.orderBefore(base64(''), 0);
    assert.orderBefore(base64(''), null);
    assert.orderBefore(base64(''), undefined);
  });

  it('Strings should order after attributes, slots, records, and data, and before numbers, null, and undefined', function () {
    assert.orderAfter('', {'@a': 1});
    assert.orderAfter('', {a: 1});
    assert.orderAfter('', []);
    assert.orderAfter('', base64(''));
    assert.orderBefore('', 0);
    assert.orderBefore('', null);
    assert.orderBefore('', undefined);
  });

  it('Numbers should order after attributes, slots, records, data, and strings, and before null and undefined', function () {
    assert.orderAfter(0, {'@a': 1});
    assert.orderAfter(0, {a: 1});
    assert.orderAfter(0, []);
    assert.orderAfter(0, base64(''));
    assert.orderAfter(0, '');
    assert.orderBefore(0, null);
    assert.orderBefore(0, undefined);
  });

  it('Null should order after attributes, slots, records, data, strings, and numbers, and before undefined', function () {
    assert.orderAfter(null, {'@a': 1});
    assert.orderAfter(null, {a: 1});
    assert.orderAfter(null, []);
    assert.orderAfter(null, base64(''));
    assert.orderAfter(null, '');
    assert.orderAfter(null, 0);
    assert.orderBefore(null, undefined);
  });

  it('Undefined should order after attributes, slots, records, data, strings, numbers, and null', function () {
    assert.orderAfter(undefined, {'@a': 1});
    assert.orderAfter(undefined, {a: 1});
    assert.orderAfter(undefined, []);
    assert.orderAfter(undefined, base64(''));
    assert.orderAfter(undefined, '');
    assert.orderAfter(undefined, 0);
    assert.orderAfter(undefined, null);
  });
});


describe('RECON parser', function () {
  it('should parse empty input', function () {
    assert.same(parse(''), undefined);
  });

  it('should parse empty records', function () {
    assert.same(parse('{}'), []);
  });

  it('should parse empty markup', function () {
    assert.same(parse('[]'), []);
  });

  it('should parse empty strings', function () {
    assert.same(parse('""'), '');
  });

  it('should parse non-empty strings', function () {
    assert.same(parse('"test"'), 'test');
  });

  it('should parse strings with escapes', function () {
    assert.same(parse('"\\"\\\\\\/\\@\\{\\}\\[\\]\\b\\f\\n\\r\\t"'), '"\\/@{}[]\b\f\n\r\t');
  });

  it('should parse unicode identifiers', function () {
    assert.same(parse('À'), 'À'); // U+C0
    assert.same(parse('Ö'), 'Ö'); // U+D6
    assert.same(parse('Ø'), 'Ø'); // U+D8
    assert.same(parse('ö'), 'ö'); // U+F6
    assert.same(parse('ø'), 'ø'); // U+F8
    assert.same(parse('˿'), '˿'); // U+2FF
    assert.same(parse('Ͱ'), 'Ͱ'); // U+370
    assert.same(parse('ͽ'), 'ͽ'); // U+37D
    assert.same(parse('Ϳ'), 'Ϳ'); // U+37F
    assert.same(parse('῿'), '῿'); // U+1FFF
    assert.same(parse('⁰'), '⁰'); // U+2070
    assert.same(parse('↏'), '↏'); // U+218F
    assert.same(parse('Ⰰ'), 'Ⰰ'); // U+2C00
    assert.same(parse('⿯'), '⿯'); // U+2FEF
    assert.same(parse('、'), '、'); // U+3001
    assert.same(parse('퟿'), '퟿'); // U+D7FF
    assert.same(parse('豈'), '豈'); // U+F900
    assert.same(parse('﷏'), '﷏'); // U+FDCF
    assert.same(parse('ﷰ'), 'ﷰ'); // U+FDF0
    assert.same(parse('𐀀'), '𐀀'); // U+10000
    assert.same(parse('󯿿'), '󯿿'); // U+EFFFF

    assert.same(parse('_À'), '_À'); // U+C0
    assert.same(parse('_Ö'), '_Ö'); // U+D6
    assert.same(parse('_Ø'), '_Ø'); // U+D8
    assert.same(parse('_ö'), '_ö'); // U+F6
    assert.same(parse('_ø'), '_ø'); // U+F8
    assert.same(parse('_˿'), '_˿'); // U+2FF
    assert.same(parse('_Ͱ'), '_Ͱ'); // U+370
    assert.same(parse('_ͽ'), '_ͽ'); // U+37D
    assert.same(parse('_Ϳ'), '_Ϳ'); // U+37F
    assert.same(parse('_῿'), '_῿'); // U+1FFF
    assert.same(parse('_⁰'), '_⁰'); // U+2070
    assert.same(parse('_↏'), '_↏'); // U+218F
    assert.same(parse('_Ⰰ'), '_Ⰰ'); // U+2C00
    assert.same(parse('_⿯'), '_⿯'); // U+2FEF
    assert.same(parse('_、'), '_、'); // U+3001
    assert.same(parse('_퟿'), '_퟿'); // U+D7FF
    assert.same(parse('_豈'), '_豈'); // U+F900
    assert.same(parse('_﷏'), '_﷏'); // U+FDCF
    assert.same(parse('_ﷰ'), '_ﷰ'); // U+FDF0
    assert.same(parse('_𐀀'), '_𐀀'); // U+10000
    assert.same(parse('_󯿿'), '_󯿿'); // U+EFFFF
  });

  it('should parse empty data', function () {
    assert.same(parse('%'), base64());
  });

  it('should parse non-empty data', function () {
    assert.same(parse('%AAAA'), base64('AAAA'));
    assert.same(parse('%AAA='), base64('AAA='));
    assert.same(parse('%AA=='), base64('AA=='));
    assert.same(parse('%ABCDabcd12/+'), base64('ABCDabcd12/+'));
  });

  it('should parse positive integers', function () {
    assert.same(parse('0'), 0);
    assert.same(parse('1'), 1);
    assert.same(parse('5'), 5);
    assert.same(parse('10'), 10);
    assert.same(parse('11'), 11);
    assert.same(parse('15'), 15);
  });

  it('should parse negative integers', function () {
    assert.same(parse('-0'), -0);
    assert.same(parse('-1'), -1);
    assert.same(parse('-5'), -5);
    assert.same(parse('-10'), -10);
    assert.same(parse('-11'), -11);
    assert.same(parse('-15'), -15);
  });

  it('should parse positive decimals', function () {
    assert.same(parse('0.0'), 0.0);
    assert.same(parse('0.5'), 0.5);
    assert.same(parse('1.0'), 1.0);
    assert.same(parse('1.5'), 1.5);
    assert.same(parse('1.05'), 1.05);
    assert.same(parse('10.0'), 10.0);
    assert.same(parse('10.5'), 10.5);
  });

  it('should parse negative decimals', function () {
    assert.same(parse('-0.0'), -0.0);
    assert.same(parse('-0.5'), -0.5);
    assert.same(parse('-1.0'), -1.0);
    assert.same(parse('-1.5'), -1.5);
    assert.same(parse('-1.05'), -1.05);
    assert.same(parse('-10.0'), -10.0);
    assert.same(parse('-10.5'), -10.5);
  });

  it('should parse positive decimals with exponents', function () {
    assert.same(parse('4e2'), 4e2);
    assert.same(parse('4E2'), 4E2);
    assert.same(parse('4e+2'), 4e+2);
    assert.same(parse('4E+2'), 4E+2);
    assert.same(parse('4e-2'), 4e-2);
    assert.same(parse('4E-2'), 4E-2);
    assert.same(parse('4.0e2'), 4.0e2);
    assert.same(parse('4.0E2'), 4.0E2);
    assert.same(parse('4.0e+2'), 4.0e+2);
    assert.same(parse('4.0E+2'), 4.0E+2);
    assert.same(parse('4.0e-2'), 4.0e-2);
    assert.same(parse('4.0E-2'), 4.0E-2);
  });

  it('should parse negative decimals with exponents', function () {
    assert.same(parse('-4e2'), -4e2);
    assert.same(parse('-4E2'), -4E2);
    assert.same(parse('-4e+2'), -4e+2);
    assert.same(parse('-4E+2'), -4E+2);
    assert.same(parse('-4e-2'), -4e-2);
    assert.same(parse('-4E-2'), -4E-2);
    assert.same(parse('-4.0e2'), -4.0e2);
    assert.same(parse('-4.0E2'), -4.0E2);
    assert.same(parse('-4.0e+2'), -4.0e+2);
    assert.same(parse('-4.0E+2'), -4.0E+2);
    assert.same(parse('-4.0e-2'), -4.0e-2);
    assert.same(parse('-4.0E-2'), -4.0E-2);
    assert.same(parse('-4.0e02'), -4.0e2);
    assert.same(parse('-4.0E02'), -4.0E2);
    assert.same(parse('-4.0e+02'), -4.0e+2);
    assert.same(parse('-4.0E+02'), -4.0E+2);
    assert.same(parse('-4.0e-02'), -4.0e-2);
    assert.same(parse('-4.0E-02'), -4.0E-2);
  });

  it('should parse booleans', function () {
    assert.same(parse('true'), true);
    assert.same(parse('false'), false);
  });

  it('should parse single values with trailing commas', function () {
    assert.same(parse('1,'), 1);
  });

  it('should parse single values with trailing semicolons', function () {
    assert.same(parse('1;'), 1);
  });

  it('should parse multiple comma separated items', function () {
    assert.same(parse('  1, 2,3 ,4  '), [1, 2, 3, 4]);
    assert.same(parse('{ 1, 2,3 ,4 }'), [1, 2, 3, 4]);
  });

  it('should parse multiple semicolon separated items', function () {
    assert.same(parse('  1; 2;3 ;4  '), [1, 2, 3, 4]);
    assert.same(parse('{ 1; 2;3 ;4 }'), [1, 2, 3, 4]);
  });

  it('should parse multiple items with trailing commas', function () {
    assert.same(parse('  1, 2,3 ,4,  '), [1, 2, 3, 4]);
    assert.same(parse('{ 1, 2,3 ,4, }'), [1, 2, 3, 4]);
  });

  it('should parse multiple items with trailing semicolons', function () {
    assert.same(parse('  1, 2,3 ,4;  '), [1, 2, 3, 4]);
    assert.same(parse('{ 1, 2,3 ,4; }'), [1, 2, 3, 4]);
  });

  it('should parse multiple newline separated items', function () {
    assert.same(parse('  1\n 2\n3 \n4  '), [1, 2, 3, 4]);
    assert.same(parse('{ 1\n 2\n3 \n4 }'), [1, 2, 3, 4]);
  });

  it('should parse multiple items with mixed separators', function () {
    assert.same(parse('  1, 2\n3 \n4; 5  '), [1, 2, 3, 4, 5]);
    assert.same(parse('{ 1, 2\n3 \n4; 5 }'), [1, 2, 3, 4, 5]);
  });

  it('should parse multiple comma-newline separated items', function () {
    assert.same(parse('  1,\n 2,\n3 ,\n4  '), [1, 2, 3, 4]);
    assert.same(parse('{ 1,\n 2,\n3 ,\n4 }'), [1, 2, 3, 4]);
  });

  it('should parse multiple semicolon-newline separated items', function () {
    assert.same(parse('  1;\n 2;\n3 ;\n4  '), [1, 2, 3, 4]);
    assert.same(parse('{ 1;\n 2;\n3 ;\n4 }'), [1, 2, 3, 4]);
  });

  it('should parse heterogeneous top-level items as a record', function () {
    var string =
      '  record: {}  \n' +
      '  markup: []  \n' +
      '  ""          \n' +
      '  %AA==       \n' +
      '  integer: 0  \n' +
      '  decimal: 0.0\n' +
      '  true        \n' +
      '  false         ';
    var record = [
      {record: []},
      {markup: []},
      '',
      base64('AA=='),
      {integer: 0},
      {decimal: 0.0},
      true,
      false
    ];
    assert.same(parse(string), record);
  });

  it('should parse interpolate heterogeneous items in a record', function () {
    var string =
      '{             \n' +
      '  record: {}  \n' +
      '  markup: []  \n' +
      '  ""          \n' +
      '  %AA==       \n' +
      '  integer: 0  \n' +
      '  decimal: 0.0\n' +
      '  true        \n' +
      '  false         ' +
      '}               ';
    var record = [
      {record: []},
      {markup: []},
      '',
      base64('AA=='),
      {integer: 0},
      {decimal: 0.0},
      true,
      false
    ];
    assert.same(parse(string), record);
  });

  it('should parse single extant attributes with no parameters', function () {
    assert.same(parse('@test'), [{'@test': null}]);
  });

  it('should parse single extant attributes with empty parameters', function () {
    assert.same(parse('@test()'), [{'@test': null}]);
  });

  it('should parse single extant attributes with single parameters', function () {
    assert.same(parse('@hello({})'), [{'@hello': []}]);
    assert.same(parse('@hello([world])'), [{'@hello': ['world']}]);
    assert.same(parse('@hello("world")'), [{'@hello': 'world'}]);
    assert.same(parse('@hello(42)'), [{'@hello': 42}]);
    assert.same(parse('@hello(true)'), [{'@hello': true}]);
    assert.same(parse('@hello(false)'), [{'@hello': false}]);
  });

  it('should parse single extant attributes with multiple parameters', function () {
    var record = [{'@hello': ['world', base64('AA=='), 42, true]}];
    assert.same(parse('@hello("world", %AA==, 42, true)'), record);
    assert.same(parse('@hello("world"; %AA==; 42; true)'), record);
    assert.same(parse('@hello("world"\n%AA==\n42\ntrue)'), record);
  });

  it('should parse single extant attributes with named parameters', function () {
    assert.same(parse('@hello(name: "world")'), [{'@hello': [{name: 'world'}]}]);
    assert.same(parse('@hello(name: "world", data: %AA==, number: 42, false)'),
      [{'@hello': [{name: 'world'}, {data: base64('AA==')}, {number: 42}, false]}]);
  });

  it('should parse multiple extant attributes with no parameters', function () {
    assert.same(parse('@a @b'), [{'@a': null}, {'@b': null}]);
  });

  it('should parse multiple extant attributes with empty parameters', function () {
    assert.same(parse('@a() @b()'), [{'@a': null}, {'@b': null}]);
  });

  it('should parse multiple extant attributes with single parameters', function () {
    assert.same(parse('@a({}) @b([])'), [{'@a': []}, {'@b': []}]);
    assert.same(parse('@a("test") @b(42)'), [{'@a': 'test'}, {'@b': 42}]);
    assert.same(parse('@a(true) @b(false)'), [{'@a': true}, {'@b': false}]);
  });

  it('should parse multiple extant attributes with complex parameters', function () {
    assert.same(parse('@hello("world", 42) @test(name: "parse", pending: false)'),
      [{'@hello': ['world', 42]}, {'@test': [{name: 'parse'}, {pending: false}]}]);
  });

  it('should parse prefix attributed empty records', function () {
    assert.same(parse('@hello {}'), [{'@hello': null}]);
    assert.same(parse('@hello() {}'), [{'@hello': null}]);
    assert.same(parse('@hello("world") {}'), [{'@hello': 'world'}]);
    assert.same(parse('@hello(name: "world") {}'), [{'@hello': [{name: 'world'}]}]);
  });

  it('should parse prefix attributed non-empty records', function () {
    assert.same(parse('@hello { {}, [] }'), [{'@hello': null}, [], []]);
    assert.same(parse('@hello() { "world", 42 }'), [{'@hello': null}, 'world', 42]);
    assert.same(parse('@hello(name: "world") { number: 42, true }'),
      [{'@hello': [{name: 'world'}]}, {number: 42}, true]);
  });

  it('should parse prefix attributed empty markup', function () {
    assert.same(parse('@hello []'), [{'@hello': null}]);
    assert.same(parse('@hello() []'), [{'@hello': null}]);
    assert.same(parse('@hello("world") []'), [{'@hello': 'world'}]);
    assert.same(parse('@hello(name: "world") []'), [{'@hello': [{name: 'world'}]}]);
  });

  it('should parse prefix attributed empty strings', function () {
    assert.same(parse('@hello ""'), [{'@hello': null}, '']);
    assert.same(parse('@hello() ""'), [{'@hello': null}, '']);
    assert.same(parse('@hello("world") ""'), [{'@hello': 'world'}, '']);
    assert.same(parse('@hello(name: "world") ""'), [{'@hello': [{name: 'world'}]}, '']);
  });

  it('should parse prefix attributed non-empty strings', function () {
    assert.same(parse('@hello "test"'), [{'@hello': null}, 'test']);
    assert.same(parse('@hello() "test"'), [{'@hello': null}, 'test']);
    assert.same(parse('@hello("world") "test"'), [{'@hello': 'world'}, 'test']);
    assert.same(parse('@hello(name: "world") "test"'), [{'@hello': [{name: 'world'}]}, 'test']);
  });

  it('should parse prefix attributed empty data', function () {
    assert.same(parse('@hello %'), [{'@hello': null}, base64()]);
    assert.same(parse('@hello() %'), [{'@hello': null}, base64()]);
    assert.same(parse('@hello("world") %'), [{'@hello': 'world'}, base64()]);
    assert.same(parse('@hello(name: "world") %'), [{'@hello': [{name: 'world'}]}, base64()]);
  });

  it('should parse prefix attributed non-empty data', function () {
    assert.same(parse('@hello %AA=='), [{'@hello': null}, base64('AA==')]);
    assert.same(parse('@hello() %AAA='), [{'@hello': null}, base64('AAA=')]);
    assert.same(parse('@hello("world") %AAAA'), [{'@hello': 'world'}, base64('AAAA')]);
    assert.same(parse('@hello(name: "world") %ABCDabcd12+/'),
      [{'@hello': [{name: 'world'}]}, base64('ABCDabcd12+/')]);
  });

  it('should parse prefix attributed numbers', function () {
    assert.same(parse('@hello 42'), [{'@hello': null}, 42]);
    assert.same(parse('@hello() -42'), [{'@hello': null}, -42]);
    assert.same(parse('@hello("world") 42.0'), [{'@hello': 'world'}, 42.0]);
    assert.same(parse('@hello(name: "world") -42.0'), [{'@hello': [{name: 'world'}]}, -42.0]);
  });

  it('should parse prefix attributed booleans', function () {
    assert.same(parse('@hello true'), [{'@hello': null}, true]);
    assert.same(parse('@hello() false'), [{'@hello': null}, false]);
    assert.same(parse('@hello("world") true'), [{'@hello': 'world'}, true]);
    assert.same(parse('@hello(name: "world") false'), [{'@hello': [{name: 'world'}]}, false]);
  });

  it('should parse postfix attributed empty records', function () {
    assert.same(parse('{} @signed'), [{'@signed': null}]);
    assert.same(parse('{} @signed()'), [{'@signed': null}]);
    assert.same(parse('{} @signed("me")'), [{'@signed': 'me'}]);
    assert.same(parse('{} @signed(by: "me")'), [{'@signed': [{by: 'me'}]}]);
  });

  it('should parse postfix attributed non-empty records', function () {
    assert.same(parse('{ {}, [] } @signed'), [[], [], {'@signed': null}]);
    assert.same(parse('{ "world", 42 } @signed()'), ['world', 42, {'@signed': null}]);
    assert.same(parse('{ number: 42, true } @signed(by: "me")'),
      [{number: 42}, true, {'@signed': [{by: 'me'}]}]);
  });

  it('should parse postfix attributed empty markup', function () {
    assert.same(parse('[] @signed'), [{'@signed': null}]);
    assert.same(parse('[] @signed()'), [{'@signed': null}]);
    assert.same(parse('[] @signed("me")'), [{'@signed': 'me'}]);
    assert.same(parse('[] @signed(by: "me")'), [{'@signed': [{by: 'me'}]}]);
  });

  it('should parse postfix attributed empty strings', function () {
    assert.same(parse('"" @signed'), ['', {'@signed': null}]);
    assert.same(parse('"" @signed()'), ['', {'@signed': null}]);
    assert.same(parse('"" @signed("me")'), ['', {'@signed': 'me'}]);
    assert.same(parse('"" @signed(by: "me")'), ['', {'@signed': [{by: 'me'}]}]);
  });

  it('should parse postfix attributed non-empty strings', function () {
    assert.same(parse('"test" @signed'), ['test', {'@signed': null}]);
    assert.same(parse('"test" @signed()'), ['test', {'@signed': null}]);
    assert.same(parse('"test" @signed("me")'), ['test', {'@signed': 'me'}]);
    assert.same(parse('"test" @signed(by: "me")'), ['test', {'@signed': [{by: 'me'}]}]);
  });

  it('should parse postfix attributed empty data', function () {
    assert.same(parse('% @signed'), [base64(), {'@signed': null}]);
    assert.same(parse('% @signed()'), [base64(), {'@signed': null}]);
    assert.same(parse('% @signed("me")'), [base64(), {'@signed': 'me'}]);
    assert.same(parse('% @signed(by: "me")'), [base64(), {'@signed': [{by: 'me'}]}]);
  });

  it('should parse postfix attributed non-empty data', function () {
    assert.same(parse('%AA== @signed'), [base64('AA=='), {'@signed': null}]);
    assert.same(parse('%AAA= @signed()'), [base64('AAA='), {'@signed': null}]);
    assert.same(parse('%AAAA @signed("me")'), [base64('AAAA'), {'@signed': 'me'}]);
    assert.same(parse('%ABCDabcd12+/ @signed(by: "me")'),
      [base64('ABCDabcd12+/'), {'@signed': [{by: 'me'}]}]);
  });

  it('should parse postfix attributed numbers', function () {
    assert.same(parse('42 @signed'), [42, {'@signed': null}]);
    assert.same(parse('-42 @signed()'), [-42, {'@signed': null}]);
    assert.same(parse('42.0 @signed("me")'), [42.0, {'@signed': 'me'}]);
    assert.same(parse('-42.0 @signed(by: "me")'), [-42.0, {'@signed': [{by: 'me'}]}]);
  });

  it('should parse postfix attributed booleans', function () {
    assert.same(parse('true @signed'), [true, {'@signed': null}]);
    assert.same(parse('false @signed()'), [false, {'@signed': null}]);
    assert.same(parse('true @signed("me")'), [true, {'@signed': 'me'}]);
    assert.same(parse('false @signed(by: "me")'), [false, {'@signed': [{by: 'me'}]}]);
  });

  it('should parse infix attributed empty records', function () {
    assert.same(parse('{}@hello{}'), [{'@hello': null}]);
    assert.same(parse('{}@hello(){}'), [{'@hello': null}]);
    assert.same(parse('{}@hello("world"){}'), [{'@hello': 'world'}]);
    assert.same(parse('{}@hello(name:"world"){}'), [{'@hello': [{name: 'world'}]}]);
  });

  it('should parse infix attributed non-empty records', function () {
    assert.same(parse('{{}}@hello{[]}'), [[], {'@hello': null}, []]);
    assert.same(parse('{42}@hello(){"world"}'), [42, {'@hello': null}, 'world']);
    assert.same(parse('{number:42}@hello(name:"world"){true}'),
      [{number: 42}, {'@hello': [{name: 'world'}]}, true]);
  });

  it('should parse infix attributed empty markup"', function () {
    assert.same(parse('[]@hello[]'), [{'@hello': null}]);
    assert.same(parse('[]@hello()[]'), [{'@hello': null}]);
    assert.same(parse('[]@hello("world")[]'), [{'@hello': 'world'}]);
    assert.same(parse('[]@hello(name: "world")[]'), [{'@hello': [{name: 'world'}]}]);
  });

  it('should parse infix attributed non-empty markup', function () {
    assert.same(parse(' [a]@hello[test] '), ['a', {'@hello': null}, 'test']);
    assert.same(parse(' [a]@hello()[test] '), ['a', {'@hello': null}, 'test']);
    assert.same(parse(' [a]@hello("world")[test] '), ['a', {'@hello': 'world'}, 'test']);
    assert.same(parse(' [a]@hello(name:"world")[test] '),
      ['a', {'@hello': [{name: 'world'}]}, 'test']);
  });

  it('should parse infix attributed empty strings', function () {
    assert.same(parse(' ""@hello"" '), ['', {'@hello': null}, '']);
    assert.same(parse(' ""@hello()"" '), ['', {'@hello': null}, '']);
    assert.same(parse(' ""@hello("world")"" '), ['', {'@hello': 'world'},'']);
    assert.same(parse(' ""@hello(name:"world")"" '),
      ['', {'@hello': [{name: 'world'}]}, '']);
  });

  it('should parse infix attributed non-empty strings', function () {
    assert.same(parse(' "a"@hello"test" '), ['a', {'@hello': null}, 'test']);
    assert.same(parse(' "a"@hello()"test" '), ['a', {'@hello': null}, 'test']);
    assert.same(parse(' "a"@hello("world")"test" '), ['a', {'@hello': 'world'}, 'test']);
    assert.same(parse(' "a"@hello(name:"world")"test" '),
      ['a', {'@hello': [{name: 'world'}]}, 'test']);
  });

  it('should parse infix attributed empty data', function () {
    assert.same(parse('%@hello%'), [base64(), {'@hello': null}, base64()]);
    assert.same(parse('%@hello()%'), [base64(), {'@hello': null}, base64()]);
    assert.same(parse('%@hello("world")%'), [base64(), {'@hello': 'world'}, base64()]);
    assert.same(parse('%@hello(name:"world")%'),
      [base64(), {'@hello': [{name: 'world'}]}, base64()]);
  });

  it('should parse infix attributed non-empty data', function () {
    assert.same(parse('%AA==@hello%BB=='), [base64('AA=='), {'@hello': null}, base64('BB==')]);
    assert.same(parse('%AAA=@hello()%BBB='), [base64('AAA='), {'@hello': null}, base64('BBB=')]);
    assert.same(parse('%AAAA@hello("world")%BBBB'),
      [base64('AAAA'), {'@hello': 'world'}, base64('BBBB')]);
    assert.same(parse('%ABCDabcd12+/@hello(name:"world")%/+21dcbaDCBA'),
      [base64('ABCDabcd12+/'), {'@hello': [{name: 'world'}]}, base64('/+21dcbaDCBA')]);
  });

  it('should parse infix attributed numbers', function () {
    assert.same(parse('2@hello 42'), [2, {'@hello': null}, 42]);
    assert.same(parse('-2@hello()-42'), [-2, {'@hello': null}, -42]);
    assert.same(parse('2.00@hello("world")42.0'), [2.0, {'@hello': 'world'}, 42.0]);
    assert.same(parse('-2.0@hello(name:"world")-42.0'), [-2.0, {'@hello': [{name: 'world'}]}, -42.0]);
  });

  it('should parse infix attributed booleans', function () {
    assert.same(parse('true@hello true'), [true, {'@hello': null}, true]);
    assert.same(parse('false@hello()false'), [false, {'@hello': null}, false]);
    assert.same(parse('true@hello("world")true'), [true, {'@hello': 'world'}, true]);
    assert.same(parse('false@hello(name:"world")false'), [false, {'@hello': [{name: 'world'}]}, false]);
  });

  it('should parse plain markup', function () {
    assert.same(parse('[test]'), ['test']);
  });

  it('should parse plain markup with escapes', function () {
    assert.same(parse('[\\"\\\\\\/\\@\\{\\}\\[\\]\\b\\f\\n\\r\\t]'), ['"\\/@{}[]\b\f\n\r\t']);
  });

  it('should parse markup with embedded markup', function () {
    assert.same(parse('[Hello, [good] world!]'), ['Hello, ', 'good', ' world!']);
  });

  it('should parse markup with embedded structure', function () {
    assert.same(parse('[Hello{}world]'), ['Hello', 'world']);
    assert.same(parse('[A: {"answer"}.]'), ['A: ', 'answer', '.']);
    assert.same(parse('[A: {%AA==}.]'), ['A: ', base64('AA=='), '.']);
    assert.same(parse('[A: {42}.]'), ['A: ', 42, '.']);
    assert.same(parse('[A: {true}.]'), ['A: ', true, '.']);
    assert.same(parse('[A: {false}.]'), ['A: ', false, '.']);
    assert.same(parse('[A: {answer:0.0}.]'), ['A: ', {answer: 0.0}, '.']);
    assert.same(parse('[{1, 2, 3}]'), [1, 2, 3]);
    assert.same(parse('[{{1, 2, 3}}.]'), [[1, 2, 3], '.']);
  });

  it('should parse markup with embedded single extant attributes', function () {
    assert.same(parse('[A: @answer.]'), ['A: ', [{'@answer': null}], '.']);
    assert.same(parse('[A: @answer().]'), ['A: ', [{'@answer': null}], '.']);
    assert.same(parse('[A: @answer("secret").]'), ['A: ', [{'@answer': 'secret'}], '.']);
    assert.same(parse('[A: @answer(number: 42, true).]'),
      ['A: ', [{'@answer': [{number: 42}, true]}], '.']);
    assert.same(parse('[@numbers{1, 2, 3}.]'), [[{'@numbers': null}, 1, 2, 3], '.']);
    assert.same(parse('[@numbers{{1, 2, 3}}.]'), [[{'@numbers': null}, [1, 2, 3]], '.']);
  });

  it('should parse markup with embedded sequential extant attributes', function () {
    assert.same(parse('[A: @good @answer.]'),
      ['A: ', [{'@good': null}], ' ', [{'@answer': null}], '.']);
    assert.same(parse('[A: @good@answer.]'),
      ['A: ', [{'@good': null}], [{'@answer': null}], '.']);
    assert.same(parse('[A: @good() @answer().]'),
      ['A: ', [{'@good': null}], ' ', [{'@answer': null}], '.']);
    assert.same(parse('[A: @good()@answer().]'),
      ['A: ', [{'@good': null}], [{'@answer': null}], '.']);
  });

  it('should parse markup with embedded attributed markup', function () {
    assert.same(parse('[Hello, @em[world]!]'), ['Hello, ', [{'@em': null}, 'world'], '!']);
    assert.same(parse('[Hello, @em()[world]!]'), ['Hello, ', [{'@em': null}, 'world'], '!']);
    assert.same(parse('[Hello, @em("italic")[world]!]'), ['Hello, ', [{'@em': 'italic'}, 'world'], '!']);
    assert.same(parse('[Hello, @em(class:"subject",style:"italic")[world]!]'),
      ['Hello, ', [{'@em': [{class: 'subject'}, {style: 'italic'}]}, 'world'], '!']);
  });

  it('should parse markup with embedded attributed values', function () {
    assert.same(parse('[A: @answer{42}.]'), ['A: ', [{'@answer': null}, 42], '.']);
    assert.same(parse('[A: @answer(){42}.]'), ['A: ', [{'@answer': null}, 42], '.']);
    assert.same(parse('[A: @answer("secret"){42}.]'), ['A: ', [{'@answer': 'secret'}, 42], '.']);
    assert.same(parse('[A: @answer(number: 42, "secret"){true}.]'),
      ['A: ', [{'@answer': [{number: 42}, 'secret']}, true], '.']);
  });
});


describe('RECON serializer', function () {
  it('should stringify undefined values', function () {
    assert.equal(stringify(undefined), '');
  });

  it('should stringify empty records', function () {
    assert.equal(stringify([]), '{}');
  });

  it('should stringify unary records', function () {
    assert.equal(stringify([1], {block: false}), '{1}');
  });

  it('should stringify non-empty records', function () {
    assert.equal(stringify([1, 2, '3', true]), '1,2,"3",true');
  });

  it('should stringify empty strings', function () {
    assert.equal(stringify(''), '""');
  });

  it('should stringify non-empty strings', function () {
    assert.equal(stringify('Hello, world!'), '"Hello, world!"');
  });

  it('should stringify strings with escapes', function () {
    assert.equal(stringify('"\\\b\f\n\r\t'), '"\\"\\\\\\b\\f\\n\\r\\t"');
  });

  it('should stringify identifiers', function () {
    assert.equal(stringify('test'), 'test');
  });

  it('should stringify empty data', function () {
    assert.equal(stringify(base64()), '%');
  });

  it('should stringify non-empty data', function () {
    assert.equal(stringify(base64('AAAA')), '%AAAA');
    assert.equal(stringify(base64('AAA=')), '%AAA=');
    assert.equal(stringify(base64('AA==')), '%AA==');
    assert.equal(stringify(base64('ABCDabcd12/+')), '%ABCDabcd12/+');
  });

  it('should stringify data values within records', function () {
    assert.equal(stringify([base64('AAAA')]), '%AAAA');
  });

  it('should stringify numbers', function () {
    assert.equal(stringify(0), '0');
    assert.equal(stringify(1), '1');
    assert.equal(stringify(-1), '-1');
    assert.equal(stringify(15), '15');
    assert.equal(stringify(-20), '-20');
    assert.equal(stringify(3.14), '3.14');
    assert.equal(stringify(-0.5), '-0.5');
    assert.equal(stringify(6.02E23), '6.02e+23');
  });

  it('should stringify booleans', function () {
    assert.equal(stringify(true), 'true');
    assert.equal(stringify(false), 'false');
  });

  it('should stringify extant attributes with no parameters', function () {
    assert.equal(stringify([{'@answer': null}]), '@answer');
  });

  it('should stringify extant attributes with single parameters', function () {
    assert.equal(stringify({'@answer': []}), '@answer({})');
    assert.equal(stringify({'@answer': '42'}), '@answer("42")');
    assert.equal(stringify({'@answer': 42}), '@answer(42)');
    assert.equal(stringify({'@answer': true}), '@answer(true)');
  });

  it('should stringify extant attributes with multiple parameters', function () {
    assert.equal(stringify({'@answer': [42, true]}), '@answer(42,true)');
  });

  it('should stringify extant attributes with named parameters', function () {
    assert.equal(stringify({'@answer': {number: 42}}), '@answer(number:42)');
  });

  it('should stringify records with ident keyed slots', function () {
    assert.equal(stringify({a: 1}), 'a:1');
    assert.equal(stringify([{a: 1}, false, {c: 3}]), 'a:1,false,c:3');
    assert.equal(stringify({a: 1}, {block: false}), '{a:1}');
    assert.equal(stringify([{a: 1}, false, {c: 3}], {block: false}), '{a:1,false,c:3}');
  });

  it('should stringify records with value keyed slots', function () {
    assert.equal(
      stringify([{$key: 1, $value: 'one'}, {$key: [{'@id': null}, 'foo'], $value: 'bar'}]),
      '1:one,@id foo:bar');
    assert.equal(
      stringify([{$key: 1, $value: 'one'}, {$key: [{'@id': null}, 'foo'], $value: 'bar'}], {block: false}),
      '{1:one,@id foo:bar}');
  });

  it('should stringify records with extant slots', function () {
    assert.equal(stringify({blank: null}), 'blank:');
  });

  it('should stringify prefix attributed empty records', function () {
    assert.equal(stringify([{'@hello': null}, []]), '@hello{{}}');
  });

  it('should stringify prefix attributed empty text', function () {
    assert.equal(stringify([{'@hello': null}, '']), '@hello""');
  });

  it('should stringify prefix attributed non-empty text', function () {
    assert.equal(stringify([{'@hello': null}, 'world!']), '@hello"world!"');
  });

  it('should stringify prefix attributed numbers', function () {
    assert.equal(stringify([{'@answer': null}, 42]), '@answer 42');
  });

  it('should stringify prefix attributed booleans', function () {
    assert.equal(stringify([{'@answer': null}, true]), '@answer true');
  });

  it('should stringify prefix attributed slots', function () {
    assert.equal(stringify([{'@hello': null}, {subject: 'world!'}]), '@hello{subject:\"world!\"}');
  });

  it('should stringify postfix attributed empty records', function () {
    assert.equal(stringify([[], {'@signed': null}]), '{{}}@signed');
  });

  it('should stringify postfix attributed empty text', function () {
    assert.equal(stringify(['', {'@signed': null}]), '""@signed');
  });

  it('should stringify postfix attributed non-empty text', function () {
    assert.equal(stringify(['world!', {'@signed': null}]), '"world!"@signed');
  });

  it('should stringify postfix attributed numbers', function () {
    assert.equal(stringify([42, {'@signed': null}]), '42@signed');
  });

  it('should stringify postfix attributed booleans', function () {
    assert.equal(stringify([true, {'@signed': null}]), 'true@signed');
  });

  it('should stringify postfix attributed slots', function () {
    assert.equal(stringify([{subject: 'world!'}, {'@signed': null}]), '{subject:\"world!\"}@signed');
  });

  it('should stringify single values with multiple postfix attributes', function () {
    assert.equal(stringify([6, {'@months': null}, {'@remaining': null}]), '6@months@remaining');
  });

  it('should stringify single values with circumfix attributes', function () {
    assert.equal(
      stringify([{'@a': null}, {'@b': null}, false, {'@x': null}, {'@y': null}]),
      '@a@b false@x@y');
  });

  it('should stringify single values with interspersed attributes', function () {
    assert.equal(stringify([{'@a': null}, 1, {'@b': null}, 2]), '@a 1@b 2');
  });

  it('should stringify single values with interspersed attribute groups', function () {
    assert.equal(
      stringify([{'@a': null}, {'@b': null}, 1, {'@c': null}, {'@d': null}, 2]),
      '@a@b 1@c@d 2');
  });

  it('should stringify multiple items with multiple postfix attributes', function () {
    assert.equal(stringify([1, 2, {'@x': null}, {'@y': null}]), '{1,2}@x@y');
  });

  it('should stringify multiple items with circumfix attributes', function () {
    assert.equal(
      stringify([{'@a': null}, {'@b': null}, 1, 2, {'@x': null}, {'@y': null}]),
      '@a@b{1,2}@x@y');
  });

  it('should stringify multiple items with interspersed attributes', function () {
    assert.equal(stringify([{'@a': null}, 1, 2, {'@b': null}, 3, 4]), '@a{1,2}@b{3,4}');
  });

  it('should stringify multiple items with interspersed attribute groups', function () {
    assert.equal(
      stringify([{'@a': null}, {'@b': null}, 1, 2, {'@c': null}, {'@d': null}, 3, 4]),
      '@a@b{1,2}@c@d{3,4}');
  });

  it('should stringify markup', function () {
    assert.equal(
      stringify(['Hello, ', [{'@em': null}, 'world'], '!']),
      '[Hello, @em[world]!]');
    assert.equal(
      stringify(['Hello, ', [{'@em': {class: 'subject'}}, 'world'], '!']),
      '[Hello, @em(class:subject)[world]!]');
    assert.equal(
      stringify(['A: ', [{'@answer': null}, 42], '.']),
      '[A: @answer{42}.]');
    assert.equal(
      stringify(['A: ', [{'@answer': null}, {number: 42}, true], '.']),
      '[A: @answer{number:42,true}.]');
  });

  it('should stringify markup with escapes', function () {
    assert.equal(
      stringify(['Escape: ', [{'@br': null}], ' \\@{}[]']),
      '[Escape: @br \\\\\\@\\{\\}\\[\\]]');
    assert.equal(
      stringify(['Escape: ', [{'@span': null}, '\\@{}[]'], '!']),
      '[Escape: @span[\\\\\\@\\{\\}\\[\\]]!]');
  });

  it('should stringify nested markup', function () {
    assert.equal(
      stringify(['X ', [{'@p': null}, 'Y ', [{'@q': null}, 'Z'], '.'], '.']),
      '[X @p[Y @q[Z].].]');
  });

  it('should stringify nested markup with non-prefix attributes', function () {
    assert.equal(
      stringify(['X ', [{'@p': null}, 'Y.', {'@q': null}], '.']),
      '[X {@p"Y."@q}.]');
  });

  it('should stringify markup in attribute parameters', function () {
    assert.equal(
      stringify({'@msg': ['Hello, ', [{'@em': null}, 'world'], '!']}),
      '@msg([Hello, @em[world]!])');
  });

  it('should stringify markup-embedded values', function () {
    assert.equal(stringify(['Hello, ', 6, '!']), '[Hello, {6}!]');
    assert.equal(stringify(['Hello, ', 6, 7, '!']), '[Hello, {6,7}!]');
    assert.equal(
      stringify([{'@greeting': null}, 'Hello, ', [{'@em': null}, 'world'], '!']),
      '@greeting[Hello, @em[world]!]');
  });

  it('should stringify markup-embedded values with subsequent attributes', function () {
    assert.equal(
      stringify(['Wait ', 1, {'@second': null}, ' longer', [{'@please': null}]]),
      '[Wait {1}]@second[ longer@please]');
    assert.equal(
      stringify(['Wait ', 1, 2, {'@second': null}, ' longer', [{'@please': null}]]),
      '[Wait {1,2}]@second[ longer@please]');
  });

  it('should stringify markup-embedded records', function () {
    assert.equal(stringify(['Hello, ', [], '!']), '[Hello, {{}}!]');
    assert.equal(stringify(['Hello, ', [1], '!']), '[Hello, {{1}}!]');
    assert.equal(stringify(['Hello, ', [1, 2], '!']), '[Hello, {{1,2}}!]');
  });

  it('should stringify markup-embedded attributed values', function () {
    assert.equal(stringify(['Hello, ', [{'@number': null}, 6], '!']), '[Hello, @number{6}!]');
  });

  it('should stringify markup-embedded attributed records', function () {
    assert.equal(
      stringify(['Hello, ', [{'@choice': null}, 'Earth', 'Mars'], '!']),
      '[Hello, @choice{Earth,Mars}!]');
  });

  it('should stringify markup-embedded records with non-prefix attributes', function () {
    assert.equal(stringify(['Hello, ', [1, {'@second': null}], '!']), '[Hello, {1@second}!]');
  });

  it('should stringify naked attributes', function () {
    assert.equal(stringify({'@answer': 42}), '@answer(42)');
  });

  it('should stringify naked slots', function () {
    assert.equal(stringify({answer: 42}), 'answer:42');
  });
});


describe('URI parser', function () {
  it('should parse empty URIs', function () {
    assert.same(uri.parse(''), {});
  });

  it('should parse URIs with schemes', function () {
    assert.same(uri.parse('scheme:'), {scheme: 'scheme'});
    assert.same(uri.parse('AZaz09+-.:'), {scheme: 'azaz09+-.'});
  });

  it('should parse URIs with empty authorities', function () {
    assert.same(uri.parse('//'), {});
  });

  it('should parse URIs with host names', function () {
    assert.same(uri.parse('//domain'), {authority: {host: 'domain'}});
  });

  it('should parse URIs with IPv4 addresses', function () {
    assert.same(uri.parse('//127.0.0.1'), {authority: {ipv4: '127.0.0.1'}});
  });

  it('should parse URIs with IPv6 addresses', function () {
    assert.same(uri.parse('//[::1]'), {authority: {ipv6: '::1'}});
  });

  it('should parse URIs with host names and ports', function () {
    assert.same(uri.parse('//domain:80'), {authority: {host: 'domain', port: 80}});
  });

  it('should parse URIs with IPv4 addresses and ports', function () {
    assert.same(uri.parse('//127.0.0.1:80'), {authority: {ipv4: '127.0.0.1', port: 80}});
  });

  it('should parse URIs with IPv6 addresses and ports', function () {
    assert.same(uri.parse('//[::1]:80'), {authority: {ipv6: '::1', port: 80}});
  });

  it('should parse URIs with ports but no host info', function () {
    assert.same(uri.parse('//:80'), {authority: {host: '', port: 80}});
  });

  it('should parse URIs with empty ports', function () {
    assert.same(uri.parse('//:'), {authority: {host: '', port: 0}});
  });

  it('should parse URIs with empty user info', function () {
    assert.same(uri.parse('//@'), {authority: {userInfo: ''}});
  });

  it('should parse URIs with empty user info and ports', function () {
    assert.same(uri.parse('//@:'), {authority: {host: '', port: 0, userInfo: ''}});
  });

  it('should parse URIs with user info but no host info', function () {
    assert.same(uri.parse('//user@'), {authority: {userInfo: 'user'}});
  });

  it('should parse URIs with username and password info but no host info', function () {
    assert.same(uri.parse('//user:pass@'), {authority: {username: 'user', password: 'pass'}});
  });

  it('should parse URIs with user info and host names', function () {
    assert.same(
      uri.parse('//user@domain'),
      {authority: {host: 'domain', userInfo: 'user'}});
  });

  it('should parse URIs with username and password info and host names', function () {
    assert.same(
      uri.parse('//user:pass@domain'),
      {authority: {host: 'domain', username: 'user', password: 'pass'}});
  });

  it('should parse URIs with user info and IPv4 addresses', function () {
    assert.same(
      uri.parse('//user@127.0.0.1'),
      {authority: {ipv4: '127.0.0.1', userInfo: 'user'}});
  });

  it('should parse URIs with username and password info and IPv4 addresses', function () {
    assert.same(
      uri.parse('//user:pass@127.0.0.1'),
      {authority: {ipv4: '127.0.0.1', username: 'user', password: 'pass'}});
  });

  it('should parse URIs with user info and IPv6 addresses', function () {
    assert.same(
      uri.parse('//user@[::1]'),
      {authority: {ipv6: '::1', userInfo: 'user'}});
  });

  it('should parse URIs with username and password info and IPv6 addresses', function () {
    assert.same(
      uri.parse('//user:pass@[::1]'),
      {authority: {ipv6: '::1', username: 'user', password: 'pass'}});
  });

  it('should parse URIs with user info, host names, and ports', function () {
    assert.same(
      uri.parse('//user@domain:80'),
      {authority: {host: 'domain', port: 80, userInfo: 'user'}});
  });

  it('should parse URIs with user info, IPv4 addresses, and ports', function () {
    assert.same(
      uri.parse('//user@127.0.0.1:80'),
      {authority: {ipv4: '127.0.0.1', port: 80, userInfo: 'user'}});
  });

  it('should parse URIs with user info, IPv6 addresses, and ports', function () {
    assert.same(
      uri.parse('//user@[::1]:80'),
      {authority: {ipv6: '::1', port: 80, userInfo: 'user'}});
  });

  it('should parse URIs with absolute paths', function () {
    assert.same(uri.parse('/'), {path: ['/']});
    assert.same(uri.parse('/one'), {path: ['/', 'one']});
    assert.same(uri.parse('/one/'), {path: ['/', 'one', '/']});
    assert.same(uri.parse('/one/two'), {path: ['/', 'one', '/', 'two']});
    assert.same(uri.parse('/one/two/'), {path: ['/', 'one', '/', 'two', '/']});
  });

  it('should parse URIs with relative paths', function () {
    assert.same(uri.parse('one'), {path: ['one']});
    assert.same(uri.parse('one/'), {path: ['one', '/']});
    assert.same(uri.parse('one/two'), {path: ['one', '/', 'two']});
    assert.same(uri.parse('one/two/'), {path: ['one', '/', 'two', '/']});
  });

  it('should parse URIs with paths containing permitted deliminters', function () {
    assert.same(
      uri.parse('/one/!$&()*+,;=\'/three'),
      {path: ['/', 'one', '/', '!$&()*+,;=\'', '/', 'three']});
  });

  it('should parse URIs with paths beginning with percent escapes', function () {
    assert.same(uri.parse('%20'), {path: [' ']});
  });

  it('should parse URIs with empty queries', function () {
    assert.same(uri.parse('?'), {query: ''});
  });

  it('should parse URIs with query parts', function () {
    assert.same(uri.parse('?query'), {query: 'query'});
  });

  it('should parse URIs with query params', function () {
    assert.same(uri.parse('?key=value'), {query: [{key: 'value'}]});
    assert.same(uri.parse('?k1=v1&k2=v2'), {query: [{k1: 'v1'}, {k2: 'v2'}]});
    assert.same(uri.parse('?k1=v=1'), {query: [{k1: 'v=1'}]});
    assert.same(uri.parse('?k1='), {query: [{k1: ''}]});
    assert.same(uri.parse('?=v1'), {query: [{'': 'v1'}]});
    assert.same(uri.parse('?='), {query: [{'': ''}]});
    assert.same(uri.parse('?a&b'), {query: ['a', 'b']});
  });

  it('should parse URIs with queries containing permitted delimiters', function () {
    assert.same(uri.parse('?!$()*+,/:;?@\''), {query: '!$()*+,/:;?@\''});
  });

  it('should parse URIs with empty fragments', function () {
    assert.same(uri.parse('#'), {fragment: ''});
  });

  it('should parse URIs with fragments', function () {
    assert.same(uri.parse('#fragment'), {fragment: 'fragment'});
  });

  it('should parse URIs with fragments containing permitted delimiters', function () {
    assert.same(uri.parse('#!$&()*+,/:;?@=\''), {fragment: '!$&()*+,/:;?@=\''});
  });

  it('should parse URIs with schemes and authorities', function () {
    assert.same(
      uri.parse('scheme://domain'),
      {scheme: 'scheme', authority: {host: 'domain'}});
    assert.same(
      uri.parse('scheme://domain:80'),
      {scheme: 'scheme', authority: {host: 'domain', port: 80}});
    assert.same(
      uri.parse('scheme://user@domain'),
      {scheme: 'scheme', authority: {host: 'domain', userInfo: 'user'}});
    assert.same(
      uri.parse('scheme://user@domain:80'),
      {scheme: 'scheme', authority: {host: 'domain', port: 80, userInfo: 'user'}});
  });

  it('should parse URIs with schemes and absolute paths', function () {
    assert.same(uri.parse('scheme:/'), {scheme: 'scheme', path: ['/']});
    assert.same(uri.parse('scheme:/one'), {scheme: 'scheme', path: ['/', 'one']});
    assert.same(uri.parse('scheme:/one/'), {scheme: 'scheme', path: ['/', 'one', '/']});
    assert.same(uri.parse('scheme:/one/two'), {scheme: 'scheme', path: ['/', 'one', '/', 'two']});
    assert.same(uri.parse('scheme:/one/two/'), {scheme: 'scheme', path: ['/', 'one', '/', 'two', '/']});
  });

  it('should parse URIs with schemes and relative paths', function () {
    assert.same(uri.parse('scheme:one'), {scheme: 'scheme', path: ['one']});
    assert.same(uri.parse('scheme:one/'), {scheme: 'scheme', path: ['one', '/']});
    assert.same(uri.parse('scheme:one/two'), {scheme: 'scheme', path: ['one', '/', 'two']});
    assert.same(uri.parse('scheme:one/two/'), {scheme: 'scheme', path: ['one', '/', 'two', '/']});
  });

  it('should parse URIs with schemes and queries', function () {
    assert.same(uri.parse('scheme:?query'), {scheme: 'scheme', query: 'query'});
    assert.same(uri.parse('scheme:?key=value'), {scheme: 'scheme', query: [{key: 'value'}]});
  });

  it('should parse URIs with schemes and fragments', function () {
    assert.same(uri.parse('scheme:#fragment'), {scheme: 'scheme', fragment: 'fragment'});
  });

  it('should parse URIs with schemes, authorities, and paths', function () {
    assert.same(
      uri.parse('scheme://domain/path'),
      {scheme: 'scheme', authority: {host: 'domain'}, path: ['/', 'path']});
    assert.same(
      uri.parse('scheme://domain:80/path'),
      {scheme: 'scheme', authority: {host: 'domain', port: 80}, path: ['/', 'path']});
  });

  it('should parse URIs with schemes, authorities, and queries', function () {
    assert.same(
      uri.parse('scheme://domain?query'),
      {scheme: 'scheme', authority: {host: 'domain'}, query: 'query'});
    assert.same(
      uri.parse('scheme://domain:80?query'),
      {scheme: 'scheme', authority: {host: 'domain', port: 80}, query: 'query'});
  });

  it('should parse URIs with schemes, authorities, and fragments', function () {
    assert.same(
      uri.parse('scheme://domain#fragment'),
      {scheme: 'scheme', authority: {host: 'domain'}, fragment: 'fragment'});
    assert.same(
      uri.parse('scheme://domain:80#fragment'),
      {scheme: 'scheme', authority: {host: 'domain', port: 80}, fragment: 'fragment'});
  });

  it('should parse URIs with schemes, authorities, paths, and queries', function () {
    assert.same(
      uri.parse('scheme://domain/path?query'),
      {scheme: 'scheme', authority: {host: 'domain'}, path: ['/', 'path'], query: 'query'});
    assert.same(
      uri.parse('scheme://domain:80/path?query'),
      {scheme: 'scheme', authority: {host: 'domain', port: 80}, path: ['/', 'path'], query: 'query'});
  });

  it('should parse URIs with schemes, authorities, paths, and fragments', function () {
    assert.same(
      uri.parse('scheme://domain/path#fragment'),
      {scheme: 'scheme', authority: {host: 'domain'}, path: ['/', 'path'], fragment: 'fragment'});
    assert.same(
      uri.parse('scheme://domain:80/path#fragment'),
      {scheme: 'scheme', authority: {host: 'domain', port: 80}, path: ['/', 'path'], fragment: 'fragment'});
  });

  it('should parse URIs with schemes, authorities, paths, queries, and fragments', function () {
    assert.same(
      uri.parse('scheme://domain/path?query#fragment'),
      {scheme: 'scheme', authority: {host: 'domain'}, path: ['/', 'path'], query: 'query', fragment: 'fragment'});
    assert.same(
      uri.parse('scheme://domain:80/path?query#fragment'),
      {scheme: 'scheme', authority: {host: 'domain', port: 80}, path: ['/', 'path'], query: 'query', fragment: 'fragment'});
  });
});


describe('URI serializer', function () {
  function assertTranscodes(string) {
    assert.same(uri.stringify(uri.parse(string)), string);
  }

  it('should stringify empty URIs', function () {
    assertTranscodes('');
  });

  it('should stringify URIs with schemes', function () {
    assertTranscodes('scheme:');
    assertTranscodes('az09+-.:');
  });

  it('should stringify URIs with host names', function () {
    assertTranscodes('//domain');
  });

  it('should stringify URIs with IPv4 addresses', function () {
    assertTranscodes('//127.0.0.1');
  });

  it('should stringify URIs with IPv6 addresses', function () {
    assertTranscodes('//[::1]');
  });

  it('should stringify URIs with host names and ports', function () {
    assertTranscodes('//domain:80');
  });

  it('should stringify URIs with IPv4 addresses and ports', function () {
    assertTranscodes('//127.0.0.1:80');
  });

  it('should stringify URIs with IPv6 addresses and ports', function () {
    assertTranscodes('//[::1]:80');
  });

  it('should stringify URIs with ports but no host info', function () {
    assertTranscodes('//:80');
  });

  it('should stringify URIs with empty user info', function () {
    assertTranscodes('//@');
  });

  it('should stringify URIs with user info but no host info', function () {
    assertTranscodes('//user@');
  });

  it('should stringify URIs with username and password info but no host info', function () {
    assertTranscodes('//user:pass@');
  });

  it('should stringify URIs with user info and host names', function () {
    assertTranscodes('//user@domain');
  });

  it('should stringify URIs with username and password info and host names', function () {
    assertTranscodes('//user:pass@domain');
  });

  it('should stringify URIs with user info and IPv4 addresses', function () {
    assertTranscodes('//user@127.0.0.1');
  });

  it('should stringify URIs with username and password info and IPv4 addresses', function () {
    assertTranscodes('//user:pass@127.0.0.1');
  });

  it('should stringify URIs with user info and IPv6 addresses', function () {
    assertTranscodes('//user@[::1]');
  });

  it('should stringify URIs with username and password info and IPv6 addresses', function () {
    assertTranscodes('//user:pass@[::1]');
  });

  it('should stringify URIs with user info, host names, and ports', function () {
    assertTranscodes('//user@domain:80');
  });

  it('should stringify URIs with user info, IPv4 addresses, and ports', function () {
    assertTranscodes('//user@127.0.0.1:80');
  });

  it('should stringify URIs with user info, IPv6 addresses, and ports', function () {
    assertTranscodes('//user@[::1]:80');
  });

  it('should stringify URIs with absolute paths', function () {
    assertTranscodes('/');
    assertTranscodes('/one');
    assertTranscodes('/one/');
    assertTranscodes('/one/two');
    assertTranscodes('/one/two/');
  });

  it('should stringify URIs with relative paths', function () {
    assertTranscodes('one');
    assertTranscodes('one/');
    assertTranscodes('one/two');
    assertTranscodes('one/two/');
  });

  it('should stringify URIs with paths containing permitted deliminters', function () {
    assertTranscodes('/one/!$&()*+,;=\'/three');
  });

  it('should stringify URIs with paths beginning with percent escapes', function () {
    assertTranscodes('%20');
  });

  it('should stringify URIs with empty queries', function () {
    assertTranscodes('?');
  });

  it('should stringify URIs with query parts', function () {
    assertTranscodes('?query');
  });

  it('should stringify URIs with query params', function () {
    assertTranscodes('?key=value');
    assertTranscodes('?k1=v1&k2=v2');
    assertTranscodes('?k1=');
    assertTranscodes('?=v1');
    assertTranscodes('?=');
    assertTranscodes('?a&b');
  });

  it('should stringify URIs with queries containing permitted delimiters', function () {
    assertTranscodes('?!$()*+,/:;?@\'');
  });

  it('should stringify URIs with empty fragments', function () {
    assertTranscodes('#');
  });

  it('should stringify URIs with fragments', function () {
    assertTranscodes('#fragment');
  });

  it('should stringify URIs with fragments containing permitted delimiters', function () {
    assertTranscodes('#!$&()*+,/:;?@=\'');
  });

  it('should stringify URIs with schemes and authorities', function () {
    assertTranscodes('scheme://domain');
    assertTranscodes('scheme://domain:80');
    assertTranscodes('scheme://user@domain');
    assertTranscodes('scheme://user@domain:80');
  });

  it('should stringify URIs with schemes and absolute paths', function () {
    assertTranscodes('scheme:/');
    assertTranscodes('scheme:/one');
    assertTranscodes('scheme:/one/');
    assertTranscodes('scheme:/one/two');
    assertTranscodes('scheme:/one/two/');
  });

  it('should stringify URIs with schemes and relative paths', function () {
    assertTranscodes('scheme:one');
    assertTranscodes('scheme:one/');
    assertTranscodes('scheme:one/two');
    assertTranscodes('scheme:one/two/');
  });

  it('should stringify URIs with schemes and queries', function () {
    assertTranscodes('scheme:?query');
    assertTranscodes('scheme:?key=value');
  });

  it('should stringify URIs with schemes and fragments', function () {
    assertTranscodes('scheme:#fragment');
  });

  it('should stringify URIs with schemes, authorities, and paths', function () {
    assertTranscodes('scheme://domain/path');
    assertTranscodes('scheme://domain:80/path');
  });

  it('should stringify URIs with schemes, authorities, and queries', function () {
    assertTranscodes('scheme://domain?query');
    assertTranscodes('scheme://domain:80?query');
  });

  it('should stringify URIs with schemes, authorities, and fragments', function () {
    assertTranscodes('scheme://domain#fragment');
    assertTranscodes('scheme://domain:80#fragment');
  });

  it('should stringify URIs with schemes, authorities, paths, and queries', function () {
    assertTranscodes('scheme://domain/path?query');
    assertTranscodes('scheme://domain:80/path?query');
  });

  it('should stringify URIs with schemes, authorities, paths, and fragments', function () {
    assertTranscodes('scheme://domain/path#fragment');
    assertTranscodes('scheme://domain:80/path#fragment');
  });

  it('should stringify URIs with schemes, authorities, paths, queries, and fragments', function () {
    assertTranscodes('scheme://domain/path?query#fragment');
    assertTranscodes('scheme://domain:80/path?query#fragment');
  });
});


describe('URI resolver', function () {
  it('should resolve normal URI references', function () {
    var base = uri.parse('http://a/b/c/d;p?q');
    assert.same(uri.resolve(base, 'g:h'), uri.parse('g:h'));
    assert.same(uri.resolve(base, 'g'), uri.parse('http://a/b/c/g'));
    assert.same(uri.resolve(base, './g'), uri.parse('http://a/b/c/g'));
    assert.same(uri.resolve(base, 'g/'), uri.parse('http://a/b/c/g/'));
    assert.same(uri.resolve(base, '/g'), uri.parse('http://a/g'));
    assert.same(uri.resolve(base, '//g'), uri.parse('http://g'));
    assert.same(uri.resolve(base, '?y'), uri.parse('http://a/b/c/d;p?y'));
    assert.same(uri.resolve(base, 'g?y'), uri.parse('http://a/b/c/g?y'));
    assert.same(uri.resolve(base, '#s'), uri.parse('http://a/b/c/d;p?q#s'));
    assert.same(uri.resolve(base, 'g#s'), uri.parse('http://a/b/c/g#s'));
    assert.same(uri.resolve(base, 'g?y#s'), uri.parse('http://a/b/c/g?y#s'));
    assert.same(uri.resolve(base, ';x'), uri.parse('http://a/b/c/;x'));
    assert.same(uri.resolve(base, 'g;x'), uri.parse('http://a/b/c/g;x'));
    assert.same(uri.resolve(base, 'g;x?y#s'), uri.parse('http://a/b/c/g;x?y#s'));
    assert.same(uri.resolve(base, ''), uri.parse('http://a/b/c/d;p?q'));
    assert.same(uri.resolve(base, '.'), uri.parse('http://a/b/c/'));
    assert.same(uri.resolve(base, './'), uri.parse('http://a/b/c/'));
    assert.same(uri.resolve(base, '..'), uri.parse('http://a/b/'));
    assert.same(uri.resolve(base, '../'), uri.parse('http://a/b/'));
    assert.same(uri.resolve(base, '../g'), uri.parse('http://a/b/g'));
    assert.same(uri.resolve(base, '../..'), uri.parse('http://a/'));
    assert.same(uri.resolve(base, '../../'), uri.parse('http://a/'));
    assert.same(uri.resolve(base, '../../g'), uri.parse('http://a/g'));
  });

  it('should resolve abnormal URI references', function () {
    var base = uri.parse('http://a/b/c/d;p?q');

    assert.same(uri.resolve(base, '../../../g'), uri.parse('http://a/g'));
    assert.same(uri.resolve(base, '../../../../g'), uri.parse('http://a/g'));

    assert.same(uri.resolve(base, '/./g'), uri.parse('http://a/g'));
    assert.same(uri.resolve(base, '/../g'), uri.parse('http://a/g'));
    assert.same(uri.resolve(base, 'g.'), uri.parse('http://a/b/c/g.'));
    assert.same(uri.resolve(base, '.g'), uri.parse('http://a/b/c/.g'));
    assert.same(uri.resolve(base, 'g..'), uri.parse('http://a/b/c/g..'));
    assert.same(uri.resolve(base, '..g'), uri.parse('http://a/b/c/..g'));

    assert.same(uri.resolve(base, './../g'), uri.parse('http://a/b/g'));
    assert.same(uri.resolve(base, './g/.'), uri.parse('http://a/b/c/g/'));
    assert.same(uri.resolve(base, 'g/./h'), uri.parse('http://a/b/c/g/h'));
    assert.same(uri.resolve(base, 'g/../h'), uri.parse('http://a/b/c/h'));
    assert.same(uri.resolve(base, 'g;x=1/./y'), uri.parse('http://a/b/c/g;x=1/y'));
    assert.same(uri.resolve(base, 'g;x=1/../y'), uri.parse('http://a/b/c/y'));

    assert.same(uri.resolve(base, 'g?y/./x'), uri.parse('http://a/b/c/g?y/./x'));
    assert.same(uri.resolve(base, 'g?y/../x'), uri.parse('http://a/b/c/g?y/../x'));
    assert.same(uri.resolve(base, 'g#s/./x'), uri.parse('http://a/b/c/g#s/./x'));
    assert.same(uri.resolve(base, 'g#s/../x'), uri.parse('http://a/b/c/g#s/../x'));
  });
});


describe('URI unresolver', function () {
  it('should unresolve related URIs', function () {
    assert.same(uri.unresolve('http://a', 'http://a'), uri.parse(''));
    assert.same(uri.unresolve('http://a', 'http://a/'), uri.parse('/'));
    assert.same(uri.unresolve('http://a', 'http://a/c'), uri.parse('c'));
    assert.same(uri.unresolve('http://a', 'http://a?y'), uri.parse('?y'));
    assert.same(uri.unresolve('http://a', 'http://a#s'), uri.parse('#s'));

    assert.same(uri.unresolve('http://a/', 'http://a'), uri.parse('/'));
    assert.same(uri.unresolve('http://a/', 'http://a/'), uri.parse(''));
    assert.same(uri.unresolve('http://a/', 'http://a/c'), uri.parse('c'));
    assert.same(uri.unresolve('http://a/', 'http://a?y'), uri.parse('/?y'));
    assert.same(uri.unresolve('http://a/', 'http://a#s'), uri.parse('/#s'));

    assert.same(uri.unresolve('http://a/b', 'http://a'), uri.parse('/'));
    assert.same(uri.unresolve('http://a/b', 'http://a/'), uri.parse('/'));
    assert.same(uri.unresolve('http://a/b', 'http://a/c'), uri.parse('c'));
    assert.same(uri.unresolve('http://a/b', 'http://a?y'), uri.parse('/?y'));
    assert.same(uri.unresolve('http://a/b', 'http://a#s'), uri.parse('/#s'));

    assert.same(uri.unresolve('http://a/b', 'http://a/b'), uri.parse(''));
    assert.same(uri.unresolve('http://a/b', 'http://a/b/'), uri.parse('/'));
    assert.same(uri.unresolve('http://a/b', 'http://a/b/c'), uri.parse('c'));
    assert.same(uri.unresolve('http://a/b', 'http://a/b?y'), uri.parse('?y'));
    assert.same(uri.unresolve('http://a/b', 'http://a/b#s'), uri.parse('#s'));

    assert.same(uri.unresolve('http://a/b/', 'http://a/b'), uri.parse('/b'));
    assert.same(uri.unresolve('http://a/b/', 'http://a/b/'), uri.parse(''));
    assert.same(uri.unresolve('http://a/b/', 'http://a/b/c'), uri.parse('c'));
    assert.same(uri.unresolve('http://a/b/', 'http://a/b?y'), uri.parse('/b?y'));
    assert.same(uri.unresolve('http://a/b/', 'http://a/b#s'), uri.parse('/b#s'));
  });

  it('should unresolve unrelated URIs', function () {
    assert.same(uri.unresolve('http://a', 'https://a'), uri.parse('https://a'));
    assert.same(uri.unresolve('http://a', 'http://z'), uri.parse('http://z'));
  });
});
