import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
import {configuration,requireUser,adminClient} from '@/lib/server/supabase';
import {handle} from '@/lib/server/http';
import {WorkflowError} from '@/lib/platform/engine';
import {bearerToken,bridgeOriginAllowed,withLightfernToken} from '@/lib/server/lightfern-context';
import * as bootstrap from '../../bootstrap/route';
import * as templates from '../../templates/route';
import * as instances from '../../instances/route';
import * as transition from '../../transition/route';
import * as documents from '../../documents/route';
import * as members from '../../members/route';
import * as invitations from '../../invitations/route';
import * as proposals from '../../proposals/route';
import * as assistant from '../../assistant/route';
export const runtime='nodejs';
export const maxDuration=60;
type Handler=(request:Request)=>Promise<Response>;
const routes:Record<string,{GET?:Handler;POST?:Handler}>={bootstrap,templates,instances,transition,documents,members,invitations,proposals,assistant};
function cors(response:Response){
 response.headers.set('Access-Control-Allow-Origin','null');
 response.headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
 response.headers.set('Access-Control-Allow-Headers','Authorization, Content-Type');
 response.headers.set('Access-Control-Max-Age','600');
 response.headers.set('Cache-Control','no-store');
 response.headers.append('Vary','Origin');
 return response;
}
export function OPTIONS(request:Request){return bridgeOriginAllowed(request)?cors(new Response(null,{status:204})):new Response(null,{status:403});}
const authInput=z.discriminatedUnion('action',[
 z.object({action:z.enum(['signin','signup']),email:z.string().email(),password:z.string().min(10).max(200)}),
 z.object({action:z.literal('refresh'),refreshToken:z.string().min(1).max(4096)}),
 z.object({action:z.literal('signout')})
]);
async function auth(request:Request){
 if(!configuration().workspace)throw new WorkflowError('Supabase is not configured on the existing server.',503);
 const text=await request.text();if(text.length>10000)throw new WorkflowError('Request is too large.',413);
 let input;try{input=authInput.parse(JSON.parse(text));}catch(e){if(e instanceof SyntaxError)throw new WorkflowError('Invalid JSON.');throw e;}
 const client=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 if(input.action==='signout'){
  const token=bearerToken(request);if(!token)throw new WorkflowError('Sign in first.',401);
  await withLightfernToken(token,()=>requireUser());
  const {error}=await adminClient().auth.admin.signOut(token,'local');if(error)throw new WorkflowError('Could not sign out.');
  return NextResponse.json({ok:true});
 }
 const result=input.action==='refresh'?await client.auth.refreshSession({refresh_token:input.refreshToken}):input.action==='signup'?await client.auth.signUp({email:input.email,password:input.password,options:{emailRedirectTo:new URL('/auth/confirm',request.url).href}}):await client.auth.signInWithPassword({email:input.email,password:input.password});
 if(result.error)throw new WorkflowError(result.error.message,400);
 const session=result.data.session;
 return NextResponse.json({ok:true,confirmationRequired:!session,session:session?{access_token:session.access_token,refresh_token:session.refresh_token,expires_at:session.expires_at}:null});
}
async function dispatch(request:Request,context:{params:Promise<{endpoint:string}>}){
 if(!bridgeOriginAllowed(request))return NextResponse.json({error:'Cross-origin request denied.'},{status:403});
 const response=await handle(async()=>{
  const {endpoint}=await context.params;
  if(endpoint==='auth'){if(request.method!=='POST')throw new WorkflowError('Method not allowed.',405);return auth(request);}
  const route=routes[endpoint],handler=route?.[request.method as 'GET'|'POST'];if(!handler)throw new WorkflowError('Route not found.',404);
  const token=bearerToken(request);
  if(endpoint==='bootstrap'&&request.method==='GET'&&!token)return NextResponse.json({bridge:true,config:configuration(),user:null,workspaces:[]});
  if(!token)throw new WorkflowError('Sign in to use your private workspace.',401);
  return withLightfernToken(token,async()=>{
   await requireUser();
   const result=await handler(request);
   if(endpoint==='bootstrap'&&result.ok){const value=await result.json();return NextResponse.json({...value,bridge:true});}
   return result;
  });
 });
 return cors(response);
}
export const GET=dispatch;
export const POST=dispatch;
