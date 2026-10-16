import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const dest=path.join(root,'alphatab');
fs.mkdirSync(dest,{recursive:true});
for(const name of ['alphaTab.core.mjs']){
 const src=path.join(root,'node_modules','@coderline','alphatab','dist',name);
 const target=path.join(dest,name);
 if(fs.existsSync(target))throw Error('Refusing to overwrite '+target);
 fs.copyFileSync(src,target,fs.constants.COPYFILE_EXCL);
}
