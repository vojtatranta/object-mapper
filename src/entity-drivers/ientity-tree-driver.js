class IEntityTreeDriver {
  /*
    @param {*} tree
  */
  constructor(tree) {
    this._tree = tree
  }

  /*
    @return {*} tree
  */
  getTree() {
    return this._tree
  }

  /*
    @param {Array} path
    @return {*} tree
  */
  getInPath(path) {
    throw new Error(`
      getInPath() not implemented in ${this.constructor}
    `)

    return this._tree
  }

  /*
    @param {Array} path
    @param {Object} newValue
    @return {*} tree
  */
  updateInPath(path, newValue) {
    throw new Error(`
      updateInPath() not implemented in ${this.constructor}
    `)

    return this._tree
  }

  /*
    @param {Array} path
    @return {*} tree
  */
  deleteInPath(path) {
    throw new Error(`
      deleteInPath() not implemented in ${this.constructor}
    `)

    return this._tree
  }

  /*
    @param {Array} path
    @param {Object} entity
    @return {*} tree
  */
  addInPath(path, entity) {
    throw new Error(`
      addInPath() not implemented in ${this.constructor}
    `)

    return this._tree
  }

}


export default IEntityTreeDriver
