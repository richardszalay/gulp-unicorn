const { src } = require("gulp");
const gulpUnicorn = require("../../dist");


function js() {
    return src("./src/*.js")
        .pipe(gulpUnicorn.write({
            outputPath: __dirname + "/dest/parent1"
        }))
}

exports.default = js;
