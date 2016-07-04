import gulp from 'gulp'
import mocha from 'gulp-mocha'
import notify from 'gulp-notify'
import gutil from 'gulp-util'
import plumber from 'gulp-plumber'


gulp.task('default', () => {
  gulp.start('test')
  gulp.watch(['src/**', 'test/**/*.test.js'], ['test'])
})

gulp.task('test', () => {
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

