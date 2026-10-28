import { Router } from 'express';
import { z } from 'zod';
import { db } from './db.js';
import { requireSession, requireTrustedOrigin } from './session.js';
import { parsePositiveMinorUnits } from './ledger.js';

// User-facing requests only. Approval/issuance is deliberately not exposed here.
const router = Router();
const requestSchema = z.object({amountMinor:z.string(),note:z.string().trim().max(500).optional()}).strict();
router.post('/',requireSession,requireTrustedOrigin,async(req,res)=>{
 const parsed=requestSchema.safeParse(req.body);
 if(!parsed.success){res.status(400).json({error:'Invalid request.'});return;}
 let amountMinor:bigint;
 try{amountMinor=parsePositiveMinorUnits(parsed.data.amountMinor);}catch{res.status(400).json({error:'Invalid credit amount.'});return;}
 try{
  const userId:string=res.locals.userId;
  const pending=await db.creditRequest.count({where:{userId,status:'PENDING'}});
  if(pending>=3){res.status(429).json({error:'Too many pending requests.'});return;}
  const created=await db.creditRequest.create({data:{userId,amountMinor,note:parsed.data.note||null}});
  res.set('Cache-Control','no-store');res.status(201).json({id:created.id,status:created.status,amountMinor:created.amountMinor.toString(),cashValue:false,message:'Request submitted for review; no credits have been issued.'});
 }catch{res.status(503).json({error:'Request temporarily unavailable.'});}
});
router.get('/mine',requireSession,async(_req,res)=>{
 try{
  const rows=await db.creditRequest.findMany({where:{userId:res.locals.userId},orderBy:{createdAt:'desc'},take:30,select:{id:true,amountMinor:true,note:true,status:true,createdAt:true,reviewedAt:true,reviewNote:true}});
  res.set('Cache-Control','no-store');res.json({cashValue:false,requests:rows.map(r=>({...r,amountMinor:r.amountMinor.toString()}))});
 }catch{res.status(503).json({error:'Request history temporarily unavailable.'});}
});
export default router;
