export const ensurePathInObject = (object, path, defaultValue) => {
  let counter = 0
  path.reduce((object, key) => {
    counter++
    if (object[key] !== undefined) {
      return object[key]
    }

    if (path.length !== counter) {
      object[key] = {}
    } else {
      object[key] = defaultValue
    }

    return object[key]
  }, object)
  return object
}

export const deleteInPath = (object, path) => {
  const parentObject = getInPath(object, path.slice(0, path.length - 1))
  let last = path.pop()
  delete parentObject[last]

  return object
}

export const getInPath = (object, path) => {
  return path.reduce((object, key) => object[key], object)
}

export const isObject = (value) => {
  return (value === Object(value))
}
