import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes:Buffer){let bits=0,value=0,out='';for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-=5))&31];}}if(bits>0)out+=alphabet[(value<<(5-bits))&31];return out;}
function decode(s:string){let bits=0,value=0,out:number[]=[];for(const c of s.replace(/=+$/,'').toUpperCase()){const n=alphabet.indexOf(c);if(n<0)throw Error('Invalid secret');value=(value<<5)|n;bits+=5;if(bits>=8){out.push((value>>>(bits-=8))&255);}}return Buffer.from(out);}
export const newTotpSecret=()=>base32(randomBytes(20));
export function totp(secret:string,at=Date.now()){const counter=BigInt(Math.floor(at/30000));const b=Buffer.alloc(8);b.writeBigUInt64BE(counter);const mac=createHmac('sha1',decode(secret)).update(b).digest();const offset=mac[19]&15;return String((mac.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');}
export function verifyTotp(secret:string,code:string,at=Date.now()){if(!/^\d{6}$/.test(code))return false;const given=Buffer.from(code);for(const shift of [-30000,0,30000]){if(timingSafeEqual(given,Buffer.from(totp(secret,at+shift))))return true;}return false;}
