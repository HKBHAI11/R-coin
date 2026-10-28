import { createHash } from 'node:crypto';
import type { Request,Response,NextFunction } from 'express';
import { db } from './db.js';
export const tokenHash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function sessionToken(req:Request){const raw=String(req.headers.cookie??'').split(';').map(x=>x.trim()).find(x=>x.startsWith('rc_session='))?.slice(11);return raw&&/^[a-f0-9]{64}$/.test(raw)?raw:null;}
export async function requireSession(req:Request,res:Response,next:NextFunction){
 const token=sessionToken(req);if(!token){res.status(401).json({error:'Sign in required.'});return;}
 try{const session=await db.authSession.findUnique({where:{tokenHash:tokenHash(token)},include:{user:true}});
 if(!session||session.revokedAt||session.expiresAt<=new Date()||session.user.status!=='ACTIVE'){res.status(401).json({error:'Session expired or unavailable.'});return;}
 res.locals.userId=session.userId;res.locals.sessionId=session.id;res.locals.userRole=session.user.role;next();
 }catch{res.status(503).json({error:'Session validation unavailable.'});}
}
// Strict Origin check for state-changing cookie-authenticated routes. Production also needs proxy/host configuration review.
export function requireTrustedOrigin(req:Request,res:Response,next:NextFunction){
 const expected=process.env.WEB_ORIGIN??'http://localhost:5173';
 if(req.get('origin')!==expected){res.status(403).json({error:'Request origin not permitted.'});return;}next();
}
