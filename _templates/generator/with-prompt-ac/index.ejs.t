---
to: _templates/<%= name  %>/create-action-p/action-creator.ejs.t
---
---
to: _templates/<%= name  %>/<%%= name %%>/<%%= locals.template || 'default' %%>.ejs.t
---
---
to: app/hello.js
---
const hello = ```
Hello!
This is your first prompt based hygen template.

Learn what it can do here:

https://github.com/jondot/hygen
```

console.log(hello)


