const iconv = require('iconv-lite');
const str = 'VÃ¡ÂºÂ¬N HÃƒâ‚¬NH';

let b1 = Buffer.from(str, 'latin1');
let out1 = iconv.decode(b1, 'utf8');
console.log('decode utf8:', out1);

let b2 = Buffer.from(out1, 'latin1');
let out2 = iconv.decode(b2, 'utf8');
console.log('decode utf8 twice:', out2);
