#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const directory=path.join(__dirname,'publisher-integration-tests');
const tests=fs.readdirSync(directory).filter(name=>name.endsWith('.test.js')).sort().map(name=>path.join(directory,name));
if(!tests.length)throw new Error('No publisher integration tests found');
const result=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit',shell:false});
if(result.error){console.error(result.error.message);process.exitCode=1;}else process.exitCode=result.status===null?1:result.status;
