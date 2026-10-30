// Restore the generated Ragdoll artwork after native CMO3 export. UV coordinates
// remain unchanged; this replaces only the separate Tororo tail atlas.
import {readFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const [directory,material]=process.argv.slice(2);
if(!directory||!material)throw Error('Usage: node restore-tail-atlas.mjs <export-directory> <ragdoll-tail-atlas.png>');
const sourceHash='559cdd6db8ffc3b75b36259f86f542a60223b1494a50dc4f664c273c4a7aab00';
const previousMaterialHash='de350f50d21c13701afe3c35e9fe85fa066c0901cb1e7d1d721c78e43eb11aa3';
const volumeMaterialHash='ba29080beb6836c81f3c0442216bea124069ad0c77fd4b69e035c02df92744e8';
const roundedMaterialHash='d1b211094c3d56712261b7d89f41298620dfd48c138392b4436752e4e14348da';
const materialHash='3ecf0d110be0bdb4c7a14145d47cf6896294e99d60e1ded1b5157db3f248c347';
const hash=async path=>createHash('sha256').update(await readFile(path)).digest('hex');
const model=JSON.parse(await readFile(resolve(directory,'luna.model3.json'),'utf8'));
if(model.FileReferences.Textures.length!==5||model.FileReferences.Textures[4]!=='luna.2048/texture_04.png')throw Error('Unexpected tail atlas layout; inspect before replacing.');
const target=resolve(directory,model.FileReferences.Textures[4]);
if(await hash(material)!==materialHash)throw Error('Unexpected tail artwork.');
const current=await hash(target);
if(![sourceHash,previousMaterialHash,volumeMaterialHash,roundedMaterialHash,materialHash].includes(current))throw Error('Unknown exported atlas; refusing overwrite.');
if(current!==materialHash)await copyFile(material,target);
console.log('Ragdoll tail material restored:',await hash(target));
