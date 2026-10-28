import {build} from 'esbuild';
import {cp, mkdir, access} from 'node:fs/promises';
import {resolve, join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sdk = process.argv[2];
if (!sdk) throw Error('Usage: npm run build -- <official CubismSdkForWeb-5-r.5 directory>');
const source = resolve(sdk), output = join(here, 'dist');
await access(join(source, 'Core/live2dcubismcore.min.js'));
await access(join(source, 'Framework/src/model/cubismusermodel.ts'));
await mkdir(output, {recursive: true});
await build({
  entryPoints: [join(here, 'runtime.mjs')], outfile: join(output, 'player.mjs'),
  bundle: true, format: 'esm', platform: 'browser', target: 'es2022',
  alias: {'@framework': join(source, 'Framework/src')},
  legalComments: 'eof',
});
await cp(join(here, 'bootstrap.mjs'), join(output, 'runtime.mjs'));
await cp(join(source, 'Core'), join(output, 'Core'), {recursive: true});
await cp(join(source, 'Framework/Shaders'), join(output, 'Shaders'), {recursive: true});
await cp(join(source, 'LICENSE.md'), join(output, 'SDK-LICENSE.md'));
await cp(join(source, 'NOTICE.md'), join(output, 'SDK-NOTICE.md'));
if (process.argv.includes('--sample')) {
  await cp(join(source, 'Samples/Resources/Hiyori'), join(output, 'Sample'), {recursive: true});
}
if (process.argv.includes('--mao-sample')) {
  await cp(join(source, 'Samples/Resources/Mao'), join(output, 'Mao'), {recursive: true});
}
console.log('Built local Cubism runtime. dist is excluded from Git; publication review remains required.');
