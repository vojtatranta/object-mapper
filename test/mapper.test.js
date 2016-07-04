import createMapper, { IndexedTree } from '../src/index'
import ObjectTreeMutationDriver from '../src/entity-drivers/object-tree-mutation-driver'


describe('Mapper', () => {
  let testTree = null

  it('should create an IndexedTree instance', () => {
    expect(createMapper(new ObjectTreeMutationDriver({}))).toBeA(IndexedTree)
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
    const db = createMapper(new ObjectTreeMutationDriver(testTree))

    expect(db.get('todos', 12)).toBe(testTree['todos'][0])
    expect(db.get('todos', 84)).toBe(testTree['todos'][2])
    expect(db.get('todos', 32)).toBe(testTree['todos'][1])

    expect(db.get('people', 2)).toBe(testTree['people'][1])
    expect(db.get('people', 1)).toBe(testTree['people'][0])
  })


  it('should mutate tree based on passed object directly', () => {
    const db = createMapper(new ObjectTreeMutationDriver(testTree))

    let nextValue = {
      id: 1,
      name: 'vojta tranta'
    }

    expect(db.get('people', 1)).toNotBe(nextValue)

    db.update('people', { id: '1' }, () => nextValue)

    expect(testTree['people'][0]).toBe(nextValue)
    expect(db.get('people', 1).name).toBe('vojta tranta')
  })


  it('should delete an entity from original tree', () => {
    const db = createMapper(new ObjectTreeMutationDriver(testTree))

    db.delete('people', 2)

    expect(db.get('people', 1)).toBe(testTree['people'][0])
    expect(db.get('people', '2')).toBe(null)
    expect(testTree['people'][1]).toBe(undefined)
  })


  it('should add an entity to tree', () => {
    const db = createMapper(new ObjectTreeMutationDriver(testTree))

    const nextPerson = {
      id: '3123',
      name: 'Standa'
    }
    db.add('people', nextPerson)

    let entityFromDb = db.get('people', 3123)
    expect(testTree['people'][2]).toBe(nextPerson)
    expect(entityFromDb).toBe(nextPerson)

    const anotherPerson = {
      id: '331',
      name: 'Fanda'
    }
    db.add('people', anotherPerson)

    let anotherEntityFromDb = db.get('people', 331)
    expect(testTree['people'][3]).toBe(anotherPerson)
    expect(anotherEntityFromDb).toBe(anotherPerson)
  })


  it('should index tree by other key but primary', () => {
    const db = createMapper(new ObjectTreeMutationDriver(testTree), [ 'name' ])

    expect(() => {
      db.getBy('people', { noKey: 1 })
    }).toThrow(`Cannot get entity: ->
            Database table people was not indexed using key "noKey".
            Try different selector with these keys: "name, id"`)

    expect(db.getBy('people', { name: 'vojta' })[0]).toBe(testTree['people'][0])
    expect(db.getBy('people', { name: 'vojta' }, true)).toBe(testTree['people'][0])
  })

  it('should return original tree', () => {
    const db = createMapper(new ObjectTreeMutationDriver(testTree))

    expect(db.getTree()).toBe(testTree)
  })

})
