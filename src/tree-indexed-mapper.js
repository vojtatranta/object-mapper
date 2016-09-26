import * as objectUtils from './utils/object-utils'


export const flatten = (array) => {
  return array.reduce((flattenedArray, item) => {
    const flattenedItem = Array.isArray(item) ? flatten(item) : item
    return flattenedArray.concat(flattenedItem)
  }, [])
}

export const entityMapToIndexes = (entityMap, tables, indexKeys, primaryKey) => {
  return tables.reduce((indexMap, tableName) => {
    entityMap[tableName].forEach(({ path, entity }) => {
      indexKeys.forEach(currentIndexKey => {
        indexMap = addEntityToIndexMap(entity, path, tableName, primaryKey, currentIndexKey, indexMap)
      })
    })

    return indexMap
  }, {})
}

const addEntityToIndexMap = (entity, pathInTree, tableName, primaryKey, currentIndexKey, indexMap) => {
  const path = [ tableName, currentIndexKey, entity[currentIndexKey] ]
  
  if (currentIndexKey === primaryKey && !entity[primaryKey]) {
    throw new Error(`
      Cannot create indexes: ->
        Primary key ${primaryKey} of entity ${entity} has a falsy value: ${entity[primaryKey]}!
    `)
  }

  objectUtils.ensurePathInObject(indexMap, path, [])

  let indexValues = objectUtils.getInPath(indexMap, path)

  if (currentIndexKey === primaryKey && indexValues.length === 1) {
    throw new Error(`
      Cannot create indexes: ->
        Duplicate primary key ${entity[primaryKey]} in table '${tableName}'
    `)
  }

  indexValues.push(pathInTree)

  return indexMap
}

export const mapObject = (object, tables, indexKeys, primaryKey) => {
  return tables.reduce((indexes, tableName) => {
    return object[tableName].reduce((indexMap, entity, entityIndex) => {
      indexKeys.forEach(key => {
        indexMap = addEntityToIndexMap(entity, [tableName, entityIndex], tableName, primaryKey, key, indexMap)
      }, indexMap)
      return indexMap
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

  get(tableName, primaryKeyValue = undefined) {
    if (primaryKeyValue === undefined) {
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
    return first ? result[0] || null : this._driver.asArray(result)
  }

  update(tableName, selector, updater) {
    selector = this._normalizeSelector(selector)

    this._getBySelector(tableName, selector, true).forEach(object => {
      let newValue = (typeof updater === 'function') ? updater(object.value) : updater

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

    this._indexedMap = this._remapEntities(tableName, this._driver.getInPath([ tableName ]))

    return this
  }

  _remapEntities(tableName, entities) {
    const newTree = {}
    newTree[tableName] = entities
    const indexes = mapObject(newTree, Object.keys(newTree), this._indexes, this._primaryKey)
    return {...this._indexedMap, ...indexes}
  }

  add(tableName, entity) {
    let primaryKeyValue = entity[this._primaryKey]

    if (primaryKeyValue === undefined) {
      throw new Error(`
        Cannot add an entity: ->
          Entity does not contain a primary key: "${this._primaryKey}"!
      `)
    }

    let existingEntity = this.get(tableName, primaryKeyValue)

    if (existingEntity) {
      throw new Error(`
        Cannot add an entity: ->
          Duplicated value of primary key "${this._primaryKey}:${primaryKeyValue}" in existing entity ${existingEntity}!
      `)
    }

    let entities = (this._driver.getInPath([ tableName ]) || []).concat([ entity ])
    this._indexedMap = this._remapEntities(tableName, entities)
    this._driver.addInPath([ tableName ], entity)

    return this
  }

  getTree() {
    return this._driver.getTree()
  }
}
