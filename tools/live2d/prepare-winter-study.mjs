// Prepare private, ignored study assets. Does not change the active HA model.
import {readFile,cp,mkdir,writeFile,access} from 'node:fs/promises';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const here=dirname(fileURLToPath(import.meta.url)),source=resolve(process.argv[2]||join(here,'dist/LunaV9'));
const destination=join(here,'dist/LunaWinterStudy');
if(source===destination)throw Error('Source and destination must differ');
const model=JSON.parse(await readFile(join(source,'luna.model3.json'),'utf8'));
if(model.LunaRig?.Profile!=='fullbody-face-v1')throw Error('Requires private V9 fullbody-face-v1 model');
const images=resolve(here,'../../docs/live2d/outfits');
for(const file of ['winter.png','winter-body.png'])await access(join(images,file));
await mkdir(destination,{recursive:true});await cp(source,destination,{recursive:true});
for(const file of ['winter.png','winter-body.png'])await cp(join(images,file),join(destination,file));
model.LunaRig.WinterStudyTexture='winter.png';model.LunaRig.WinterStudyBodyTexture='winter-body.png';
await writeFile(join(destination,'luna.model3.json'),JSON.stringify(model,null,2)+'\n');
console.log('Prepared private winter study:',destination);
