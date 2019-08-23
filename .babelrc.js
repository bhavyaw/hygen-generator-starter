const env = process.env.BABEL_ENV || process.env.NODE_ENV;

console.log("\n\n****** Inside babelrc. Env is : ", env);

module.exports = {
    presets: [
        ["@babel/preset-env",{
            "useBuiltIns": false,
            "modules" : false
        }],
        ["@babel/preset-react", {
            development: (env === "development" || env === "test") 
        }]
    ],
    plugins: [
        ["module-resolver", {
            "alias": {
                "@" : "./src",
                "appConstants" : "./src/appConstants.js",
                "appMessages" : "./src/appMessages.js",
                "appGlobals" : "./src/appGlobals.js",
                "options" : "./src/options",
                "popup" : "./src/options",
                "common" : "./src/common",
                "contentScripts" : "./src/contentScripts",
                "background" : "./src/background",
                "assets" : "./src/assets",
            },
            "extensions": [".js", ".jsx", ".scss", ".css", ".json"]
        }],
        "@babel/plugin-transform-runtime",
        "babel-plugin-lodash",
        "babel-plugin-syntax-dynamic-import",
        "@babel/plugin-proposal-class-properties"
    ],
    env: {
        "production": {
            "plugins": [
                "transform-react-remove-prop-types"
            ]
        }
    }
}

function postCssImportResolver(id, basedir, importOptions) {
  let nextId = id;

  if (id.substr(0, 2) === './') {
    nextId = id.replace('./', '');
  }

  if (nextId[0] !== '_') {
    nextId = `_${nextId}`;
  }

  if (nextId.indexOf('.scss') === -1) {
    nextId = `${nextId}.scss`;
  }

  return path.resolve(basedir, nextId);
}

function generateClassNames(localName, resourcePath) {
  const fileName = path.basename(resourcePath, '.scss');
  return `${fileName}__${localName}`;
}
