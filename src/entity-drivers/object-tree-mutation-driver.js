import IEntityTreeDriver from './ientity-tree-driver'
import * as objectUtils from '../utils/object-utils'


export default class ObjectTreeMutationDriver extends IEntityTreeDriver {
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
    objectUtils.deleteInPath(this._tree, path)
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
