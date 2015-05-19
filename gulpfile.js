var gulp = require('gulp');
var traceur = require('gulp-traceur');
var tsc = require('gulp-tsc');
var ws = require('ws');
var del = require('del');
var replace = require('gulp-replace');
var express = require('express');
var http = require('http');
var minify = require('gulp-minify-css');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

var config = {
    srcDir: './src',
    distDir: './dist',
    serverPort: 3000
};

function clean(cb) {
    del(config.distDir, cb);
}

function buildJsDev() {
    return gulp.src(config.srcDir + '/script/**/*.ts')
        .pipe(tsc({target: 'ES5', module: 'amd', emitError: false}))
        .pipe(gulp.dest(config.distDir + '/js'))
}

function buildCssDev() {
    return gulp.src(config.srcDir + '/style/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(concat('style.css'))
        .pipe(minify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.distDir + '/css'));
}

function buildHtmlDev() {
    return gulp.src(config.srcDir + '/index.html')
        .pipe(replace(/<\/body>/, '<script>\n    \'use strict\';\n    var attempts = 1;\n    var loadingCss = 0;\n\n    function createWebSocket() {\n        var ws = new WebSocket(\'ws://localhost:8124\');\n\n        ws.onopen = function () {\n            attempts = 1;\n        }\n\n        ws.onmessage = function (event) {\n            console.log(event.data);\n            if (event.data === \'css\') {\n                [].slice.call(document.getElementsByTagName(\'link\')).forEach(function (link) {\n                    if (link.rel !== \'stylesheet\') {\n                        return;\n                    }\n                    if (link.getAttribute(\'href\').match(/^(https?:)?\\/\\//)) {\n                        // Ignore absolute URLs; let\'s say they are external.\n                        return;\n                    }\n                    link.setAttribute(\'href\', link.getAttribute(\'href\').replace(/(\\?\\d+)?$/, \'?\' + new Date().getTime()));\n                    loadingCss++;\n                    var interval = setInterval(function () {\n                        if (!link.sheet.cssRules.length) {\n                            return;\n                        }\n                        // This style has fully loaded.\n                        loadingCss--;\n                        clearInterval(interval);\n\n                        if (loadingCss !== 0) {\n                            // Wait for all the styles to load.\n                            return;\n                        }\n                        // Force redraw.\n                        document.body.style.display = \'none\';\n                        document.body.style.display = \'\';\n                    }, 100);\n                })\n            } else if (event.data === \'html\') {\n                window.location.reload();\n            }\n        }\n\n        ws.onclose = function () {\n            var time = generateInterval(attempts);\n\n            setTimeout(function () {\n                attempts++;\n                createWebSocket();\n            }, time)\n        }\n    }\n\n    function generateInterval(k) {\n        var maxInterval = (Math.pow(2, k) - 1) * 1000;\n\n        if (maxInterval > 30 * 1000) {\n            maxInterval = 30 * 1000; // If the generated interval is more than 30 seconds, truncate it down to 30 seconds.\n        }\n\n        // generate the interval to a random number between 0 and the maxInterval determined from above\n        return Math.random() * maxInterval;\n    }\n\n    createWebSocket();\n</script>\n</body>'))
        .pipe(gulp.dest(config.distDir));
}

var reload = function () {
};

function server() {
    var expressServer = express();
    expressServer.use(express.static(config.distDir));
    // Serve index.html for all routes to leave routing up to react-router
    expressServer.all('/*', function (req, res) {
        res.sendFile('index.html', {root: config.distDir});
    });
    var httpServer = http.createServer(expressServer);
    httpServer.on('error', function (err) {
        throw err;
    });

    httpServer.listen(config.serverPort);

    var wss = new ws.Server({port: 8124});

    wss.on('connection', function connection(socket) {
        reload = function (what) {
            console.log('sending', what);
            socket.send(what);
        };
        socket.on('close', function () {
            console.log('closed');
            reload = function () {
            };
        })
    });
}

function reloadComponent(component) {
    reload(component)
}

function watch() {
    gulp.watch(config.srcDir + '/index.html', gulp.series(buildHtmlDev, reloadComponent.bind(null, 'html')));
    gulp.watch(config.srcDir + '/script/**/*.ts', gulp.series(buildJsDev, reloadComponent.bind(null, 'html')));
    gulp.watch(config.srcDir + '/style/**/*.scss', gulp.series(buildCssDev, reloadComponent.bind(null, 'css')));
}

gulp.task('default', gulp.task('default', gulp.series(clean, gulp.parallel(buildJsDev, buildCssDev, buildHtmlDev, server, watch))));
