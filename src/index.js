import TreeIndexedMapper, { mapObject } from './tree-indexed-mapper'


export default function createMapper(driver, indexKeys = [], primaryKey = 'id') {
  let tree = driver.getTree()
  const tables = Object.keys(tree)

  const indexes = mapObject(tree, tables, indexKeys, primaryKey)

  return new TreeIndexedMapper(driver, indexes, indexKeys, primaryKey)
}
