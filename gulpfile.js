const gulp = require('gulp'),
    addsrc = require('gulp-add-src'),
    cssnano = require('gulp-cssnano'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    wrap = require('gulp-wrap'),
    del = require('del'),
    rename = require('gulp-rename'),
    eol = require('gulp-eol'),
    less = require('gulp-less'),
    LessAutoprefix = require('less-plugin-autoprefix'),
    autoprefix = new LessAutoprefix({browsers: ['> 1%', 'ios_saf > 7']}),
    babel = require('gulp-babel'),

    // https://c9.io/bbottema/gulp-js-html-inject
    inject = require('gulp-js-html-inject');

const baseDir = process.env.PWD || process.env.INIT_CWD;
const injectPattern = /'@@import ([a-zA-Z0-9\\\/\-_.]+)'/g;
const injectOptions = {basepath: baseDir, pattern: injectPattern};

const libs = [
    // Libraries
    // https://github.com/janl/mustache.js
    'js/libraries/mustache.js',
    // https://github.com/eorroe/NodeList.js
    'js/libraries/nodelist.js',

    'js/libraries/isMobile.js',

    'js/libraries/qs.js',
    'js/libraries/axios.min.js',
    'js/libraries/oidc-client.js',
];

const scripts = [


    'js/init.js',

    // Getting started
    'js/setup.js',
    'js/api.js',
    'js/helpers.js',

    'js/auth-callbacks.js',
    'js/auth.js',

    'js/widget-class.js',
    'js/matches-logic.js',

    'js/modules.js',

    // Partials
    'js/partials/**/*.js',

    // Components
    'js/components/**/*.js',

    // TEMP
    // 'js/temp-everton.js',

    'js/start.js',
];

gulp.task('scripts-min', function () {
    return gulp.src(scripts)
        .pipe(inject(injectOptions))
        .pipe(babel({
            presets: ['es2015'],
            compact: true,
            plugins: ['transform-object-assign']
        }))
        .pipe(concat('widget.min.js'))
        .pipe(wrap("(function(){\n<%= contents %>\n})();"))
        .pipe(addsrc.prepend(libs))
        .pipe(concat('widget.min.js'))
        .pipe(uglify())
        .pipe(eol('\r\n'))
        .pipe(gulp.dest('dist'));
});


gulp.task('scripts', function () {
    return gulp.src(scripts)
        .pipe(inject(injectOptions))
        .pipe(babel({
            presets: ['es2015'],
            compact: false,
            plugins: ['transform-object-assign']
        }))
        .pipe(concat('widget.js'))
        .pipe(wrap("(function(){\n<%= contents %>\n})();"))
        .pipe(addsrc.prepend(libs))
        .pipe(concat('widget.js'))
        .pipe(eol('\r\n'))
        .pipe(gulp.dest('dist'));
});

gulp.task('styles', function () {
    return gulp.src('less/style.less')
        .pipe(less({
            plugins: [autoprefix]
        }))
        .pipe(cssnano({
            zindex: false,
            autoprefixer: false,
            reduceIdents: false
        }))
        .pipe(rename('style.min.css'))
        .pipe(eol('\r\n'))
        .pipe(gulp.dest('dist'));
});

gulp.task('styles-black', function () {
    return gulp.src('less/styles-black.less')
        .pipe(less({
            plugins: [autoprefix]
        }))
        .pipe(cssnano({
            zindex: false,
            autoprefixer: false,
            reduceIdents: false
        }))
        .pipe(rename('styles-black.min.css'))
        .pipe(eol('\r\n'))
        .pipe(gulp.dest('dist'));
});

gulp.task('styles-mbet', function () {
    return gulp.src('less/styles-mbet.less')
        .pipe(less({
            plugins: [autoprefix]
        }))
        .pipe(cssnano({
            zindex: false,
            autoprefixer: false,
            reduceIdents: false
        }))
        .pipe(rename('styles-mbet.min.css'))
        .pipe(eol('\r\n'))
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', function () {
    gulp.watch('js/**/*.js', ['scripts']);
    gulp.watch('js/**/*.mustache', ['scripts']);
    gulp.watch('less/*.less', ['styles', 'styles-black', 'styles-mbet']);
    gulp.watch('js/**/*.less', ['styles', 'styles-black', 'styles-mbet']);
});

gulp.task('test', function () {
    return gulp.src(['js/api.js'])
        // .pipe(wrap("(function(){\n<%= contents %>\n})();"))
        .pipe(addsrc(libs[1]))
        .pipe(concat('widget2.js'))
        // .pipe(eol('\r\n'))
        .pipe(gulp.dest('dist'));
});

gulp.task('default', ['scripts', 'styles', 'watch']);
gulp.task('build', ['scripts', 'scripts-min', 'styles', 'styles-black', 'styles-mbet']);