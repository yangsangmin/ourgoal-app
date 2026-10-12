'use strict';
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '../../../..'), label = process.argv[2];
if (!['before','after'].includes(label)) throw Error('label required');
const outputDir = path.join(__dirname, 'browser', label); fs.mkdirSync(path.join(outputDir,'tools'),{recursive:true});
fs.copyFileSync(path.join(root,'reports/TASK-ES-694/repro/tools/h.cjs'),path.join(outputDir,'tools/h.cjs'));
const h = require(path.join(outputDir,'tools/h.cjs'));
function call(which, uid) {
  return (async function() {
    var L=window.OurgoalAppScope.scope,P=L.state.profile,put=Storage.prototype.setItem,get=Storage.prototype.getItem;
    var b='ourgoal_records_backup_'+uid;
    var rich={id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',type:'note',text:'server-text',photo:'unique-photo',feedback:'visible-feedback',energy:60,focus:40};
    P.records=[{id:rich.id,type:'note',text:rich.text}];P.goals=[];P.settings=P.settings||{};
    ['ourgoal_records_prev_','ourgoal_records_kept_','ourgoal_goals_prev_','ourgoal_goals_kept_'].forEach(function(prefix){localStorage.removeItem(prefix+uid);});
    put.call(localStorage,b,JSON.stringify([rich]));put.call(localStorage,'ourgoal_goals_backup_'+uid,'[]');
    var inputBefore=JSON.stringify(P.records),before=get.call(localStorage,b),fetchOriginal=window.fetch,api=[],result;
    try {
      if(which==='syncServerRecords'){
        window.fetch=function(url,options){if(String(url).indexOf('/api/track')===0){var body=JSON.parse(options.body);api.push({action:body.action,userId:body.userId,keys:Object.keys(body).sort()});return Promise.resolve({ok:true,json:function(){return Promise.resolve({ok:true,targetUserId:uid,records:[{id:rich.id,type:'note',text:rich.text,category:'exercise'}],goals:[]});}});}return fetchOriginal.apply(this,arguments);};
        result=await window.OurgoalUiHelpers.syncServerRecords(true);
      } else {
        put.call(localStorage,'ourgoal_guest_profile',JSON.stringify({id:'guest_backup_only',settings:{},goals:[],records:[{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',type:'note',text:'guest-text'}]}));
        result=await window.OurgoalSettingsKit.migrateGuestDataToUser(uid,P);
      }
    } finally {window.fetch=fetchOriginal;}
    var raw=get.call(localStorage,b),backup=JSON.parse(raw).find(function(r){return r.id===rich.id;}),screen=P.records.find(function(r){return r.id===rich.id;});
    return {which,result,inputBefore,backupBefore:JSON.parse(before),backupAfter:JSON.parse(raw),screenRecord:screen,photoInBackup:backup.photo||null,feedbackInBackup:backup.feedback||null,energyInBackup:backup.energy,focusInBackup:backup.focus,photoOnScreen:!!screen.photo,feedbackOnScreen:!!screen.feedback,api};
  })();
}
(async()=>{
  const output={label,tree:h.WT,scope:'actual app in isolated Chrome; direct product calls; fake session/response; operating requests 0; not UI click E2E',scenarios:[]};
  for(const which of ['syncServerRecords','migrateGuestDataToUser']){
    let H;
    try {
      H=await h.open();H.S.tables.users=[h.userRow()];H.S.tables.checkins=h.oldRows(2);await H.nav();const entered=!!(await H.waitEntered(25000));await H.sleep(2000);H.S.setMode({'rest.write':'500'});const since=H.S.seq;
      const result=JSON.parse(await H.ev('('+call.toString()+')('+JSON.stringify(which)+','+JSON.stringify(h.UID)+').then(function(x){return JSON.stringify(x);})'));
      result.entered=entered;result.requests=H.reqsSince(since).map(r=>({method:r.method,table:r.table,rows:r.rows||null,keys:r.keys||null}));result.exceptions=H.exc;result.console=H.con;result.chrome=H.chrome;output.scenarios.push(result);
    }catch(e){output.scenarios.push({which,error:String(e.stack||e)});}finally{if(H)await H.close();}
  }
  fs.writeFileSync(path.join(outputDir,'results.json'),JSON.stringify(output,null,2)+'\n','utf8');
  console.log(JSON.stringify({label,scenarios:output.scenarios.map(x=>({which:x.which,error:x.error||null,photo:x.photoInBackup,feedback:x.feedbackInBackup,energy:x.energyInBackup,focus:x.focusInBackup,photoOnScreen:x.photoOnScreen,result:x.result,entered:x.entered}))}));process.exitCode=output.scenarios.some(x=>x.error)?1:0;
})();
