/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const glob = require('glob');

const files = glob.sync('{app,components}/**/*.{ts,tsx}');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('/app/')) {
    const newContent = content.replace(/['"`]\/app\//g, match => match[0] + '/');
    if (content !== newContent) {
      fs.writeFileSync(file, newContent);
      console.log('Fixed:', file);
    }
  }
});
