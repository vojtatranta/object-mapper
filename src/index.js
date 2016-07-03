// @flow

export const flatten = (array) => {
  return array.reduce((flattenedArray, item) => {
    const flattenedItem = Array.isArray(item) ? flatten(item) : item
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

    if (path.length !== counter) {
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

export const deleteInPath = (object, path) => {
  const parentObject = getInPath(object, path.slice(0, path.length - 1))
  let last = path.pop()
  delete parentObject[last]

  return object
}

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

  _normalizeSelector(maybeSelector) {
    if (!isObject(maybeSelector)) {
      let objectSelector = {}
      objectSelector[this._primaryKey] = maybeSelector
      return objectSelector
    }

    return maybeSelector
  }

  getBy(tableName, selector, first = false) {
    selector = this._normalizeSelector(selector)

    let result = this._getBySelector(tableName, selector)
    return first ? result[0] || null : result
  }

  _selectorToPath(selector) {
    const arrayOfPaths = Object.keys(selector).map(selectorKey => [ selectorKey, selector[selectorKey] ])

    return flatten(arrayOfPaths)
  }

  getPathsBySelector(tableName, selector) {
    return Object.keys(selector).reduce((result, selectorKey) => {
      const indexTable = getInPath(this._indexedMap, [ tableName, selectorKey ])
      if (indexTable === undefined) {
        throw new Error(
          `Cannot get entity: ->
            Database table ${tableName} was not indexed using key "${selectorKey}".
            Try different selector with these keys: "${this._indexes.join(', ')}"`
        )
      }

      try {
        const pathToEntites = getInPath(this._indexedMap, [ tableName, selectorKey, selector[selectorKey] ]) || []
        return result.concat(pathToEntites)
      } catch (err) {
        return result
      }
    }, [])
  }

  _getBySelector(tableName, selector, withPaths = false) {
    if (this._indexedMap[tableName] === undefined) {
      throw new Error(`
        Cannot get entity: ->
          Trying to query a table "${tableName}" that does not exist.
      `)
    }

    const matchedPaths = this.getPathsBySelector(tableName, selector)

    return matchedPaths.map(path => {
      let value = getInPath(this._tree, path)
      return withPaths ? { path, value } : value
    })
  }

  updateInPath(path, value) {
    let counter = 0
    return path.reduce((tree, key) => {
      counter++
      if (path.length === counter) {
        tree[key] = value
      }
      return tree[key]
    }, this._tree)
  }

  update(tableName, selector, updater) {
    selector = this._normalizeSelector(selector)

    this._getBySelector(tableName, selector, true).forEach(object => {
      let valueToUpdate = isObject(object.value) ? Object.assign({}, object.value) : object.value
      let newValue = updater(valueToUpdate)

      if (object.value[this._primaryKey] !== newValue[this._primaryKey]) {
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

  delete(tableName, selector) {
    selector = this._normalizeSelector(selector)

    const matchedPaths = this.getPathsBySelector(tableName, selector)
    matchedPaths.forEach(path => deleteInPath(this._tree, path))

    deleteInPath(this._indexedMap, [ tableName ].concat(this._selectorToPath(selector)))

    return this
  }

  add(tableName, entity) {
    if (entity[this._primaryKey] === undefined) {
      throw new Error(`
        Cannot add an entity: ->
          Entity does not contain a primary key "${this._primaryKey}"!
      `)
    }
    const newTree = {}
    let entities = (this._tree[tableName] || []).concat(entity)
    newTree[tableName] = entities
    const indexes = mapObject(newTree, Object.keys(newTree), this._indexes, this._primaryKey)
    this._indexedMap = Object.assign({}, this._indexedMap, indexes)

    ensurePathInObject(this._tree, [ tableName ])
    this._tree[tableName] = entities

    return this
  }

  serialize() {
    return this._tree
  }
}

export const mapObject = (object, tables, indexKeys, primaryKey) => {
  if (!indexKeys.some(candidate => candidate === primaryKey)) {
    indexKeys.push(primaryKey)
  }

  return tables.reduce((indexes, tableName) => {
    return object[tableName].reduce((map, entity, entityIndex) => {
      indexKeys.forEach(key => {
        let path = [ tableName, key, entity[key] ]
        ensurePathInObject(map, path, [])

        let indexValues = getInPath(map, path)

        if (key === primaryKey && indexValues.length === 1) {
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
}


export default function createMapper(tree, indexKeys = [ ], primaryKey = 'id') {
  const tables = Object.keys(tree)


  const indexes = mapObject(tree, tables, indexKeys, primaryKey)

  return new IndexedTree(tree, indexes, indexKeys, primaryKey)
}
