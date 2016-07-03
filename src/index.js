export const flatten = (array) => {
  return array.reduce((flattenedArray, item) => {
    flattenedItem = Array.isArray(item) ? flatten(item) : item
    return flattenedArray.concat(flattenedItem)
  }, [])
}

export const isObject = (value) => {
  return (value === Object(value))
}

export const ensurePathInObject = (object, path, defaultValue) => {
  let counter = 0
  path.reduce((object, key) => {
    counter++
    if (object[key] !== undefined) {
      return object[key]
    }

    if (path.length != counter) {
      object[key] = {}
    } else {
      object[key] = defaultValue
    }

    return object[key]
  }, object)
  return object
}

export const getInPath = (object, path) => {
  return path.reduce((object, key) => object[key], object)
}

//console.log(
//  flatten([1, 2, [ 1, 2, 3 ], 3, [ 5, 6, [ 1, 2, 3 ] ]])
//)


export class IndexedTree {

  constructor(tree, indexedMap, indexes, primaryKey) {
    this._tree = tree
    this._indexedMap = indexedMap
    this._indexes = indexes
    this._primaryKey = primaryKey
  }

  get(tableName, primaryKeyValue) {
    const selector = []
    selector[this._primaryKey] = primaryKeyValue
    let result = this._getBySelector(tableName, selector)
    return result[0] || null
  }

  getBy(tableName, selector, first = false) {
    if (!isObject(selector)) {
      throw new Error(`
        Cannot get entity:
          Selector must be an object eg. { 'searchedByKey': keyValue } -> { 'name': 'alice' } and the key must be indexed!
          Indexed keys are: "${this._indexes.join('')}".
      `)
    }

    let result = this._getBySelector(tableName, selector)
    return first ? result[0] || null : result
  }

  _getBySelector(tableName, selector, withPaths = false) {
    if (this._indexedMap[tableName] === undefined) {
      throw new Error(`
        Cannot get entity: ->
          Trying to query a table "${tableName}" that does not exist.
      `)
    }

    const matchedPaths = Object.keys(selector).reduce((result, selectorKey) => {
      const indexTable = getInPath(this._indexedMap, [ tableName, selectorKey ])
      if (indexTable === undefined) {
        throw new Error(
          `Cannot get entity: ->
            Database table ${tableName} was not indexed using key "${selectorKey}".
            Try different selector with these keys: "${this._indexes.join(', ')}"`
        )
      }

      try {
        const pathToEntites = getInPath(this._indexedMap, [ tableName, selectorKey, selector[selectorKey] ])
        if (pathToEntites === undefined) {
          return result
        } else {
          return result.concat(pathToEntites)
        }
      } catch (err) {
        return result
      }
    }, [])

    return matchedPaths.map(path => {
      let value = getInPath(this._tree, path)
      return withPaths ? { path, value } : value
    })
  }

  updateInPath(path, value) {
    let counter = 0
    return path.reduce((tree, key) => {
      counter++
      if (path.length == counter) {
        tree[key] = value
      }
      return tree[key]
    }, this._tree)
  }

  update(tableName, selector, updater) {
    this._getBySelector(tableName, selector, true).forEach(object => {
      let valueToUpdate = isObject(object.value) ? Object.assign({}, object.value) : object.value
      let newValue = updater(valueToUpdate)

      if (object.value[this._primaryKey] != newValue[this._primaryKey]) {
        throw new Error(`
          Cannot update an entity: ->
            You are trying to update primary key "${this._primaryKey}"
            from "${object.value[this._primaryKey]}" to "${newValue[this._primaryKey]}" which is not allowed!
        `)
      }

      this.updateInPath(object.path, newValue)
    })

    return this
  }

  serialize() {
    return this._tree
  }
}


export default function createIndexedDb(tree, indexKeys = [ 'id' ], primaryKey = 'id') {
  const tables = Object.keys(tree)

  const indexes = tables.reduce((indexes, tableName) => {
    return tree[tableName].reduce((map, entity, entityIndex) => {
      indexKeys.forEach(key => {
        let path = [ tableName, key, entity[key] ]
        ensurePathInObject(map, path, [])

        let indexValues = getInPath(map, path)

        if (key == primaryKey && indexValues.length == 1) {
          throw new Error(`
            Cannot create indexes: ->
              Duplicate primary key ${entity[primaryKey]} in table '${tableName}'
          `)
        }

        indexValues.push([tableName, entityIndex])
      }, map)
      return map
    }, indexes)
  }, {})

  return new IndexedTree(tree, indexes, indexKeys, primaryKey)
}


const tree = {
  'todos': [
    {
      'id': 12
    },
    {
      id: 32
    },
    {
      id: 84
    },
    ],
    'people': [
      {id: 1, 'name': 'vojta'},
      {id: 2, name: 'honza'}
    ]
}

const db = createIndexedDb(tree)
db.update('todos', { id: 12 }, (entity) => Object.assign(entity, { name: 'vojta dva', mama: 'daša'}))
console.log(db.getBy('todos', { id: 12 }, true))
