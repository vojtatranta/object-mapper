import createMapper from '../src/'
import ObjectTreeMutationDriver from '../src/entity-drivers/object-tree-mutation-driver'


let testTree = {
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

const db = createMapper(new ObjectTreeMutationDriver(testTree))

console.log(db.get('todos', 12))
console.log(db.get('people', 2))

db.update('people', 1, (dbObject) => Object.assign(dbObject, { name: 'different name' }))

console.log(db.get('people', 1).name === 'different name')
console.log(testTree['people'][0].name === 'different name')
