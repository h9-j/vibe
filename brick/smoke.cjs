// Minimal runtime check for the canvas game without a browser dependency.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const nodes = new Map();
const node = id => nodes.get(id) || nodes.set(id, {
  classList:{add(){},remove(){}},addEventListener(){},setPointerCapture(){},
  getBoundingClientRect(){return {left:0,width:960};},innerHTML:'',textContent:''
}).get(id);
const gradient = {addColorStop(){}};
const context2d = new Proxy({}, {get(target,key){
  if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>gradient;
  return target[key] ?? (()=>{});
},set(target,key,value){target[key]=value;return true;}});
const sandbox = {
  document:{getElementById:id=>id==='game'?{...node(id),getContext:()=>context2d}:node(id),querySelector:node},
  window:{addEventListener(){},AudioContext:class{}},localStorage:{getItem(){return null;},setItem(){}},
  Image:class{constructor(){this.complete=true;this.naturalWidth=1456;}},
  requestAnimationFrame(){},setTimeout(){return 1;},clearTimeout(){},console,Math
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(`${__dirname}/main.js`,'utf8'),sandbox);
assert.equal(vm.runInContext('phase',sandbox),'menu');
const stageMaps=vm.runInContext('STAGES.map(world=>world.map(stage=>stage.rows))',sandbox);
const invalidRows=stageMaps.flatMap((world,w)=>world.flatMap((rows,s)=>rows.filter(row=>row.length!==11).map(row=>`${w+1}-${s+1}: ${row} (${row.length})`)));
if(invalidRows.length)console.error(invalidRows.join('\n'));
assert.equal(stageMaps.length,5);
for(const [worldIndex,world] of stageMaps.entries()){
  assert.equal(world.length,3,`world ${worldIndex+1} needs three stages`);
  for(const [stageIndex,rows] of world.entries()){
    assert.ok(rows.length>=5);
    for(const row of rows){
      assert.equal(row.length,11,`world ${worldIndex+1} stage ${stageIndex+1}: ${row}`);
      assert.match(row,/^[.NHSB$ICLM]+$/);
    }
  }
}
vm.runInContext('startGame(); launch();',sandbox);
assert.equal(vm.runInContext('phase',sandbox),'playing');
for(let i=0;i<240;i++)vm.runInContext('update(1/120)',sandbox);
vm.runInContext('render(); shiftElement("ice");',sandbox);
assert.equal(vm.runInContext('game.element',sandbox),'ice');
vm.runInContext('offerCards(); chooseCard(game.cardChoices[0].id);',sandbox);
assert.equal(vm.runInContext('phase',sandbox),'playing');
for(let world=0;world<5;world++)for(let stage=0;stage<4;stage++){
  vm.runInContext(`game.world=${world}; game.stage=${stage}; startStage(); render();`,sandbox);
  assert.equal(vm.runInContext('phase',sandbox),'playing');
  assert.ok(vm.runInContext('game.bricks.length',sandbox)>0);
  if(stage===3){
    vm.runInContext('game.bricks.forEach(b=>b.dead=true); game.stageTime=5; game.element="fire"; damageBoss(999);',sandbox);
  }else{
    vm.runInContext('game.bricks.forEach(b=>b.dead=true); update(1/120);',sandbox);
  }
  assert.equal(vm.runInContext('phase',sandbox),'stageclear');
}
assert.equal(vm.runInContext('phase',sandbox),'stageclear');
vm.runInContext('game.world=1; game.stage=1; startStage();',sandbox);
assert.ok(vm.runInContext('game.bricks.some(b=>b.type==="moving")',sandbox));
const movingX=vm.runInContext('game.bricks.find(b=>b.type==="moving").x',sandbox);
vm.runInContext('update(1/120)',sandbox);
assert.notEqual(vm.runInContext('game.bricks.find(b=>b.type==="moving").x',sandbox),movingX);
vm.runInContext('game.world=0; game.stage=3; startStage();',sandbox);
assert.equal(vm.runInContext('bossShielded()',sandbox),true);
vm.runInContext('game.stageTime=5;',sandbox);
assert.equal(vm.runInContext('bossShielded()',sandbox),false);
vm.runInContext('game.boss.attackAt=0; updateBoss(1/120);',sandbox);
assert.ok(vm.runInContext('game.telegraphs.length',sandbox)>0);
vm.runInContext('update(1)',sandbox);
assert.ok(vm.runInContext('game.hazards.length',sandbox)>0);
vm.runInContext('game.world=2; game.stage=3; startStage(); game.element="volt";',sandbox);
const hpBefore=vm.runInContext('game.boss.hp',sandbox);
vm.runInContext('damageBoss(10)',sandbox);
assert.equal(vm.runInContext('game.boss.hp',sandbox),hpBefore);
console.log('Smoke test passed: menu, play, physics, render, shift, cards, all 20 stages');
