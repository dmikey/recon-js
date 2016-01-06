'use strict';
/* global describe: false */
/* global it: false */

var assert = require('assert');
var recon = require('./recon.js');
var parse = recon.parse;
var stringify = recon.stringify;
var base64 = recon.base64;
var get = recon.get;
var set = recon.set;
var concat = recon.concat;

assert.same = function (x, y) {
  if (!recon.equal(x, y)) {
    assert.fail(false, true, recon.stringify(x) + ' did not equal ' + recon.stringify(y));
  }
};


describe('RECON functions', function () {
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

  it('should set ident keyed record slots', function () {
    var record = [1, {foo: 'bar'}, 3];
    set(record, 'foo', 'baz');
    assert.same(record, [1, {foo: 'baz'}, 3]);
    assert.equal(record.foo, 'baz');
  });

  it('should set ident keyed record attributes', function () {
    var record = [1, {'@hello': 'there'}, 3];
    set(record, '@hello', 'world');
    assert.same(record, [1, {'@hello': 'world'}, 3]);
    assert.equal(record['@hello'], 'world');
  });

  it('should set value keyed record slots', function () {
    var record = [1, {$key: [{'@planet': null}], $value: 'Neptune'}, 3];
    set(record, [{'@planet': null}], 'Pluto');
    assert.same(record, [1, {$key: [{'@planet': null}], $value: 'Pluto'}, 3]);
    assert.equal(get(record, [{'@planet': null}]), 'Pluto');
  });

  it('should concat two values', function () {
    assert.same(concat(1, 2), [1, 2]);
  });

  it('should concat a record and a value', function () {
    var record = concat([{'@a': true}, 2], 3);
    assert.same(record, [{'@a': true}, 2, 3]);
    assert.equal(record['@a'], true);
  });

  it('should concat a value and a record', function () {
    var record = concat(1, [2, {'@z': false}]);
    assert.same(record, [1, 2, {'@z': false}]);
    assert.equal(record['@z'], false);
  });

  it('should concat two records', function () {
    var record = concat([{'@a': true}, 2], [3, {'@z': false}]);
    assert.same(record, [{'@a': true}, 2, 3, {'@z': false}]);
    assert.equal(record['@a'], true);
    assert.equal(record['@z'], false);
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
  it('should stringify absent values', function () {
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
