import test from 'node:test';
import assert from 'node:assert/strict';
import {bearerToken,bridgeOriginAllowed,lightfernToken,withLightfernToken} from '../lib/server/lightfern-context';
test('Lightfern bridge accepts opaque-origin clients, rejects unrelated origins and requires explicit bearer syntax',()=>{
 assert.equal(bridgeOriginAllowed(new Request('https://finance.example/api/lightfern/bootstrap',{headers:{origin:'null'}})),true);
 assert.equal(bridgeOriginAllowed(new Request('https://finance.example/api/lightfern/bootstrap',{headers:{origin:'https://evil.example'}})),false);
 assert.equal(bearerToken(new Request('https://finance.example',{headers:{authorization:'Bearer account-a'}})),'account-a');
 assert.equal(bearerToken(new Request('https://finance.example',{headers:{authorization:'bEaReR session-token.signed'}})),'session-token.signed');
 assert.equal(bearerToken(new Request('https://finance.example',{headers:{cookie:'session=account-a'}})),null);
 assert.equal(bearerToken(new Request('https://finance.example',{headers:{authorization:'Bearer account-a injected'}})),null);
 assert.equal(bearerToken(new Request('https://finance.example',{headers:{authorization:'Bearer account-a\tinjected'}})),null);
 assert.equal(bearerToken(new Request('https://finance.example',{headers:{authorization:'Basic account-a'}})),null);
});
test('Lightfern authentication context stays isolated across concurrent requests and cannot leak into cookie sessions',async()=>{
 assert.equal(lightfernToken(),null);
 const values=await Promise.all(['account-a','account-b'].map(token=>withLightfernToken(token,async()=>{
  await new Promise(resolve=>setTimeout(resolve,token==='account-a'?10:1));
  assert.equal(lightfernToken(),token);
  return lightfernToken();
 })));
 assert.deepEqual(values,['account-a','account-b']);
 assert.equal(lightfernToken(),null);
 await assert.rejects(withLightfernToken('failed-account',async()=>{throw new Error('failed');}),/failed/);
 assert.equal(lightfernToken(),null);
});
