// Re-exporting the CMO3 restores the unpolished portrait atlas. Restore approved
// artwork byte-for-byte; never draw new pixels or alter donor geometry.
import {readFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const [directory,approved]=process.argv.slice(2);
if(!directory||!approved)throw Error('Usage: node restore-portrait-atlas.mjs <export-directory> <approved-texture_00.png>');
const originalHash='a54acfad63adcf4059c1570b28e9c9a5b669a2e2501cb12f32b7fff03bd6440c';
const approvedHash='95d0403d528832ff4aa0f205f4301d365a7fa0610a49bdfbf4b4df61ad806e87';
const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
const model=JSON.parse(await readFile(resolve(directory,'luna.model3.json'),'utf8'));
if(model.FileReferences.Textures[0]!=='luna.2048/texture_00.png')throw Error('Atlas layout changed; inspect UV mapping before restoring.');
const target=resolve(directory,model.FileReferences.Textures[0]);
if(await hash(approved)!==approvedHash)throw Error('Not the approved V9 portrait texture.');
const current=await hash(target);
if(![originalHash,approvedHash].includes(current))throw Error('Unknown atlas; refusing to overwrite artwork.');
if(current!==approvedHash)await copyFile(approved,target);
console.log('Approved portrait texture restored:',await hash(target));
