var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var connect = require('gulp-connect');
var pump = require('pump');
var del = require('del');

var jsFiles = [
    'src/TileLayer.Offline.js',
    'src/Control.Offline.js',
    'src/ngx.leaflet.offline.js'
];

gulp.task('clean', function () {
    del.sync(['dist/**/*']);
});

gulp.task('js', function (cb) {
    pump([
        gulp.src(jsFiles),
        concat('ngx.leaflet.offline.js'),
        gulp.dest('dist')
    ], cb);
});

gulp.task('minify', ['clean', 'js'], function (cb) {
    pump([
        gulp.src(['dist/ngx.leaflet.offline.js']),
        rename({ suffix: '.min' }),
        uglify(),
        gulp.dest('dist')
    ], cb);
});

gulp.task('demo', ['clean', 'js'], function () {
    connect.server();
});

gulp.task('release', ['minify']);
