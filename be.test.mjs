import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('BE1 is separate, exactly two strategy controls, gross arm/net stop disclosure',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8'),app=await readFile(new URL('./paper.mjs',import.meta.url),'utf8'),charts=await readFile(new URL('./paper-charts.mjs',import.meta.url),'utf8');
 assert.match(html,/<h1>TP30 vs TP30BE/);assert.match(html,/1\.15/);assert.match(html,/1\.30/);assert.match(html,/не трейлинг/);assert.match(html,/гэп/);assert.match(html,/глобальным с R4/);
 const filter=html.match(/<select id="filter".*?<\/select>/)[0];assert.match(filter,/value="tp30be"/);assert.doesNotMatch(filter,/tp10|tp20|tp40|tp50/);
 assert.match(app,/RamonHitramon\/sol100be\/refs\/heads\/paper-feed/);assert.match(app,/ARMED/);assert.match(charts,/tp30be:/);assert.doesNotMatch(charts,/tp10:|tp20:|tp40:|tp50:/);
});
