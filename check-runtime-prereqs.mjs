// Read-only presence checks: no credentials are read or printed.
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const major=Number(process.versions.node.split('.')[0]);
const checks=[['Node 22+',major>=22],['API dependencies',existsSync(resolve(root,'apps/api/node_modules'))],['Web dependencies',existsSync(resolve(root,'apps/web/node_modules'))],['Generated Prisma client',existsSync(resolve(root,'apps/api/node_modules/.prisma/client'))],['API .env present',existsSync(resolve(root,'apps/api/.env'))]];
for(const [name,ok] of checks) console.log(`${ok?'READY':'PENDING'}: ${name}`);
console.log('Presence is not validation: DB, SMTP, builds and security remain unverified.');
if(major<22) process.exitCode=1;
