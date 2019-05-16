const path = require('path');

module.exports = {
  templates: `C:/Users/bhavy/Desktop/Projects/starters/hygen-generators/_templates`,
  helpers: {
    relative: (from, to) => path.relative(from, to),
    src: ()=> __dirname
  }
};