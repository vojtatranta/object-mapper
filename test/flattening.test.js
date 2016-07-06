import test from 'ava'

import * as indexDb from '../src/index'


test('leave a flat array untouched', t => {
  const array = [1, 2, 3]
  t.deepEqual(indexDb.flatten(array), array)
})

test('should flatten an array with one level of nesting', t => {
  const array = [1, [ 2, 3 ], 4, [ 5, 6 ], 7]
  t.deepEqual(indexDb.flatten(array), [ 1, 2, 3, 4, 5, 6, 7 ])
})

test('should flatten array with two levels of neseting', t => {
  const array = [1, [ 2, 3, [ 4, 5, 6 ] ], 7]
  t.deepEqual(indexDb.flatten(array), [ 1, 2, 3, 4, 5, 6, 7 ])
})

test('should flatten array with four levels of nesting', t => {
  const array = [1, [ 2, 3, [ 4, 5, 6, [ 7, 8, [ 9, 10 ]], 11] ], 12]
  t.deepEqual(indexDb.flatten(array), [ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ])
})
