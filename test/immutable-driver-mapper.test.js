import createMapper, { IndexedTree } from '../src/index'
import ObjectTreeImmutableDriver from '../src/entity-drivers/object-immutable-tree-driver'


describe('ImutableDriverMapper', () => {
  let testTree = null

  it('should create an IndexedTree instance', () => {
    expect(createMapper(new ObjectTreeImmutableDriver({}))).toBeA(IndexedTree)
  })

  beforeEach(() => {
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

  it('should map a test object', () => {
    const db = createMapper(new ObjectTreeImmutableDriver(testTree))

    expect(db.get('todos', 12)).toBe(testTree['todos'][0])
    expect(db.get('todos', 84)).toBe(testTree['todos'][2])
    expect(db.get('todos', 32)).toBe(testTree['todos'][1])

    expect(db.get('people', 2)).toBe(testTree['people'][1])
    expect(db.get('people', 1)).toBe(testTree['people'][0])

    expect(db.get('people')).toBe(testTree['people'])
    expect(db.get('todos')).toBe(testTree['todos'])
  })


  it('should update entity in the tree', () => {
    const db = createMapper(new ObjectTreeImmutableDriver(testTree))

    let nextValue = {
      id: 1,
      name: 'vojta tranta'
    }

    expect(db.get('people', 1)).toNotBe(nextValue)

    db.update('people', { id: '1' }, () => nextValue)

    expect(db.get('people', 1)).toEqual(nextValue)
    expect(db.get('people', 1).name).toBe('vojta tranta')
    expect(db.get('people', 2)).toBe(testTree['people'][1])

    expect(db.get('people', 1)).toNotBe(testTree['people'][0])
    expect(db.get('people')).toNotBe(testTree['people'])

    expect(db.get('todos')).toBe(testTree['todos'])
  })


  it('should delete an entity from tree', () => {
    const db = createMapper(new ObjectTreeImmutableDriver(testTree))
    let origPeopleLength = testTree['people'].length

    db.delete('people', 2)

    expect(db.get('people', 1)).toBe(testTree['people'][0])
    expect(db.get('people', '2')).toBe(null)
    expect(db.get('people').length).toBe(origPeopleLength - 1)

    expect(db.get('todos')).toBe(testTree['todos'])

    expect(db.get('people')).toNotBe(testTree['people'])
    expect(db.get('people', '2')).toNotBe(testTree['people'][1])
  })


  it('should add an entity to tree', () => {
    let driver = new ObjectTreeImmutableDriver(testTree)
    const db = createMapper(driver)

    const nextPerson = {
      id: '3123',
      name: 'Standa'
    }

    expect(db.get('people')).toBe(testTree['people'])

    db.add('people', nextPerson)

    let entityFromDb = db.get('people', 3123)
    expect(entityFromDb).toBe(nextPerson)
    expect(entityFromDb).toNotBe(testTree['people'][2])

    expect(db.get('people')).toNotBe(testTree['people'])
    expect(db.get('people').length).toBe(testTree['people'].length + 1)
    expect(db.get('people')).toEqual(db.get('people'))

    const addedPeople = db.get('people')

    const anotherPerson = {
      id: '331',
      name: 'Fanda'
    }
    db.add('people', anotherPerson)

    let anotherEntityFromDb = db.get('people', 331)
    expect(testTree['people'][3]).toNotBe(anotherPerson)
    expect(anotherEntityFromDb).toNotBe(testTree['people'][3])
    expect(anotherEntityFromDb).toBe(anotherPerson)

    expect(db.get('people').length).toBe(testTree['people'].length + 2)
    expect(db.get('people')).toNotBe(addedPeople)

    expect(db.get('todos')).toBe(testTree['todos'])
  })


  it('should index tree by other key but primary', () => {
    const db = createMapper(new ObjectTreeImmutableDriver(testTree), [ 'name' ])

    expect(() => {
      db.getBy('people', { noKey: 1 })
    }).toThrow(`Cannot get entity: ->
            Database table people was not indexed using key "noKey".
            Try different selector with these keys: "name, id"`)

    expect(db.getBy('people', { name: 'vojta' })[0]).toBe(testTree['people'][0])
    expect(db.getBy('people', { name: 'vojta' }, true)).toBe(testTree['people'][0])
  })

  it('should return original tree', () => {
    const db = createMapper(new ObjectTreeImmutableDriver(testTree))

    expect(db.getTree()).toBe(testTree)

    const nextPerson = {
      id: '3123',
      name: 'Standa'
    }
    db.add('people', nextPerson)

    expect(db.getTree()).toNotBe(testTree)
    expect(db.getTree().people.length).toBe(testTree['people'].length + 1)

    let nextValue = {
      id: 1,
      name: 'vojta tranta'
    }
    db.update('people', { id: '1' }, () => nextValue)

    db.delete('people', 2)

    expect(db.getTree()).toNotBe(testTree)
    expect(db.getTree().people.length).toBe(testTree['people'].length - 1)
  })

})
