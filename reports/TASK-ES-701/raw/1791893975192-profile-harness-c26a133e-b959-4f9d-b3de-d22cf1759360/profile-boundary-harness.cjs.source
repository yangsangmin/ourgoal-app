'use strict';
const fs=require('node:fs'),path=require('node:path');
let source=fs.readFileSync(path.join(__dirname,'component-scope2.cjs'),'utf8');
source=source.replace("if(o.profileThrow)throw Error('component profile failure');", "if(o.profileThrow)throw Error('component profile failure');if(o.profileSwap){await Promise.resolve();L.state.profile={id:'another-component-account',settings:{},goals:[],records:[]};}");
source=source.replace("if(['running-default','none-life','automatic-goal-change'].includes(name))return;", "if(name!=='post-profile-account-change')return;");
source=source.replace("await test('profile-failure-after-accepted',{profileThrow:true},submit,a=>success(a)&&a.profileSaves===1);", "await test('post-profile-account-change',{profileSwap:true},submit,a=>a.calls.length===1&&a.closed===0&&a.cache.length===0&&a.profile.id==='another-component-account'&&a.profile.settings.myFeedPosts===undefined);");
source=source.replace("'component-'+mode+'-scope2.json'", "'component-'+mode+'-post-profile-boundary.json'");
fs.writeFileSync(path.join(__dirname,'component-profile-boundary.cjs'),source,{encoding:'utf8',flag:'wx'});
