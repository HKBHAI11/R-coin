import { Router } from 'express';
import { db } from './db.js';
import argon2 from 'argon2';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { z } from 'zod';
import { newTotpSecret, verifyTotp } from './totp.js';
import { requireTrustedOrigin, sessionToken, tokenHash } from './session.js';
const router=Router();
const secretKey=()=>{const key=Buffer.from(process.env.TOTP_ENCRYPTION_KEY??'','hex');if(key.length!==32)throw Error('TOTP_ENCRYPTION_KEY must be 32-byte hex');return key;};
function encrypt(s:string){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',secretKey(),iv);const data=Buffer.concat([cipher.update(s,'utf8'),cipher.final()]);return [iv,cipher.getAuthTag(),data].map(x=>x.toString('hex')).join(':');}
function decrypt(s:string){const [iv,tag,data]=s.split(':').map(x=>Buffer.from(x,'hex'));const d=createDecipheriv('aes-256-gcm',secretKey(),iv);d.setAuthTag(tag);return Buffer.concat([d.update(data),d.final()]).toString('utf8');}
const credentials=z.object({email:z.string().email().transform(x=>x.trim().toLowerCase()),password:z.string().min(1),deviceLabel:z.string().trim().min(1).max(100).default('Personal device')});
const codeSchema=credentials.extend({code:z.string().regex(/^\d{6}$/)});
const generic='Invalid credentials or additional verification required.';
router.post('/totp/setup',async(req,res)=>{
 const v=credentials.safeParse(req.body);if(!v.success){res.status(400).json({error:'Invalid input'});return;}
 try{const user=await db.user.findUnique({where:{email:v.data.email}});
 if(!user||!user.emailVerifiedAt||user.status!=='ACTIVE'||!await argon2.verify(user.passwordHash,v.data.password)){res.status(401).json({error:generic});return;}
 if(user.totpSecret){res.status(409).json({error:'Authenticator is already configured.'});return;}
 const secret=newTotpSecret();const claimed=await db.user.updateMany({where:{id:user.id,totpSecret:null,totpPendingSecret:null},data:{totpPendingSecret:encrypt(secret)}});if(claimed.count!==1){res.status(409).json({error:'Authenticator setup already pending or configured.'});return;}
 res.json({secret,otpauthUri:`otpauth://totp/R-Coin:${encodeURIComponent(user.email)}?secret=${secret}&issuer=R-Coin&algorithm=SHA1&digits=6&period=30`,message:'Add this account to your authenticator, then confirm with a six-digit code. Never share the secret.'});
 }catch{res.status(503).json({error:'Authenticator setup unavailable.'});}
});
router.post('/totp/confirm',async(req,res)=>{
 const v=codeSchema.safeParse(req.body);if(!v.success){res.status(400).json({error:'Invalid input'});return;}
 try{const u=await db.user.findUnique({where:{email:v.data.email}});
 if(!u||!u.emailVerifiedAt||u.status!=='ACTIVE'||!u.totpPendingSecret||u.totpSecret||!await argon2.verify(u.passwordHash,v.data.password)||!verifyTotp(decrypt(u.totpPendingSecret),v.data.code)){res.status(401).json({error:generic});return;}
 const claimed=await db.user.updateMany({where:{id:u.id,status:'ACTIVE',emailVerifiedAt:{not:null},totpSecret:null,totpPendingSecret:u.totpPendingSecret},data:{totpSecret:u.totpPendingSecret,totpPendingSecret:null}});if(claimed.count!==1){res.status(409).json({error:'Authenticator setup changed. Restart confirmation.'});return;}
 res.json({message:'Authenticator enabled. You can now sign in.'});
 }catch{res.status(503).json({error:'Authenticator confirmation unavailable.'});}
});
router.post('/login',async(req,res)=>{
 const v=codeSchema.safeParse(req.body);if(!v.success){res.status(400).json({error:'Invalid input'});return;}
 try{const u=await db.user.findUnique({where:{email:v.data.email}});
 if(!u||!u.emailVerifiedAt||u.status!=='ACTIVE'||!u.totpSecret||!await argon2.verify(u.passwordHash,v.data.password)||!verifyTotp(decrypt(u.totpSecret),v.data.code)){res.status(401).json({error:generic});return;}
 const token=randomBytes(32).toString('hex');
 await db.$transaction(async tx=>{await tx.authSession.updateMany({where:{userId:u.id,revokedAt:null},data:{revokedAt:new Date()}});await tx.authSession.create({data:{userId:u.id,tokenHash:tokenHash(token),deviceLabel:v.data.deviceLabel,expiresAt:new Date(Date.now()+7*86400000)}});});
 res.cookie('rc_session',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:7*86400000});
 res.json({message:'Signed in.',user:{id:u.id,fullName:u.fullName,kycStatus:u.kycStatus}});
 }catch{res.status(503).json({error:'Sign-in unavailable.'});}
});
router.get('/me',async(req,res)=>{const token=sessionToken(req);if(!token){res.status(401).json({error:'Not authenticated'});return;}try{const s=await db.authSession.findUnique({where:{tokenHash:tokenHash(token)},include:{user:true}});if(!s||s.revokedAt||s.expiresAt<=new Date()||s.user.status!=='ACTIVE'){res.status(401).json({error:'Session expired'});return;}res.json({id:s.user.id,fullName:s.user.fullName,email:s.user.email,kycStatus:s.user.kycStatus});}catch{res.status(503).json({error:'Session validation unavailable.'});}});
router.post('/logout',requireTrustedOrigin,async(req,res)=>{const token=sessionToken(req);if(token)await db.authSession.updateMany({where:{tokenHash:tokenHash(token)},data:{revokedAt:new Date()}});res.clearCookie('rc_session',{path:'/',sameSite:'strict',secure:process.env.NODE_ENV==='production'});res.json({message:'Signed out.'});});
export default router;
