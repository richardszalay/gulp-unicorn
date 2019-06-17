

<div align="center">
  <a href="https://gulpjs.com/">
    <img height="128" 
      src="https://raw.githubusercontent.com/gulpjs/artwork/master/gulp.png" alt="Gulp">
  </a>
  <a href="https://github.com/kamsar/Rainbow">
    <img width="128" height="128"
      src="https://kamsar.net/nuget/rainbow/logo.png" alt="Unicorn">
  </a>
  <h1>Unicorn Plugin</h1>
  <p>Output files in Unicorn's Rainbow format. Works well with transparent sync.<p>
</div>


<h2 align="center">Install</h2>

```bash
npm i -D gulp-unicorn
```

<h2 align="center">Usage</h2>

**gulpfile.js**
```js
const { src } = require("gulp");
const gulpUnicorn = require("gulp-unicorn");


function js() {
    return src("./src/*.js")
        .pipe(gulpUnicorn.write({
            outputPath: __dirname + "/dest/scripts"
        }))
}

exports.default = js;
```
