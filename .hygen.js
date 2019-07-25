const path = require('path');
const fs = require('fs');
const hygenTemplatesPath = `C:/Users/bhavy/Desktop/Projects/starters/hygen/my-custom-generators/src/_templates`;

if (hygenTemplatesPath === '' && !fs.existsSync(hygenTemplatesPath)) {
  throw new Error(`Please point to valid hygen templates path`);
}

module.exports = {
  templates: hygenTemplatesPath,
  helpers: {
    relative: (from, to) => path.relative(from, to),
    src: () => path.normalize(process.cwd()).replace(/\\/g, '\/')
  }
};