import * as indexDb from '../src/index'


describe('flattening', () => {
  it('leave a flat array untouched', () => {
    const array = [1, 2, 3]
    expect(indexDb.flatten(array)).toEqual(array)
  })

  it('should flatten an array with one level of nesting', () => {
    const array = [1, [ 2, 3 ], 4, [ 5, 6 ], 7]
    expect(indexDb.flatten(array)).toEqual([ 1, 2, 3, 4, 5, 6, 7 ])
  })

  it('should flatten array with two levels of neseting', () => {
    const array = [1, [ 2, 3, [ 4, 5, 6 ] ], 7]
    expect(indexDb.flatten(array)).toEqual([ 1, 2, 3, 4, 5, 6, 7 ])
  })

  it('should flatten array with four levels of nesting', () => {
    const array = [1, [ 2, 3, [ 4, 5, 6, [ 7, 8, [ 9, 10 ]], 11] ], 12]
    expect(indexDb.flatten(array)).toEqual([ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 ])
  })
})


