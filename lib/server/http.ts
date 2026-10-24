import 'server-only';
import { NextResponse } from 'next/server';
import {lightfernToken} from './lightfern-context';
import { ZodError } from 'zod';
import { WorkflowError } from '../platform/engine';
export function sameOrigin(request:Request){if(lightfernToken())return;const origin=request.headers.get('origin');if(origin && origin!==new URL(request.url).origin) throw new WorkflowError('Cross-origin requests are not allowed.',403);}
export async function body(request:Request){sameOrigin(request);const content=await request.text();if(content.length>1_500_000) throw new WorkflowError('Request is too large.',413);try{return JSON.parse(content);}catch{throw new WorkflowError('Invalid JSON.');}}
export async function handle(fn:()=>Promise<unknown>){try{const result=await fn();return result instanceof Response?result:NextResponse.json(result,{headers:{'Cache-Control':'no-store'}});}catch(e){if(e instanceof ZodError) return NextResponse.json({error:e.issues.map(i=>`${i.path.join('.')}: ${i.message}`).slice(0,5).join('; ')},{status:400});if(e instanceof WorkflowError)return NextResponse.json({error:e.message},{status:e.status});console.error('FinanceFlow request failed',e instanceof Error?e.name:'Unknown error');return NextResponse.json({error:'The request failed. Please try again.'},{status:500});}}
