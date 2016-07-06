[![Build Status](https://travis-ci.org/vojtatranta/object-mapper.svg)](https://travis-ci.org/vojtatranta/object-mapper)
# Object index

Tired of looping through your array of objects or object of arrays? End with it, index it by key you want, query it like a database!

## Install
``` bash
$ npm i object-indexed-map
```

## Example of usage
Take a look at the [example](https://github.com/vojtatranta/object-mapper/blob/master/example/index.js) or [at the tests](https://github.com/vojtatranta/object-mapper/blob/master/test/).

## Support for [immutable.js](https://github.com/facebook/immutable-js)
Take a look at the [tests](https://github.com/vojtatranta/object-mapper/blob/master/test/) again and look for `immutable-driver` test.

**warning** in order for this to be working, you have to use `immutable.Record` as `immutable.Map`, because `Record` implements `getters!`.

The reason for this is that his library should not care how to get values from an object.

So it just uses native Javascript getters:
``` js
let value = object[key]
```
anything like:
``` js
let value = object.get(key)
```
cannot be used.

So your tree must be defined as a `immutable.Record`, which is easy and a good practice:
```js
const Structure = immutable.Record({
  'todos': immutable.List(),
  'people': immutable.List()
})

const Todo = immutable.Record({
  'id': null,
  'text':  ''
})

const Human = immutable.Record({
  'id': null,
  'name': ''
})

const testTree = Structure({
  'todos': immutable.List([
    Todo({
      'id': 12,
      'text': 'Todo num 12'
    }),
    Todo({
      'id': 32,
      'text': 'Todo num 32'
    })
  ]),
  'people': immutable.List([
    Human({
      'id': 1,
      'name': 'vojta'
    }),
    Human({
      'id': 2,
      'name': 'honza'
    })
  ])
})
```
