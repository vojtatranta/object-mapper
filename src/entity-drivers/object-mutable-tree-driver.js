import IEntityTreeDriver from './ientity-tree-driver'
import * as objectUtils from '../utils/object-utils'


export default class ObjectTreeMutableDriver extends IEntityTreeDriver {
  constructor(tree) {
    super(tree)
  }

  getTree() {
    return this._tree
  }

  getInPath(path) {
    let value = null
    try {
      value = objectUtils.getInPath(this._tree, path)
    } catch (err) {
      // keep value as null
    }
    return value === undefined ? null : value
  }

  _getInPathRaw(path) {
    try {
      return objectUtils.getInPath(this._tree, path)
    } catch (err) {
      return undefined
    }
  }

  _walkPathInTree(path, targetValue) {
    let counter = 0

    path.reduce((tree, key) => {
      counter++

      if (path.length === counter) {
        let nextSubValue = typeof targetValue === 'function' ? targetValue(tree[key], tree, key) : targetValue
        if (nextSubValue === undefined) {
          if (Array.isArray(tree)) {
            tree.splice(key, String(key) === '0' ? 1 : key)
          } else {
            delete tree[key]
          }
        } else {
          tree[key] = nextSubValue
        }
      }

      return tree[key]
    }, this._tree)

    return this._tree
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

  deleteInPath(path) {
    if (this._getInPathRaw(path) === undefined) {
      return this._tree
    }

    this._walkPathInTree(path, undefined)
    return this._tree
  }

  addInPath(path, entity) {
    let entities = this.getInPath(path) || []
    objectUtils.ensurePathInObject(this._tree, path)
    entities.push(entity)
    this.updateInPath(path, entities)

    return this._tree
  }
}
