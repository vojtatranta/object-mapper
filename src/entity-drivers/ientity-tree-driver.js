class IEntityTreeDriver {
  /*
    @param {*} tree
    @param {Array<Object<path: Array, entity *>>} entityMap
    @param {boolean} shouldConstructTree
  */
  constructor(tree, entityMap = null, shouldConstructTree = false) {
    this._tree = tree
    this._entityMap = entityMap
    this._shouldConstructTree = shouldConstructTree
  }

  /*
    @param {Object<path: Array, entity: *>} entitySchema
    @return {Array}
  */
  addEntityToTree(entitySchema) {
    return this._entityMap.push(entitySchema)
  }

  /*
    @return {*}
  */
  getTree() {
    return this._tree
  }

  /*
    @return Array
  */
  getEntityMap() {
    return this._entityMap
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
