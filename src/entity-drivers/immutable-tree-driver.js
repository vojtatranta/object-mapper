import immutable from 'immutable'

import IEntityTreeDriver from './ientity-tree-driver'


class ImmutableTreeDriver extends IEntityTreeDriver {
  constructor(tree, entityMap, shouldConstructTree = false) {
    super(tree, entityMap, shouldConstructTree)
    if (shouldConstructTree) {
      this._tree = this._constructTreeFromMap(entityMap)
    }
  }

  _constructTreeFromMap(entityMap) {
    let tree = null
    Object.keys(entityMap).forEach(tableName => {
      entityMap[tableName].forEach(({ path, entity }) => {
        this._tree = this._tree.updateIn(path, () => entity)
      })
    })

    return this._tree
  }

  getTree() {
    return this._tree
  }

  getInPath(path) {
    return this._tree.getIn(path)
  }

  updateInPath(path, value) {
    if (typeof value !== 'function') {
      this._tree = this._tree.updateIn(path, () => value)
    } else {
      this._tree = this._tree.updateIn(path, value)
    }

    return this._tree
  }

  deleteInPath(path) {
    this._tree = this._tree.deleteIn(path)
    return this._tree
  }

  addInPath(path, entity) {
    let entities = this.getInPath(path)
    this._tree = this.updateInPath(path, entities.concat([ entity ]))
    return this._tree
  }

  asArray(array) {
    return immutable.List(array)
  }
}



export default (tree, entityMap, shouldConstructTree = false) => {
  return new ImmutableTreeDriver(tree, entityMap, shouldConstructTree)
}
