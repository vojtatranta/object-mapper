import gulp from 'gulp'
import mocha from 'gulp-mocha'
import notify from 'gulp-notify'
import gutil from 'gulp-util'


gulp.task('default', () => {
  gulp.start('test')
  gulp.watch(['lib/**', 'test/**/*.test.js'], ['test'])
})

gulp.task('test', () => {
  return gulp.src(['test/*.js'], { read: false })
    .pipe(mocha({
      reporter: 'spec',
      globals: {
        expect: require('expect'),
      }
    }))
  .on('error', (...args) => {
    gutil.log(...args)
    notify('Error in gulp task!')
  })
})
