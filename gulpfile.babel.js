import gulp from 'gulp'
import mocha from 'gulp-mocha'
import notify from 'gulp-notify'
import gutil from 'gulp-util'
import plumber from 'gulp-plumber'
import flow from 'gulp-flowtype'


gulp.task('default', () => {
  gulp.start('test')
  gulp.watch(['src/**', 'test/**/*.test.js'], ['test'])
})

gulp.task('test', [ 'flow' ], () => {
  return gulp.src(['test/_globals.js', 'test/*.js'], { read: false })
    .pipe(plumber({errorHandler: notify.onError("Error: <%= error.message %>")}))
    .pipe(mocha({
      reporter: 'spec',
      globals: [
        'expect'
      ],
    }))
    .on('error', (...args) => {
      gutil.log(...args)
    })
})

gulp.task('flow', () => {
  return gulp.src('src/**')
  .pipe(flow({}))
})
