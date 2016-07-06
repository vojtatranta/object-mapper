// @flow
import * as objectUtils from './utils/object-utils'


export const flatten = (array) => {
  return array.reduce((flattenedArray, item) => {
    const flattenedItem = Array.isArray(item) ? flatten(item) : item
    return flattenedArray.concat(flattenedItem)
  }, [])
}

export const mapObject = (object, tables, indexKeys, primaryKey) => {
  if (!indexKeys.some(candidate => candidate === primaryKey)) {
    indexKeys.push(primaryKey)
  }

  return tables.reduce((indexes, tableName) => {
    return object[tableName].reduce((map, entity, entityIndex) => {
      indexKeys.forEach(key => {
        let path = [ tableName, key, entity[key] ]
        objectUtils.ensurePathInObject(map, path, [])

        let indexValues = objectUtils.getInPath(map, path)

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

export default class TreeIndexedMapper {

  constructor(driver, indexedMap, indexes, primaryKey) {
    this._driver = driver
    this._indexedMap = indexedMap
    this._indexes = indexes
    this._primaryKey = primaryKey
  }

  _normalizeSelector(maybeSelector) {
    if (!objectUtils.isObject(maybeSelector)) {
      let objectSelector = {}
      objectSelector[this._primaryKey] = maybeSelector
      return objectSelector
    }

    return maybeSelector
  }

  _selectorToPath(selector) {
    const arrayOfPaths = Object.keys(selector).map(selectorKey => [ selectorKey, selector[selectorKey] ])

    return flatten(arrayOfPaths)
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
      let value = this._driver.getInPath(path)
      return withPaths ? { path, value } : value
    })
  }

  getPathsBySelector(tableName, selector) {
    return Object.keys(selector).reduce((result, selectorKey) => {
      const indexTable = objectUtils.getInPath(this._indexedMap, [ tableName, selectorKey ])
      if (indexTable === undefined) {
        throw new Error(
          `Cannot get entity: ->
            Database table ${tableName} was not indexed using key "${selectorKey}".
            Try different selector with these keys: "${this._indexes.join(', ')}"`
        )
      }

      try {
        const pathToEntites = objectUtils.getInPath(this._indexedMap, [ tableName, selectorKey, selector[selectorKey] ]) || []
        return result.concat(pathToEntites)
      } catch (err) {
        return result
      }
    }, [])
  }

  updateInPath(path, value) {
    return this._driver.updateInPath(path, value)
  }

  get(tableName, primaryKeyValue = null) {
    if (primaryKeyValue === null) {
      return this._driver.getInPath([ tableName ])
    }

    const selector = []
    selector[this._primaryKey] = primaryKeyValue
    let result = this._getBySelector(tableName, selector)
    return result[0] || null
  }

  getBy(tableName, selector, first = false) {
    selector = this._normalizeSelector(selector)

    let result = this._getBySelector(tableName, selector)
    return first ? result[0] || null : result
  }

  update(tableName, selector, updater) {
    selector = this._normalizeSelector(selector)

    this._getBySelector(tableName, selector, true).forEach(object => {
      let valueToUpdate = objectUtils.isObject(object.value) ? Object.assign({}, object.value) : object.value
      let newValue = (typeof updater === 'function') ? updater(valueToUpdate) : updater

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
    matchedPaths.forEach(path => this._driver.deleteInPath(path))

    objectUtils.deleteInPath(this._indexedMap, [ tableName ].concat(this._selectorToPath(selector)))

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
    let entities = (this._driver.getInPath([ tableName ]) || []).concat(entity)
    newTree[tableName] = entities
    const indexes = mapObject(newTree, Object.keys(newTree), this._indexes, this._primaryKey)
    this._indexedMap = Object.assign({}, this._indexedMap, indexes)

    this._driver.addInPath([ tableName ], entity)

    return this
  }

  getTree() {
    return this._driver.getTree()
  }
}
