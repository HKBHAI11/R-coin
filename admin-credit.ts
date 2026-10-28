import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from './db.js';
import { requireSession, requireTrustedOrigin } from './session.js';
import { assertBalanced } from './ledger.js';
const router=Router();
router.use(requireSession, (_req,res,next)=>{if(res.locals.userRole!=='ADMIN'){res.status(403).json({error:'Admin access required.'});return;}next();});
router.get('/requests',async (_req,res)=>{try{const rows=await db.creditRequest.findMany({where:{status:'PENDING'},orderBy:{createdAt:'asc'},take:50,select:{id:true,userId:true,amountMinor:true,note:true,status:true,createdAt:true}});res.set('Cache-Control','no-store');res.json({requests:rows.map(x=>({...x,amountMinor:x.amountMinor.toString()}))});}catch{res.status(503).json({error:'Review queue unavailable.'});}});
const review=z.object({decision:z.enum(['APPROVE','REJECT']),reviewNote:z.string().trim().max(500).optional()}).strict();
router.post('/requests/:id/review',requireTrustedOrigin,async(req,res)=>{
 const parsed=review.safeParse(req.body);if(!parsed.success||!z.string().uuid().safeParse(req.params.id).success){res.status(400).json({error:'Invalid review.'});return;}
 const {decision,reviewNote}=parsed.data,requestId=req.params.id,adminId=res.locals.userId as string;
 try{const result=await db.$transaction(async tx=>{
 const claim=await tx.creditRequest.updateMany({where:{id:requestId,status:'PENDING'},data:{status:decision==='APPROVE'?'APPROVED':'REJECTED',reviewedById:adminId,reviewNote:reviewNote||null,reviewedAt:new Date()}});
 if(claim.count!==1)return null;
 if(decision==='REJECT')return {status:'REJECTED'};
 const request=await tx.creditRequest.findUniqueOrThrow({where:{id:requestId}});
 const user=await tx.user.findUnique({where:{id:request.userId},include:{wallet:true}});
 if(!user||user.status!=='ACTIVE'||!user.emailVerifiedAt||!user.wallet)throw new Error('Recipient not eligible');
 const amount=request.amountMinor;if(amount<=0n||amount>999999999999999n)throw new Error('Invalid amount');
 const wallet=await tx.wallet.update({where:{id:user.wallet.id},data:{balanceMinor:{increment:amount}}});
 const account=await tx.ledgerAccount.upsert({where:{walletId:wallet.id},create:{kind:'USER_WALLET',walletId:wallet.id},update:{}});
 const issuance=await tx.ledgerAccount.upsert({where:{id:'closed-test-issuance'},create:{id:'closed-test-issuance',kind:'ISSUANCE'},update:{}});
 assertBalanced([-amount,amount]);
 const posted=await tx.ledgerTransaction.create({data:{kind:'ADMIN_ISSUE',idempotencyKey:`credit-request-${requestId}`,initiatedById:adminId,referenceId:requestId,entries:{create:[{accountId:issuance.id,amountMinor:-amount},{accountId:account.id,amountMinor:amount}]}}});
 await tx.creditRequest.update({where:{id:requestId},data:{ledgerTransactionId:posted.id}});
 return {status:'APPROVED',transactionId:posted.id};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:5000,timeout:10000});
 if(!result){res.status(409).json({error:'Request already reviewed or unavailable.'});return;}
 res.set('Cache-Control','no-store');res.json({...result,cashValue:false});
 }catch{res.status(503).json({error:'Review unavailable. Check status before retrying.'});}
});
export default router;
