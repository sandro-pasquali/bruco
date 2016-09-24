# bruco

Italian for "caterpillar"; a tree walker.

Use this module when you want to find all the packages loaded via `require` or `import` in either `.js` or `.jsx`(React) files. Native `Node` package names are ignored, as are packages with names not conforming to current `npm` naming standards (all lowercase, for example), as are local packages (e.g. `require('./config.js')`). Useful for doing things like checking whether you are using all the dependencies defined in your `package.json` file.

## Install

```
npm install bruco
```

## Test

```
npm test
```

## Usage

```
let bruco = require('bruco');
```

### Searching a single file

```
let packages = bruco('/path/to/someFile.js');
// packages now an Array of npm package names, e.g. ['lodash','express']

let packages = bruco('/path/to/someFile.jsx');
// packages now an Array of npm package names, e.g. ['react','react-dom','lodash']
```

### Searching an array of files

```
let packages = bruco([
    '/path/to/file1.js',
    '/path/to/file2.js',
    '/path/to/file3.jsx'
    ...
]);
```

### Recursively searching a directory

If a `String` path to a directory (instead of a file) is sent all files under that directory will be searched:

```
let packages = bruco('./')
```

### You can nest these search kinds

```
let packages = bruco([
    '/path/to/dir', [
        '/nestedArr/1.js',
        '/another/dir',
        '/nestedArr/2.jsx'
    ],
    '/just/a/single/file.js'
    ...
]);
```

## Options

All options are...optional:

- `ignore` [`Array` or `String`] : Standard `glob` ignore rules.
- `all` [`Function`] : Will receive an `Array` of all `String` literals found within `require` or `import` calls, including the ones that were not included in the final collection. This can be used to build a larger view of package loading across your application, for instance. Things like `../../utils.js` or `$anIllegalNpmPaCkAgEname`.

```
let packages = bruco('/path/to/file3.jsx', {
    ignore : [
        '**/node_modules/**'
    ],
    all : a => debug('ALL:', a)
});
```
