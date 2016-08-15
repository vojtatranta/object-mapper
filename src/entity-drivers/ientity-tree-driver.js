class IEntityTreeDriver {
  /*
    @param {*} tree
  */
  constructor(tree) {
    this._tree = tree
  }

  /*
    @return {*}
  */
  getTree() {
    return this._tree
  }

  /*
    @param {Array} path
    @return {*}
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
    @return {*}
  */
  updateInPath(path, newValue) {
    throw new Error(`
      updateInPath() not implemented in ${this.constructor}
    `)

    return this._tree
  }

  /*
    @param {Array} path
    @return {*}
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
    @return {*}
  */
  addInPath(path, entity) {
    throw new Error(`
      addInPath() not implemented in ${this.constructor}
    `)

    return this._tree
  }

}


export default IEntityTreeDriver
