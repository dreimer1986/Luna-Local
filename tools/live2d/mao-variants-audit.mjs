// Original donor capability check; never changes Luna or its model files.
import {chromium} from 'playwright-core';
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),out=resolve(here,'dist/mao-variants-check');
await mkdir(out,{recursive:true});
const motions=[];
for(const name of (await readdir(resolve(here,'dist/Mao/motions'))).filter(n=>n.endsWith('.motion3.json'))){
 const data=JSON.parse(await readFile(resolve(here,'dist/Mao/motions',name),'utf8'));
 motions.push({name,armVisibility:data.Curves.filter(c=>c.Target==='PartOpacity'&&['PartArmLA','PartArmLB'].includes(c.Id))});
}
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1100,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8792/tests/mao-arm-variants.html');await page.waitForFunction(()=>window.ready);
 const ranges=await page.evaluate(()=>player.parameterRanges.filter(p=>/^Param(Arm|Hand)L[AB]/.test(p.id)));
 const screenshot=async name=>{await page.waitForTimeout(100);return page.locator('canvas').screenshot({path:resolve(out,name+'.png')})};
 const neutral=await screenshot('a-neutral');
 for(const r of ranges.filter(r=>/LA/.test(r.id))){
  for(const [tag,value] of [['min',r.min],['max',r.max]]){
   await page.evaluate(({id,value})=>{parameters[id]=value},{id:r.id,value});await screenshot(r.id+'-'+tag);
  }
  await page.evaluate(r=>{parameters[r.id]=r.default},r);
 }
 await page.locator('#switch').click();await page.waitForTimeout(700);const raised=await screenshot('b-neutral');
 await page.locator('#switch').click();await page.waitForTimeout(700);const returned=await screenshot('a-return');
 const report={ranges,motions,errors,neutralReturnExact:neutral.equals(returned),variantsDiffer:!neutral.equals(raised)};
 await writeFile(resolve(out,'checks.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({errors,neutralReturnExact:report.neutralReturnExact,variantsDiffer:report.variantsDiffer,motions:motions.length,ranges},null,2));
 if(errors.length||!report.neutralReturnExact||!report.variantsDiffer)throw Error('Variant preview check failed');
}finally{await browser.close()}
