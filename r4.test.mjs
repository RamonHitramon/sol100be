import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
test('BE1 table and chart strategy labels and isolated public feed',async()=>{
 const html=await readFile(new URL('./index.html',import.meta.url),'utf8'),charts=await readFile(new URL('./paper-charts.mjs',import.meta.url),'utf8'),app=await readFile(new URL('./paper.mjs',import.meta.url),'utf8');
 for(const id of ["tp30","tp30be"]){assert.ok(html.includes(`value="${id}"`));assert.ok(charts.includes(`${id}:`));}
 assert.doesNotMatch(html+charts,/tp100|trail50_20/);assert.match(app,/RamonHitramon\/sol100be\/refs\/heads\/paper-feed/);assert.doesNotMatch(app,/mcap-call-report-2026-10-25/);
});
