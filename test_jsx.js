const jsx = require('fs').readFileSync('apps/web/src/app/(dashboard)/admin/students/[id]/page.tsx', 'utf8');
const acorn = require('acorn');
const jsxPlugin = require('acorn-jsx');
try {
  acorn.Parser.extend(jsxPlugin()).parse(jsx, {sourceType: 'module'});
  console.log('Valid JSX');
} catch(e) {
  console.error(e);
}
