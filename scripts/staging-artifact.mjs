#!/usr/bin/env node
// Create or verify a source-bound staging artifact. This command never uploads or deploys.
import fs from 'node:fs';
import path from 'node:path';
import { preparePackage, verifyPackage, requireThat } from './lib/staging-artifact.mjs';

function parse(argv) {
  const mode=argv.shift(); requireThat(['prepare','verify'].includes(mode),'Usage: staging-artifact.mjs prepare|verify --source <40-char-SHA> --output <package> [--input <dist>|--from-git] [--manifest-sha256 <SHA256>] [--github-output]');
  const options={mode};
  while(argv.length) {
    const flag=argv.shift(); requireThat(['--source','--input','--output','--manifest-sha256','--from-git','--github-output'].includes(flag),'Unknown argument: '+flag);
    const key=flag.slice(2); requireThat(!(key in options),'Duplicate argument: '+flag);
    if(['from-git','github-output'].includes(key))options[key]=true;
    else { const value=argv.shift(); requireThat(value && !value.startsWith('--'),'Missing argument: '+flag); options[key]=value; }
  }
  requireThat(options.source && options.output,'Explicit source and package output are required');
  if(mode==='verify')requireThat(!options.input && !options['from-git'] && !options['github-output'],'Verification cannot copy, recover or publish outputs');
  else requireThat(!options['manifest-sha256'],'Preparation computes, never accepts, the manifest digest');
  return options;
}
try {
  const args=parse(process.argv.slice(2));
  const options={revision:args.source,output:path.resolve(args.output),input:args.input && path.resolve(args.input),fromGit:args['from-git']===true,manifestSha256:args['manifest-sha256']};
  if(args['github-output'])requireThat(process.env.GITHUB_ACTIONS==='true' && process.env.GITHUB_REPOSITORY==='Matthew75x/toadal-feast-web' && process.env.GITHUB_OUTPUT && process.env.GITHUB_SHA===args.source && process.env.GITHUB_REF==='refs/heads/staging/live-visual','Runner source/ref/output does not match this staging-only package');
  const result=args.mode==='prepare'?preparePackage(options):verifyPackage(options);
  if(args.mode==='prepare')verifyPackage({...options,manifestSha256:result.manifestSha256});
  if(args['github-output']) {
    requireThat(process.env.GITHUB_ACTIONS==='true' && process.env.GITHUB_OUTPUT,'GitHub outputs require the real runner output file');
    requireThat(process.env.GITHUB_SHA===args.source && process.env.GITHUB_REF==='refs/heads/staging/live-visual','Runner source/ref does not match staging package');
    fs.appendFileSync(process.env.GITHUB_OUTPUT,'payload='+result.payload+'\nmanifest_sha256='+result.manifestSha256+'\nsource_commit='+args.source+'\n');
  }
  console.log(JSON.stringify(result,null,2));
} catch(error) { console.error(JSON.stringify({status:'STAGING_ARTIFACT_REFUSED',message:String(error.message||error),deployPerformed:false})); process.exitCode=1; }
