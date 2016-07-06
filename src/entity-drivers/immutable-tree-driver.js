import IEntityTreeDriver from './ientity-tree-driver'


export default class ImmutableTreeDriver extends IEntityTreeDriver {
  constructor(tree) {
    super(tree)
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
}
