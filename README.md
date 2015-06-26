# Record Notation (RECON)

[![Build Status](https://travis-ci.org/web-aware/recon-js.svg?branch=master)](https://travis-ci.org/web-aware/recon-js) [![Coverage Status](https://coveralls.io/repos/web-aware/recon-js/badge.svg?branch=master)](https://coveralls.io/r/web-aware/recon-js?branch=master)

RECON brings attributes into the era of object notation, and provides a simple
grammar and uniform tree model for attributed text markup.  RECON aims to
combine the minimalism of JSON with the expressiveness of XML in a
human-friendly syntax.

## Language Quick Start

### Primtives

RECON has three primitive datatypes: _text_, _number_, and _data_.

#### Text

Text values take one of two forms: a quoted _string_, or an unquoted
_identifier_.

```recon
"string"
identifier
```

#### Numbers

Numbers serialize as decimal literals.

```recon
-1
3.14
6.02e23
```

#### Data

Binary data serializes as a leading '%' symbol, followed by a base64 literal.

```recon
%AA==
```

### Records

RECON's sole aggregate datatype, the _record_, plays the combined role of array
and associative array.  Think of a record as a partially keyed list.  The
example record below contains two ordered items, first a "subject" field with
value "Greetings", then the unkeyed string "Hello, Earthlings!".

```recon
{ subject: "Greetings", "Hello, Earthlings!" }
```

A single comma, a single semicolon, or one or more newlines separate items.
Newline separated records provide a clean syntax for pretty-printed documents.

```recon
{
  subject: "Re: Greetings"
  "Hi Martians!"
}
```

Records support arbitrary values as slot keys.

```recon
{
  @planet Jupiter: {}
  @god Jupiter: {}
}
```

### Blocks

Top-level documents can omit the curly braces around their root record.  We
call the content of a record, sans curly braces, a _block_.  When a block
contains only a single item, the value of the block reduces to just the value
of the item it contains.  The example block below is equivalent to the sample
record above.

```recon
subject: "Re: Greetings"
"Hi Martians!"
```

### Attributes

The @ sign introduces an attribute.  Attributes call out key fields of a
record.  The previous markup example further reduces to the form below.

```recon
{
  "Hello, "
  {
    "@em":
    "world"
  }
  "!"
}
```

Note that the `@em` field above has no explicit value.  The RECON data model
refers to unspecified–but existent–values as _extant_.  We say that the record
`@em[world]` has an extant attribute named `em`.

Of course, attributes can have associated values too.  Place attribute
parameters in parentheses, following the attribute's name.

```recon
@answer(42)
@event("onClick")
```

The above attributes are structurally equivalent to:

```recon
{"@answer":42}
{"@event":"onClick"}
```

Attribute parentheses enclose a block, meaning attribute values construct an
implicit record when needed. An example, with its desugared equivalent, follows.

```recon
@img(src: "tesseract.png", width: 10, height: 10, depth: 10, time: -1)

{
  "@img": {
    src: "tesseract.png"
    width: 10
    height: 10
    depth: 10
    time: -1
  }
}
```

Attributes _modify_ adjacent values.  Modified values interpolate into the
record formed by their adjacent attributes.  Here are some examples of values
with prefix, postfix, and circumfix attributes:

```recon
@duration 30
30 @seconds
@duration 30 @seconds
@relative @duration 30 @seconds
```

The above attribute expressions desugar to the following records:

```recon
{ "@duration":, 30 }
{ 30, "@seconds": }
{ "@duration":, 30, "@seconds": }
{ "@relative":, "@duration":, 30, "@seconds": }
```

Modified records flatten into the record formed by their adjacent attributes.
So `@point{x:0,y:0}`, reduces to `{"@point":,x:0,y:0}`, not
`{"@point":,{x:0,y:0}}`.

### Markup

Square brackets denote _markup_.  Markup offers an inverted syntax for records,
with values embedded in text, as opposed to text embedded in records.

```recon
[Hello, @em[world]!]
```

Markup is really just syntactic sugar for records.  The above example expresses
the exact same structure as the one below.

```recon
{ "Hello, "; @em "world"; "!" }
```

Curly braces within markup lift the enclosed block into the markup's record.
The following records are equivalent.

```recon
[Answer: {42}.]
{ "Answer", 42, "." }
```

Square brackets lift nested markup into the enclosing record.  Make sure to
backslash escape square brackets if you want to include them verbatim.

```recon
[Say [what]?]
{ "Say ", "what", "?"}

[Say \[what\]?]
{ "Say [what]?" }
```

Sequential attributes within markup don't chain; each markup-embedded
attribute inserts a nested record.

```recon
[http@colon@slash@slash]
{ "http", @colon, @slash, @slash }
```

Attributes in markup can prefix curly brace enclosed blocks, and nested markup.

```recon
[Goals: @select(max:2){fast,good,cheap}.]
{ "Goals: ", @select(max:2){fast,good,cheap}, "." }
```

Beware that whitespace inside markup is significant.  Notice how the single
space added to the example below completely changes its meaning, when compared
to the previous example.

```recon
[Goals: @select(max:2) {fast,good,cheap}.]
{ "Goals: ", @select(max:2), " ", {fast,good,cheap}, "." }
```

## JavaScript Library

The RECON JavaScript library has no dependencies, and can run in any standard
JavaScript environment.  Use `npm` to incorporate the RECON JavaScript library
into Node.js projects.

```
npm install --save recon-js
```

```js
var recon = require('recon-js');

var record = recon.parse('[Welcome @a(href:"index.html")@em[home].]');
```

### Module API

#### recon(values)

Coerces one or more JavaScript values to a RECON value.  `string`, `number`,
`boolean`, and `Uint8Array` and valid RECON values pass through unchanged.
`object` and `Array` get recursively transformed to `recon.Record` values.

```js
recon(1, 2, 3); // {1,2,3}
recon({from: 'me', to: 'you'}); // '{from:me,to:you}'
recon('Hello, ', recon(recon.attr('em'), 'world'), '!'); // [Hello, @em[world]!]
recon({'@':{event: 'onClick'}, x: 23, y: 42}); // @event(onClick){x:23,y:42}
```

#### recon.attr(key, value)

Coerces `key` and `value` and creates a `recon.Attr`.

#### recon.slot(key, value)

Coerces `key` and `value` and creates a `recon.Slot`.

#### recon.extant

Returns the singleton Extant value.

#### recon.absent

Returns the singleton Absent value.

#### recon.empty()

Returns an empty record.

#### recon.base64(string)

Base64-decodes a `string` into a `Uint8Array`.

#### recon.parse(string)

Parses a string for a RECON value.

#### recon.stringify(value)

Serializes a JavaScript value as a RECON string.

#### recon.objectify(value)

Transforms a RECON value to an approximate JSON object.  Note that JSON cannot
faithfully represent all RECON values.

#### recon.builder()

Returns a RECON builder object.  Append attributes with `.attr(key, value)`,
slots with `.slot(key, value)`, and other items with `.item(value)`.  All input
keys and values will get coerced to RECON values.  Retrieve the built result
with `.state()`.

```js
recon.builder().attr('event', 'onClick').item('window').state(); // '@event(onClick) window'
```

#### recon.compare(a, b)

Compares two RECON values for equality.

### Record API

```js
var record = recon.parse('@subject("Re: Greetings") "Hi Martians!"');
```

#### record(key)

Lookups up an attribute or slot value by `key`; if `record` doesn't contain
`key`, and `key` is an integer, returns the item at index `key`.

```js
record('subject'); // 'Re: Greetings'
record(1); // 'Hi Martians!'
```

#### record.size

Returns the number of items in `record`.

#### record.isEmpty()

Returns `true` if `record` has no items.

#### record.head()

Returns the first item in `record`, or `absent` if `record` is empty.

#### record.tail()

Returns all but the first item in `record`.

#### record.body()

Returns all but the last item in `record`.

#### record.foot()

Returns the last item in `record`, or `absent` if `record` is empty.

#### record.target()

Returns the first non-field value in `record`.

#### record.concat(values)

Returns a copy of `record` with coerced `values` appended.  If `values` is a
single record argument, its items get appended.

```js
recon(1, 2).concat(3, 4) // '1,2,3,4'
recon(1, 2).concat(recon(3, 4)) // '1,2,3,4'
```

#### record.forEach(function)

Calls `function` with each item in `record`.

```js
record.forEach(function (item) { console.log(item.toString()); });
// @subject("Re: Greetings")
// Hi Martians!
```

#### record.iterator()

Returns an iterator that steps through each item in `record`.

```js
var items = record.iterator();
while (!items.isEmpty()) {
  var item = items.next();
  console.log(item.toString());
}
```

### Field API

Fields represent keyed items in a record.

#### item.isField

Returns `true` if `item` is either an `attr` or a `slot`.

#### item.isAttr

Returns `true` if `item` is an `attr`.

#### item.isSlot

Returns `true` if `item` is a `slot`.

#### field.key

Returns the `attr` or `slot`'s key.

#### field.value

Returns the `attr` or `slot`'s value.

## Language Grammar

```
SP ::= #x20 | #x9

NL ::= #xA | #xD

WS ::= SP | NL

Char ::= [#x1-#xD7FF] | [#xE000-#xFFFD] | [#x10000-#x10FFFF]

NameStartChar ::=
  [A-Z] | "_" | [a-z] |
  [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] |
  [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] |
  [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] |
  [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]

NameChar ::=  NameStartChar | '-' | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]

MarkupChar ::= Char - ('\\' | '@' | '{' | '}' | '[' | ']')

StringChar ::= Char - ('"' | '\\' | '@' | '{' | '}' | '[' | ']' | '\b' | '\f' | '\n' | '\r' | '\t')

CharEscape ::= '\\' ('"' | '\\' | '/' | '@' | '{' | '}' | '[' | ']' | 'b' | 'f' | 'n' | 'r' | 't')

Base64Char ::= [A-Za-z0-9+/]

Block ::= WS* Slots WS*

Slots ::= Slot SP* ((',' | ';' | NL) WS* Slots)?

Slot ::= BlockValue (SP* ':' SP* BlockValue?)?

Attr ::= '@' Ident ('(' Block ')')?

BlockValue ::=
  Attr SP* BlockValue? |
  (Record | Markup | Ident | String | Number | Data) SP* (Attr SP* BlockValue?)?

InlineValue ::= Attr (Record | Markup)? | Record | Markup

Record ::= '{' Block '}'

Markup ::= '[' (MarkupChar* | CharEscape | InlineValue)* ']'

Ident ::= NameStartChar NameChar*

String ::= '"' (StringChar* | CharEscape)* '"'

Number ::= '-'? (([1-9] [0-9]*) | [0-9]) ('.' [0-9]+)? (('E' | 'e') ('+' | '-')? [0-9]+)?

Data ::= '%' (Base64Char{4})* (Base64Char Base64Char ((Base64Char '=') | ('=' '=')))?
```
