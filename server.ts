import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { z } from 'zod';
import authRouter from './auth.js';
import mpinRouter from './mpin.js';
import walletRouter from './wallet.js';
import creditRequestsRouter from './credit-requests.js';
import adminCreditRouter from './admin-credit.js';
import { Prisma } from '@prisma/client';
import { db } from './db.js';
import argon2 from 'argon2';
import nodemailer from 'nodemailer';
import { randomInt, randomUUID, createHmac, timingSafeEqual } from 'node:crypto';
const app=express();
app.disable('x-powered-by');app.use(helmet());app.use(cors({origin:process.env.WEB_ORIGIN ?? 'http://localhost:5173',credentials:true}));app.use(express.json({limit:'16kb'}));
const schema=z.object({fullName:z.string().trim().min(2).max(100),email:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),mobile:z.string().regex(/^\+[1-9]\d{7,14}$/),country:z.string().trim().min(2).max(80),dateOfBirth:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),password:z.string().min(12).max(128),confirmPassword:z.string()}).refine(v=>v.password===v.confirmPassword,{path:['confirmPassword'],message:'Passwords do not match'});
const emailReady=()=>Boolean(process.env.SMTP_HOST&&process.env.SMTP_USER&&process.env.SMTP_PASSWORD&&process.env.SMTP_FROM&&process.env.OTP_PEPPER&&process.env.OTP_PEPPER.length>=32);
const digest=(email:string,code:string)=>createHmac('sha256',process.env.OTP_PEPPER!).update(email+':'+code).digest('hex');
const generic='If the account is eligible, a verification email will be sent.';
const mailer=()=>nodemailer.createTransport({host:process.env.SMTP_HOST!,port:Number(process.env.SMTP_PORT??587),secure:Number(process.env.SMTP_PORT??587)===465,auth:{user:process.env.SMTP_USER!,pass:process.env.SMTP_PASSWORD!}});
// In-memory development limiter; production must use shared Redis counters.
const windows=new Map<string,{count:number,until:number}>();
function limit(key:string,max:number,periodMs:number){const now=Date.now(),v=windows.get(key);if(!v||v.until<=now){windows.set(key,{count:1,until:now+periodMs});return true;}if(v.count>=max)return false;v.count++;return true;}
app.use('/auth',(req,res,next)=>{if(!limit('auth:'+req.ip,15,15*60*1000)){res.status(429).json({error:'Too many requests. Try again later.'});return;}next();});
app.use('/support',(req,res,next)=>{if(!limit('support:'+req.ip,3,60*60*1000)){res.status(429).json({error:'Support request limit reached. Try again later.'});return;}next();});
app.use('/auth',authRouter);
app.use('/mpin',mpinRouter);
app.use('/wallet',walletRouter);
app.use('/credit-requests',creditRequestsRouter);
app.use('/admin/credits',adminCreditRouter);
app.get('/health' ,(_req,res)=>res.json({status:'ok',mode:'closed-test',emailConfigured:emailReady()}));
app.post('/auth/register',async(req,res)=>{
 const v=schema.safeParse(req.body);if(!v.success){res.status(400).json({error:'Invalid registration details',details:v.error.flatten().fieldErrors});return;}
 if(!emailReady()){res.status(503).json({error:'Registration unavailable: email delivery is not configured.'});return;}
 const x=v.data, date=new Date(x.dateOfBirth+'T00:00:00.000Z');if(Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==x.dateOfBirth||date>new Date()){res.status(400).json({error:'Invalid date of birth'});return;}
 try{
 const existing=await db.user.findFirst({where:{OR:[{email:x.email},{mobile:x.mobile}]}});
 if(existing){res.status(202).json({message:generic});return;}
 const passwordHash=await argon2.hash(x.password,{type:argon2.argon2id});
 const code=String(randomInt(0,1000000)).padStart(6,'0');
 // Persist before sending; no success is claimed if delivery fails.
 await db.$transaction(async tx=>{
  await tx.user.create({data:{fullName:x.fullName,email:x.email,mobile:x.mobile,country:x.country,dateOfBirth:date,passwordHash}});
  await tx.emailChallenge.create({data:{email:x.email,codeHash:digest(x.email,code),expiresAt:new Date(Date.now()+10*60*1000)}});
 });
 try{await mailer().sendMail({from:process.env.SMTP_FROM,to:x.email,subject:'Verify your R-Coin email',text:`Your R-Coin verification code is ${code}. It expires in 10 minutes. Do not share this code.`});}
 catch(e){console.error('Email delivery failed');res.status(503).json({error:'Verification delivery unavailable. Contact support.'});return;}
 res.status(202).json({message:generic});
 }catch(e){console.error('Registration request failed');res.status(202).json({message:generic});}
});
app.post('/auth/verify-email',async(req,res)=>{
 const v=z.object({email:z.string().email().transform(x=>x.toLowerCase()),code:z.string().regex(/^\d{6}$/)}).safeParse(req.body);
 if(!v.success){res.status(400).json({error:'Invalid verification details'});return;}
 const {email,code}=v.data;
 try{
  const outcome=await db.$transaction(async tx=>{
   const c=await tx.emailChallenge.findUnique({where:{email}});
   if(!c||c.expiresAt.getTime()<Date.now()||c.attempts>=5)return false;
   const actual=Buffer.from(digest(email,code),'hex'),expected=Buffer.from(c.codeHash,'hex');
   if(actual.length!==expected.length||!timingSafeEqual(actual,expected)){
    await tx.emailChallenge.updateMany({where:{email,attempts:{lt:5},expiresAt:{gt:new Date()}},data:{attempts:{increment:1}}});return false;
   }
   const user=await tx.user.findUnique({where:{email}});if(!user||user.emailVerifiedAt)return false;
   const claimed=await tx.user.updateMany({where:{id:user.id,emailVerifiedAt:null,status:'EMAIL_PENDING'},data:{emailVerifiedAt:new Date(),status:'ACTIVE'}});
   if(claimed.count!==1)return false;
   const wallet=await tx.wallet.create({data:{userId:user.id,walletId:'RC-'+randomUUID()}});
   await tx.ledgerAccount.create({data:{kind:'USER_WALLET',walletId:wallet.id}});
   await tx.emailChallenge.delete({where:{email}});return true;
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,maxWait:5000,timeout:10000});
  res.status(outcome?200:400).json(outcome?{message:'Email verified. Your wallet is ready; sending requires KYC approval.'}:{error:'Invalid or expired verification code.'});
 }catch(e){console.error('Verification failed');res.status(500).json({error:'Verification unavailable. Please try again.'});}
});
const ticketSchema=z.object({name:z.string().trim().min(2).max(100),contactEmail:z.string().trim().email().max(254).transform(v=>v.toLowerCase()),category:z.enum(['REGISTRATION_HELP','LOGIN_PROBLEM','REPORT_BUG','SUGGEST_IDEA','OTHER']),message:z.string().trim().min(10).max(4000),website:z.string().max(0).optional()});
app.post('/support/tickets',async(req,res)=>{
 const v=ticketSchema.safeParse(req.body);if(!v.success){res.status(400).json({error:'Please check your support request.'});return;}
 try{const ticket=await db.supportTicket.create({data:{name:v.data.name,contactEmail:v.data.contactEmail,category:v.data.category,message:v.data.message,trackingCode:'RCT-'+randomUUID()}});res.status(201).json({message:'Your request was submitted.',trackingCode:ticket.trackingCode});}
 catch{res.status(503).json({error:'Support is temporarily unavailable.'});}
});
// Do not expose public ticket lookup without contact verification.
app.use((_req,res)=>res.status(404).json({error:'Not found'}));
app.listen(Number(process.env.PORT??4000),()=>console.log('R-Coin API ready'));
