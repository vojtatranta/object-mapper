import test from 'ava'

import createMapper, { IndexedTree } from '../src/index'
import ObjectTreeMmutableDriver from '../src/entity-drivers/object-tree-mutable-driver'


let testTree = null

test('should create an IndexedTree instance', t => {
  t.true(createMapper(new ObjectTreeMmutableDriver({})) instanceof IndexedTree)
})

test.beforeEach(t => {
  testTree = {
    'todos': [
      {
        'id': 12,
        'text': 'Todo num 12'
      },
      {
        id: 32,
        'text': 'Todo num 32'
      },
      {
        id: 84,
        'text': 'Todo num 86'
      },84
      ],
      'people': [
        {id: 1, 'name': 'vojta'},
        {id: 2, name: 'honza'}
      ]
  }

})

test('should map a test object', t => {
  const db = createMapper(new ObjectTreeMmutableDriver(testTree))

  t.is(db.get('todos', 12), testTree['todos'][0])
  t.is(db.get('todos', 84), testTree['todos'][2])
  t.is(db.get('todos', 32), testTree['todos'][1])

  t.is(db.get('people', 2), testTree['people'][1])
  t.is(db.get('people', 1), testTree['people'][0])

  t.is(db.get('people'), testTree['people'])
})


test('should mutate tree based on passed object directly', t => {
  const db = createMapper(new ObjectTreeMmutableDriver(testTree))

  let nextValue = {
    id: 1,
    name: 'vojta tranta'
  }

  t.not(db.get('people', 1), nextValue)

  db.update('people', { id: '1' }, () => nextValue)

  t.is(testTree['people'][0], nextValue)
  t.is(db.get('people', 1).name, 'vojta tranta')
  t.is(db.get('people'), testTree['people'])
})


test('should delete an entity from original tree', t => {
  const db = createMapper(new ObjectTreeMmutableDriver(testTree))

  db.delete('people', 2)

  t.is(db.get('people', 1), testTree['people'][0])
  t.is(db.get('people', '2'), null)
  t.is(db.get('people'), testTree['people'])
  t.is(testTree['people'][1], undefined)
})


test('should add an entity to tree', t => {
  const db = createMapper(new ObjectTreeMmutableDriver(testTree))

  const nextPerson = {
    id: '3123',
    name: 'Standa'
  }
  db.add('people', nextPerson)

  let entityFromDb = db.get('people', 3123)
  t.is(testTree['people'][2], nextPerson)
  t.is(entityFromDb, nextPerson)

  const anotherPerson = {
    id: '331',
    name: 'Fanda'
  }
  db.add('people', anotherPerson)

  let anotherEntityFromDb = db.get('people', 331)
  t.is(testTree['people'][3], anotherPerson)
  t.is(anotherEntityFromDb, anotherPerson)
  t.is(db.get('people'), testTree['people'])
})


test('should index tree by other key but primary', t => {
  const db = createMapper(new ObjectTreeMmutableDriver(testTree), [ 'name' ])

  t.throws(() => {
    db.getBy('people', { noKey: 1 })
  }, Error)

  t.is(db.getBy('people', { name: 'vojta' })[0], testTree['people'][0])
  t.is(db.getBy('people', { name: 'vojta' }, true), testTree['people'][0])
})

test('should return original tree', t => {
  const db = createMapper(new ObjectTreeMmutableDriver(testTree))

  t.is(db.getTree(), testTree)

  const nextPerson = {
    id: '3123',
    name: 'Standa'
  }
  db.add('people', nextPerson)

  let nextValue = {
    id: 1,
    name: 'vojta tranta'
  }
  db.update('people', { id: '1' }, t => nextValue)

  db.delete('people', 2)

  t.is(db.getTree(), testTree)
})
