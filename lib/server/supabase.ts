import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import {lightfernToken} from './lightfern-context';
import { Actor } from '../platform/schema';
import { WorkflowError } from '../platform/engine';
export function configuration() {return {workspace:Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY),ai:Boolean(process.env.OPENAI_API_KEY),model:process.env.OPENAI_MODEL || 'gpt-4.1-mini'};}
export async function userClient() {
 if(!configuration().workspace) throw new WorkflowError('Workspace services are not configured. Set the Supabase environment variables and apply the migration. Demo mode remains available.',503);
 const token=lightfernToken();if(token)return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{global:{headers:{Authorization:'Bearer '+token}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
 const jar=await cookies();
 return createServerClient(process.env.SUPABASE_URL!,process.env.SUPABASE_ANON_KEY!,{cookies:{getAll:()=>jar.getAll(),setAll:(items)=>items.forEach(({name,value,options})=>jar.set(name,value,{...options,httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production'}))}});
}
export function adminClient() {if(!configuration().workspace) throw new WorkflowError('Supabase is not configured.',503);return createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});}
export async function requireUser(){const client=await userClient();const {data,error}=await client.auth.getUser(lightfernToken()??undefined);if(error||!data.user) throw new WorkflowError('Sign in to use your private workspace.',401);return {client,user:data.user};}
export async function context(workspaceId:string){
 const {client,user}=await requireUser();const {data:member,error}=await client.from('workspace_members').select('*').eq('workspace_id',workspaceId).eq('user_id',user.id).single();
 if(error||!member) throw new WorkflowError('Workspace not found or access denied.',403);
 const actor:Actor={id:user.id,name:user.email ?? 'Member',workspaceId,roles:member.roles,admin:member.is_admin};return {client,user,actor};
}
export function dbError(error:{message:string}|null){if(error) throw new WorkflowError(error.message.includes('VERSION_CONFLICT')?'This workflow changed. Refresh before trying again.':'The database operation failed. Check the migration and try again.',error.message.includes('VERSION_CONFLICT')?409:500);}
