import immutable from 'immutable'

import createMapper from '../src/index'
import TreeIndexedMapper from '../src/tree-indexed-mapper'
import ImmutableTreeDriver from '../src/entity-drivers/immutable-tree-driver'


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


describe('ImutableDriverMapper', () => {
  let testTree = null

  it('should create an TreeIndexedMapper instance', () => {
    expect(createMapper(new ImmutableTreeDriver({}))).toBeA(TreeIndexedMapper)
  })

  beforeEach(() => {
    testTree = Structure({
      'todos': immutable.List([
        Todo({
          'id': 12,
          'text': 'Todo num 12'
        }),
        Todo({
          'id': 32,
          'text': 'Todo num 32'
        }),
        Todo({
          'id': 84,
          'text': 'Todo num 86'
        }),
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

  })

  it('should map a test object', () => {
    const db = createMapper(new ImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])

    expect(db.get('todos', 12)).toBe(testTree.getIn(['todos', 0]))
    expect(db.get('todos', 84)).toBe(testTree.getIn(['todos', 2]))
    expect(db.get('todos', 32)).toBe(testTree.getIn(['todos', 1]))

    expect(db.get('people', 2)).toBe(testTree.getIn(['people', 1]))
    expect(db.get('people', 1)).toBe(testTree.getIn(['people', 0]))

    expect(db.get('people')).toBe(testTree.getIn(['people']))
    expect(db.get('todos')).toBe(testTree.getIn(['todos']))
  })


  it('should update entity in the tree', () => {
    const db = createMapper(new ImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])

    let nextValue = Human({
      id: 1,
      name: 'vojta tranta'
    })

    expect(db.get('people', 1)).toNotBe(nextValue)

    db.update('people', { id: '1' }, () => nextValue)

    expect(db.get('people', 1)).toEqual(nextValue)
    expect(db.get('people', 1).name).toBe('vojta tranta')
    expect(db.get('people', 2)).toBe(testTree.getIn(['people', 1]))

    expect(db.get('people', 1)).toNotBe(testTree.getIn(['people', 0]))
    expect(db.get('people')).toNotBe(testTree.getIn(['people']))

    expect(db.get('todos')).toBe(testTree.getIn(['todos']))
  })


  it('should delete an entity from tree', () => {
    const db = createMapper(new ImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])
    let origPeopleLength = testTree['people'].size

    db.delete('people', 2)

    expect(db.get('people', 1)).toBe(testTree.getIn(['people', 0]))
    expect(db.get('people', 2)).toBe(null)
    expect(db.get('people').size).toBe(origPeopleLength - 1)

    expect(db.get('todos')).toBe(testTree.get('todos'))

    expect(db.get('people')).toNotBe(testTree.get('people'))
    expect(db.get('people', 2)).toNotBe(testTree.getIn(['people', 1]))
  })


  it('should add an entity to the tree', () => {
    const db = createMapper(new ImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])

    const nextPerson = Human({
      id: 3123,
      name: 'Standa'
    })

    expect(db.get('people')).toBe(testTree['people'])

    db.add('people', nextPerson)

    let entityFromDb = db.get('people', 3123)
    expect(entityFromDb).toBe(nextPerson)
    expect(entityFromDb).toNotBe(testTree.getIn(['people', 2]))

    expect(db.get('people')).toNotBe(testTree.get('people'))
    expect(db.get('people').size).toBe(testTree.get('people').size + 1)
    expect(db.get('people')).toEqual(db.get('people'))

    const addedPeople = db.get('people')

    const anotherPerson = {
      id: '331',
      name: 'Fanda'
    }
    db.add('people', anotherPerson)

    let anotherEntityFromDb = db.get('people', 331)
    expect(testTree.getIn(['people', 3])).toNotBe(anotherPerson)
    expect(anotherEntityFromDb).toNotBe(testTree['people'][3])
    expect(anotherEntityFromDb).toBe(anotherPerson)

    expect(db.get('people').size).toBe(testTree['people'].size + 2)
    expect(db.get('people')).toNotBe(addedPeople)

    expect(db.get('todos')).toBe(testTree['todos'])
  })


  it('should index tree by other key but primary', () => {
    const db = createMapper(new ImmutableTreeDriver(testTree), [ 'name' ], [ 'people', 'todos' ])

    expect(() => {
      db.getBy('people', { noKey: 1 })
    }).toThrow(`Cannot get entity: ->
            Database table people was not indexed using key "noKey".
            Try different selector with these keys: "name, id"`)

    expect(db.getBy('people', { name: 'vojta' })[0]).toBe(testTree.getIn(['people', 0]))
    expect(db.getBy('people', { name: 'vojta' }, true)).toBe(testTree.getIn(['people', 0]))
  })

  it('should return original tree', () => {
    const db = createMapper(new ImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])

    expect(db.getTree()).toBe(testTree)

    const nextPerson = Human({
      id: '3123',
      name: 'Standa'
    })
    db.add('people', nextPerson)

    const treeAfterAdd = db.getTree()
    expect(treeAfterAdd).toNotBe(testTree)
    expect(db.getTree().people.size).toBe(testTree.people.size + 1)

    let nextValue = Human({
      id: 1,
      name: 'vojta tranta'
    })
    db.update('people', { id: '1' }, () => nextValue)

    const treeAfterUpdate = db.getTree()
    expect(treeAfterUpdate).toNotBe(treeAfterAdd)

    db.delete('people', 2)

    expect(db.getTree()).toNotBe(treeAfterUpdate)
    expect(db.getTree().people.size).toBe(2)
  })

})
