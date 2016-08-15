import TreeIndexedMapper, { entityMapToIndexes, mapObject } from './tree-indexed-mapper'


export default function createMapper(driver, indexKeys = [], tables = null, primaryKey = 'id') {
  if (!indexKeys.some(candidate => candidate === primaryKey)) {
    indexKeys.push(primaryKey)
  }

  const tree = driver.getTree()
  const entityMap = driver.getEntityMap()
  tables = tables || Object.keys(tree)

  const indexes = !entityMap ? mapObject(tree, tables, indexKeys, primaryKey) : entityMapToIndexes(entityMap, tables, indexKeys, primaryKey)


  return new TreeIndexedMapper(driver, indexes, indexKeys, primaryKey)
}
