import { Router } from 'express';
import { db } from './db.js';
import argon2 from 'argon2';
import { z } from 'zod';
import { requireSession,requireTrustedOrigin } from './session.js';
import { verifyTotp } from './totp.js';
import { createDecipheriv } from 'node:crypto';
const router=Router();
function decrypt(s:string){const key=Buffer.from(process.env.TOTP_ENCRYPTION_KEY??'','hex');if(key.length!==32)throw Error('Invalid TOTP key');const [iv,tag,data]=s.split(':').map(x=>Buffer.from(x,'hex'));const d=createDecipheriv('aes-256-gcm',key,iv);d.setAuthTag(tag);return Buffer.concat([d.update(data),d.final()]).toString('utf8');}
const pin=z.string().regex(/^\d{6}$/);
router.use(requireTrustedOrigin,requireSession);
router.post('/setup',async(req,res)=>{
 const v=z.object({password:z.string().min(1),totp:z.string().regex(/^\d{6}$/),mpin:pin,confirmMpin:pin}).safeParse(req.body);
 if(!v.success||v.data.mpin!==v.data.confirmMpin){res.status(400).json({error:'Invalid MPIN setup details.'});return;}
 try{const u=await db.user.findUniqueOrThrow({where:{id:res.locals.userId}});
 if(u.mpinHash){res.status(409).json({error:'MPIN already configured. Use the secure change workflow.'});return;}
 if(!u.totpSecret||!await argon2.verify(u.passwordHash,v.data.password)||!verifyTotp(decrypt(u.totpSecret),v.data.totp)){res.status(401).json({error:'Authentication failed.'});return;}
 const claimed=await db.user.updateMany({where:{id:u.id,mpinHash:null},data:{mpinHash:await argon2.hash(v.data.mpin,{type:argon2.argon2id})}});
 if(claimed.count!==1){res.status(409).json({error:'MPIN already configured.'});return;}
 res.json({message:'MPIN configured.'});
 }catch{res.status(503).json({error:'MPIN setup unavailable.'});}
});
router.post('/verify',async(req,res)=>{
 const v=z.object({mpin:pin}).safeParse(req.body);
 if(!v.success){res.status(400).json({error:'Invalid MPIN.'});return;}
 try{
  // Compare-and-swap the observed failure count and lock state. Two simultaneous
  // incorrect attempts must not overwrite each other or clear an active lock.
  for(let attempt=0;attempt<8;attempt++){
   const u=await db.user.findUniqueOrThrow({where:{id:res.locals.userId}});
   if(!u.mpinHash){res.status(409).json({error:'Set up MPIN first.'});return;}
   if(u.mpinLockedUntil&&u.mpinLockedUntil>new Date()){
    res.status(429).json({error:'MPIN temporarily locked.'});return;
   }
   const valid=await argon2.verify(u.mpinHash,v.data.mpin);
   const failures=u.mpinFailures+1;
   const claimed=await db.user.updateMany({
    where:{id:u.id,mpinHash:u.mpinHash,mpinFailures:u.mpinFailures,mpinLockedUntil:u.mpinLockedUntil},
    data:valid
     ? {mpinFailures:0,mpinLockedUntil:null}
     : {mpinFailures:failures>=5?0:failures,mpinLockedUntil:failures>=5?new Date(Date.now()+15*60000):null}
   });
   if(claimed.count!==1)continue; // State changed: re-read and re-check lock.
   if(!valid){res.status(401).json({error:'Invalid MPIN.'});return;}
   // Verification alone is NOT authorization for a future transfer.
   res.json({message:'MPIN verified.'});return;
  }
  res.status(503).json({error:'MPIN verification is busy. Try again.'});
 }catch{res.status(503).json({error:'MPIN verification unavailable.'});}
});
export default router;
