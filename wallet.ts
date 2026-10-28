import { Router } from 'express';
import { db } from './db.js';
import { requireSession } from './session.js';
const router=Router();
router.get('/overview',requireSession,async(_req,res)=>{
 try {
  const user=await db.user.findUnique({where:{id:res.locals.userId},select:{id:true,fullName:true,kycStatus:true,status:true}});
  if(!user){res.status(404).json({error:'Account unavailable.'});return;}
  const wallet=await db.wallet.findUnique({where:{userId:user.id},select:{walletId:true,balanceMinor:true}});
  if(!wallet){res.status(409).json({error:'Wallet setup incomplete. Contact support.'});return;}
  res.set('Cache-Control','no-store');
  res.json({fullName:user.fullName,kycStatus:user.kycStatus,accountStatus:user.status,walletId:wallet.walletId,availableMinor:wallet.balanceMinor.toString(),currency:'R-Coin',cashValue:false,sendEnabled:user.kycStatus==='APPROVED'&&user.status==='ACTIVE'});
 }catch{res.status(503).json({error:'Wallet overview temporarily unavailable.'});}
});
export default router;
