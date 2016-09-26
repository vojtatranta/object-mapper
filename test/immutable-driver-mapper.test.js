import immutable from 'immutable'

import createMapper from '../src/index'
import TreeIndexedMapper from '../src/tree-indexed-mapper'
import createImmutableTreeDriver from '../src/entity-drivers/immutable-tree-driver'


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
  'name': '',
  'children': immutable.List()
})


describe('ImutableDriverMapper', () => {
  let testTree = null

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
          'name': 'honza',
          'children': immutable.List([
            Human({
              'id': 3,
              'name': 'honza child'
            })
          ])
        })
      ])
    })
  })


  it('should create an TreeIndexedMapper instance', () => {
    expect(createMapper(createImmutableTreeDriver({}))).toBeA(TreeIndexedMapper)
  })


  it('should map a test object', () => {
    const db = createMapper(createImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])

    expect(db.get('todos', 12)).toBe(testTree.getIn(['todos', 0]))
    expect(db.get('todos', 84)).toBe(testTree.getIn(['todos', 2]))
    expect(db.get('todos', 32)).toBe(testTree.getIn(['todos', 1]))

    expect(db.get('people', 2)).toBe(testTree.getIn(['people', 1]))
    expect(db.get('people', 1)).toBe(testTree.getIn(['people', 0]))

    expect(db.get('people')).toBe(testTree.getIn(['people']))
    expect(db.get('todos')).toBe(testTree.getIn(['todos']))
  })


  it('should update entity in the tree', () => {
    const db = createMapper(createImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])

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
    const db = createMapper(createImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])
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
    const db = createMapper(createImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])

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
    const db = createMapper(createImmutableTreeDriver(testTree), [ 'name' ], [ 'people', 'todos' ])

    expect(() => {
      db.getBy('people', { noKey: 1 })
    }).toThrow(`Cannot get entity: ->
            Database table people was not indexed using key "noKey".
            Try different selector with these keys: "name, id"`)

    expect(db.getBy('people', { name: 'vojta' }).first()).toBe(testTree.getIn(['people', 0]))
    expect(db.getBy('people', { name: 'vojta' }, true)).toBe(testTree.getIn(['people', 0]))
  })


  it('should return original tree', () => {
    const db = createMapper(createImmutableTreeDriver(testTree), [], [ 'people', 'todos' ])

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


  describe('manual mapping', () => {
    it('should add entities to by mapped to driver manualy', () => {
      const child = Human({
        'id': 2,
        'name': 'child'
      })

      const driver = createImmutableTreeDriver(Structure({}), {
        'people': [
          {
            path: ['people', 0],
            entity: Human({
              'id': 1,
              'name': 'vojta'
            })
          },
          {
            path: ['people', 0, 'children', 0],
            entity: child
          }
        ]
      }, true)

      const db = createMapper(driver, [], [ 'people' ])

      expect(db.get('people', 1).get('id')).toBe(1)
      expect(db.get('people', 1).get('name')).toBe('vojta')
      expect(db.get('people', 1).get('children').get(0)).toBe(child)
      expect(db.get('people', 2)).toBe(child)
    })


    it('should add entities mapped manually from original tree', () => {
      const driver = createImmutableTreeDriver(testTree, {
        'people': [
          {
            path: ['people', 0],
            entity: testTree.get('people').first()
          },
          {
            path: ['people', 1],
            entity: testTree.get('people').get(1)
          },
          {
            path: ['people', 1, 'children', 0],
            entity: testTree.get('people').get(1).get('children').first()
          }
        ]
      })

      const db = createMapper(driver, [], [ 'people' ])

      expect(db.get('people', 1).get('id')).toBe(1)
      expect(db.get('people', 1).get('name')).toBe('vojta')
      expect(db.get('people', 2).get('id')).toBe(2)
      expect(db.get('people', 2).get('name')).toBe('honza')
      expect(db.get('people', 3)).toBe(testTree.get('people').get(1).get('children').first())

      db.update('people', { id: 3 }, (oldChild) => oldChild.set('name', 'new name'))

      expect(db.get('people', 3).get('name')).toBe('new name')

      const tree = driver.getTree()
      expect(tree.getIn([ 'people', 1, 'children', 0 ]).get('name')).toBe('new name')
    })


    it('should add entities mapped manually from original tree by name', () => {
      const driver = createImmutableTreeDriver(testTree, {
        'people': [
          {
            path: ['people', 0],
            entity: testTree.get('people').first()
          },
          {
            path: ['people', 1],
            entity: testTree.get('people').get(1)
          },
          {
            path: ['people', 1, 'children', 0],
            entity: testTree.get('people').get(1).get('children').first()
          }
        ]
      })

      const db = createMapper(driver, ['name'], ['people'])
      expect(db.getBy('people', { name: 'vojta' }).first().get('id')).toBe(1)
      expect(db.getBy('people', { name: 'honza child' }).first().get('id')).toBe(3)
    })
  })
})
