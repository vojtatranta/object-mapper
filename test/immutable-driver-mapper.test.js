import test from 'ava'

import createMapper, { IndexedTree } from '../src/index'
import ObjectTreeImmutableDriver from '../src/entity-drivers/object-tree-immutable-driver'


let testTree = null

test('should create an IndexedTree instance', t => {
  t.true(createMapper(new ObjectTreeImmutableDriver({})) instanceof IndexedTree)
})

test.beforeEach(() => {
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
  const db = createMapper(new ObjectTreeImmutableDriver(testTree))

  t.is(db.get('todos', 12), testTree['todos'][0])
  t.is(db.get('todos', 84), testTree['todos'][2])
  t.is(db.get('todos', 32), testTree['todos'][1])

  t.is(db.get('people', 2), testTree['people'][1])
  t.is(db.get('people', 1), testTree['people'][0])

  t.is(db.get('people'), testTree['people'])
  t.is(db.get('todos'), testTree['todos'])
})


test('should update an entity', t => {
  const db = createMapper(new ObjectTreeImmutableDriver(testTree))

  let nextValue = {
    id: 1,
    name: 'vojta tranta'
  }

  db.update('people', { id: '1' }, () => nextValue)

  t.is(db.get('people', 1), nextValue)
  t.deepEqual(db.get('people', 1), nextValue)
  t.is(db.get('people', 1).name, 'vojta tranta')
  t.is(db.get('people', 2), testTree['people'][1])

  t.not(db.get('people', 1), testTree['people'][0])
  t.not(db.get('people'), testTree['people'])

  t.is(db.get('todos'), testTree['todos'])
})


test('should delete an entity from tree', t => {
  const db = createMapper(new ObjectTreeImmutableDriver(testTree))
  let origPeopleLength = testTree['people'].length

  db.delete('people', 2)

  t.is(db.get('people', 1), testTree['people'][0])
  t.is(db.get('people', '2'), null)
  t.is(db.get('people').length, origPeopleLength - 1)

  t.is(db.get('todos'), testTree['todos'])

  t.not(db.get('people'), testTree['people'])
  t.not(db.get('people', '2'), testTree['people'][1])
})


test('should add an entity to tree', t => {
  let driver = new ObjectTreeImmutableDriver(testTree)
  const db = createMapper(driver)

  const nextPerson = {
    id: '3123',
    name: 'Standa'
  }

  t.is(db.get('people'), testTree['people'])

  db.add('people', nextPerson)

  let entityFromDb = db.get('people', 3123)
  t.is(entityFromDb, nextPerson)
  t.not(entityFromDb, testTree['people'][2])

  t.not(db.get('people'), testTree['people'])
  t.is(db.get('people').length, testTree['people'].length + 1)
  t.deepEqual(db.get('people'), db.get('people'))

  const addedPeople = db.get('people')

  const anotherPerson = {
    id: '331',
    name: 'Fanda'
  }
  db.add('people', anotherPerson)

  let anotherEntityFromDb = db.get('people', 331)
  t.not(testTree['people'][3], anotherPerson)
  t.not(anotherEntityFromDb, testTree['people'][3])
  t.is(anotherEntityFromDb, anotherPerson)

  t.is(db.get('people').length, testTree['people'].length + 2)
  t.not(db.get('people'), addedPeople)

  t.is(db.get('todos'), testTree['todos'])
})


test('should index tree by other key but primary', t => {
  const db = createMapper(new ObjectTreeImmutableDriver(testTree), [ 'name' ])

  t.throws(t => {
    db.getBy('people', { noKey: 1 })
  }, Error)

  t.is(db.getBy('people', { name: 'vojta' })[0], testTree['people'][0])
  t.is(db.getBy('people', { name: 'vojta' }, true), testTree['people'][0])
})

test('should return original tree', t => {
  const db = createMapper(new ObjectTreeImmutableDriver(testTree))

  t.is(db.getTree(), testTree)

  const nextPerson = {
    id: '3123',
    name: 'Standa'
  }
  db.add('people', nextPerson)

  t.not(db.getTree(), testTree)
  t.is(db.getTree().people.length, testTree['people'].length + 1)

  let nextValue = {
    id: 1,
    name: 'vojta tranta'
  }
  db.update('people', { id: '1' }, t => nextValue)

  db.delete('people', 2)

  t.not(db.getTree(), testTree)
  t.is(db.getTree().people.length, testTree['people'].length - 1)
})
