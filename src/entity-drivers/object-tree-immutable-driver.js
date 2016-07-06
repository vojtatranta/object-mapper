import IEntityTreeDriver from './ientity-tree-driver'
import * as objectUtils from '../utils/object-utils'


export const recreateStructure = (objectOrArray) => {
  if (Array.isArray(objectOrArray)) {
    return objectOrArray.slice()
  }

  if (objectUtils.isObject(objectOrArray)) {
    return Object.assign({}, objectOrArray)
  }
}

export default class ObjectTreeMutableDriver extends IEntityTreeDriver {
  constructor(tree) {
    super(tree)
  }

  getTree() {
    return this._tree
  }

  _getInPathRaw(path) {
    try {
      return objectUtils.getInPath(this._tree, path)
    } catch (err) {
      return undefined
    }
  }

  getInPath(path) {
    let value = this._getInPathRaw(path)
    return value === undefined ? null : value
  }

  _walkPathInTree(path, targetValue) {
    let counter = 0
    let tree = Object.assign({}, this._tree)

    path.reduce((tree, key) => {
      counter++
      tree[key] = recreateStructure(tree[key])

      if (path.length === counter) {
        let nextSubValue = typeof targetValue === 'function' ? targetValue(tree[key], tree, key) : targetValue
        if (nextSubValue === undefined) {
          if (Array.isArray(tree)) {
            tree.splice(key, key + 1)
          } else {
            delete tree[key]
          }
        } else {
          tree[key] = nextSubValue
        }
      }

      return tree[key]
    }, tree)

    return tree
  }

  updateInPath(path, value) {
    let prevValue = this.getInPath(path)
    if (prevValue === value)  {
      return this._tree
    }

    this._tree = this._walkPathInTree(path, value)
    return this._tree
  }

  deleteInPath(path) {
    if (this._getInPathRaw(path) === undefined) {
      return this._tree
    }

    this._tree = this._walkPathInTree(path, undefined)
    return this._tree
  }

  addInPath(path, entity) {
    let entities = this.getInPath(path) || []
    objectUtils.ensurePathInObject(this._tree, path)
    this._tree = this.updateInPath(path, entities.concat([ entity ]))

    return this._tree
  }
}
