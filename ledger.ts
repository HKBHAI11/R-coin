import { Prisma, PrismaClient } from '@prisma/client';

/** Closed-test accounting only. Invoke after authenticated authorization, KYC, MPIN and limits checks. */
export function parsePositiveMinorUnits(input: unknown): bigint {
  if (typeof input !== 'string' || !/^[1-9][0-9]{0,14}$/.test(input)) throw new Error('Invalid amount');
  return BigInt(input);
}

export function assertBalanced(entries: readonly bigint[]): void {
  if (entries.length < 2 || entries.some(v => v === 0n) || entries.reduce((a,b)=>a+b,0n)!==0n) {
    throw new Error('Unbalanced journal');
  }
}

/** Idempotent transfer; caller must use a stable unique request key, never a new key on retry. */
export async function postClosedTestTransfer(db: PrismaClient, args: {
  senderUserId: string; recipientUserId: string; amountMinor: bigint; idempotencyKey: string;
}) {
  if (args.senderUserId === args.recipientUserId) throw new Error('Self-transfer is not allowed');
  if (args.amountMinor <= 0n || args.amountMinor > 999999999999999n) throw new Error('Invalid amount');
  if (!/^[a-zA-Z0-9_-]{16,128}$/.test(args.idempotencyKey)) throw new Error('Invalid idempotency key');
  return db.$transaction(async tx => {
    const existing = await tx.ledgerTransaction.findUnique({where:{idempotencyKey:args.idempotencyKey}});
    if (existing) {
      if (existing.kind!=='TRANSFER' || existing.initiatedById!==args.senderUserId || existing.referenceId!==`${args.recipientUserId}:${args.amountMinor}`) throw new Error('Idempotency key conflict');
      return {transactionId:existing.id, duplicate:true};
    }
    const users = await tx.user.findMany({where:{id:{in:[args.senderUserId,args.recipientUserId]}},select:{id:true,status:true,kycStatus:true,emailVerifiedAt:true}});
    if (users.length!==2 || users.some(u=>u.status!=='ACTIVE'||!u.emailVerifiedAt)) throw new Error('Account not eligible');
    if (users.find(u=>u.id===args.senderUserId)?.kycStatus!=='APPROVED') throw new Error('Sender KYC approval required');
    const wallets = await tx.wallet.findMany({where:{userId:{in:[args.senderUserId,args.recipientUserId]}}});
    const sender=wallets.find(w=>w.userId===args.senderUserId), recipient=wallets.find(w=>w.userId===args.recipientUserId);
    if (!sender || !recipient) throw new Error('Wallet unavailable');
    // Conditional update serializes debits and prevents a negative balance under concurrent requests.
    const debit=await tx.wallet.updateMany({where:{id:sender.id,balanceMinor:{gte:args.amountMinor}},data:{balanceMinor:{decrement:args.amountMinor}}});
    if (debit.count!==1) throw new Error('Insufficient credits');
    await tx.wallet.update({where:{id:recipient.id},data:{balanceMinor:{increment:args.amountMinor}}});
    const debitAccount=await tx.ledgerAccount.upsert({where:{walletId:sender.id},create:{kind:'USER_WALLET',walletId:sender.id},update:{}});
    const creditAccount=await tx.ledgerAccount.upsert({where:{walletId:recipient.id},create:{kind:'USER_WALLET',walletId:recipient.id},update:{}});
    assertBalanced([-args.amountMinor,args.amountMinor]);
    const posted=await tx.ledgerTransaction.create({data:{kind:'TRANSFER',idempotencyKey:args.idempotencyKey,initiatedById:args.senderUserId,referenceId:`${args.recipientUserId}:${args.amountMinor}`,entries:{create:[{accountId:debitAccount.id,amountMinor:-args.amountMinor},{accountId:creditAccount.id,amountMinor:args.amountMinor}]}}});
    return {transactionId:posted.id,duplicate:false};
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:5000,timeout:10000});
}
