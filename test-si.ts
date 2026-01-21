import si from 'systeminformation';
import * as siStar from 'systeminformation';

console.log('Default import:', si);
console.log('Star import:', siStar);
if (si && si.fsSize) console.log('si.fsSize exists on default');
if (siStar && siStar.fsSize) console.log('si.fsSize exists on star');
