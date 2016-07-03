import gulp from 'gulp'
import mocha from 'gulp-mocha'
import notify from 'gulp-notify'
import gutil from 'gulp-util'


gulp.task('default', () => {
  gulp.start('mocha')
  gulp.watch(['lib/**', 'test/**/*.test.js'], ['mocha'])
})

gulp.task('mocha', () => {
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
