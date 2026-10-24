import {AsyncLocalStorage} from 'node:async_hooks';
const requests=new AsyncLocalStorage<{token:string}>();
export function lightfernToken(){return requests.getStore()?.token??null;}
export function withLightfernToken<T>(token:string,fn:()=>Promise<T>){return requests.run({token},fn);}
export function bridgeOriginAllowed(request:Request){const origin=request.headers.get('origin');return !origin||origin==='null'||origin===new URL(request.url).origin;}
export function bearerToken(request:Request){const value=request.headers.get('authorization')??'';const match=/^Bearer ([^\s]+)$/i.exec(value);return match?.[1]??null;}
