import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const root=resolve('public');
for(const entry of ['index.html','v1/index.html']){
  const file=resolve(root,entry),html=readFileSync(file,'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,ids.length,`${entry}: duplicate control IDs`);
  for(const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)){
    const href=match[1];if(/^(https?:|mailto:)/.test(href))continue;
    assert(existsSync(href.startsWith('/')?resolve(root,'.'+href):resolve(dirname(file),href)),`${entry}: missing ${href}`);
  }
  for(const match of html.matchAll(/aria-labelledby="([^"]+)"/g))for(const id of match[1].split(' '))assert(ids.includes(id),`Missing dialog label ${id}`);
}
for(const file of ['app.js','v1/app.js'])for(const match of readFileSync(resolve(root,file),'utf8').matchAll(/(?:from\s*|import\()['"](\.[^'"]+)['"]/g))assert(existsSync(resolve(root,dirname(file),match[1])),`${file}: missing import ${match[1]}`);
console.log('V1/V2 assets, module imports, unique controls and dialog labels passed.');
