---
to: _templates/<%= name  %>/create-action-p/prompt-creator.ejs.t
---
---
to: _templates/<%= name  %>/<%%= name %%>/prompt.js
---

// see types of prompts:
// https://github.com/enquirer/enquirer/tree/master/examples
//
module.exports = [
  {
    type: 'input',
    name: 'message',
    message: "What's your message?"
  }
]
