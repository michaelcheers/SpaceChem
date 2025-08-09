// SpaceChem Playground implementation
const WIDTH=10, HEIGHT=8;
const boardDiv=document.getElementById('board');
const paletteDiv=document.getElementById('palette');
const logEl=document.getElementById('log');
let currentTool=null;

const instructionNames={
  arrowR:'→',arrowL:'←',arrowU:'↑',arrowD:'↓',
  startR:'SR',startB:'SB',grab:'GRAB',drop:'DROP',grabdrop:'G/D',
  bondp:'B+',bondm:'B-',
  inA:'IN A',inB:'IN B',outA:'OUT A',outB:'OUT B',
  sync:'SYNC',swap:'SWAP',sense:'SENSE',flipflop:'FF',
  fuse:'FUSE',split:'SPLIT',rotcw:'ROT↻',rotccw:'ROT↺'
};

const paletteItems=[
  'startR','startB','arrowR','arrowL','arrowU','arrowD','grab','drop','grabdrop','bondp','bondm',
  'inA','inB','outA','outB','sync','swap','sense','flipflop','fuse','split','rotcw','rotccw'
];

paletteItems.forEach(id=>{
  const btn=document.createElement('button');
  btn.textContent=instructionNames[id];
  btn.onclick=()=>{currentTool=id;};
  paletteDiv.appendChild(btn);
});

let instructions=[...Array(WIDTH)].map(()=>Array(HEIGHT).fill(null));
let atoms=[...Array(WIDTH)].map(()=>Array(HEIGHT).fill(null));

function createBoard(){
  boardDiv.innerHTML='';
  for(let y=0;y<HEIGHT;y++){
    for(let x=0;x<WIDTH;x++){
      const cell=document.createElement('div');
      cell.className='cell';
      cell.dataset.x=x;cell.dataset.y=y;
      if(x>=0&&x<=3&&y>=0&&y<=3) cell.classList.add('in-region');
      if(x>=0&&x<=3&&y>=4&&y<=7) cell.classList.add('in-region');
      if(x>=6&&x<=9&&y>=0&&y<=3) cell.classList.add('out-region');
      if(x>=6&&x<=9&&y>=4&&y<=7) cell.classList.add('out-region');
      cell.addEventListener('click',()=>{
        if(currentTool==='startR'){red.start={x,y,dir:'right'};instructions[x][y]='startR';}
        else if(currentTool==='startB'){blue.start={x,y,dir:'right'};instructions[x][y]='startB';}
        else{
          instructions[x][y]=currentTool;
        }
        render();
      });
      boardDiv.appendChild(cell);
    }
  }
}

function render(){
  for(let y=0;y<HEIGHT;y++){
    for(let x=0;x<WIDTH;x++){
      const idx=y*WIDTH+x;
      const cell=boardDiv.children[idx];
      cell.textContent='';
      const instr=instructions[x][y];
      if(instr){cell.textContent=instructionNames[instr]||'';}
      if(atoms[x][y]){cell.textContent=(atoms[x][y].type);}
      if(red.x===x&&red.y===y){const w=document.createElement('div');w.className='waldo red';cell.appendChild(w);} 
      if(blue.x===x&&blue.y===y){const w=document.createElement('div');w.className='waldo blue';cell.appendChild(w);} 
    }
  }
  logEl.textContent=`outA:${JSON.stringify(outputA)}\noutB:${JSON.stringify(outputB)}`;
}

class Waldo{
  constructor(color){this.color=color;this.start={x:0,y:0,dir:'right'};this.reset();}
  reset(){this.x=this.start.x;this.y=this.start.y;this.dir=this.start.dir;this.holding=null;this.wait=false;this.flip=false;}
  move(){switch(this.dir){case 'right':this.x=(this.x+1)%WIDTH;break;case'left':this.x=(this.x-1+WIDTH)%WIDTH;break;case'up':this.y=(this.y-1+HEIGHT)%HEIGHT;break;case'down':this.y=(this.y+1)%HEIGHT;break;}}
  step(){if(this.wait)return;const instr=instructions[this.x][this.y];
    switch(instr){
      case'arrowR':this.dir='right';this.move();break;
      case'arrowL':this.dir='left';this.move();break;
      case'arrowU':this.dir='up';this.move();break;
      case'arrowD':this.dir='down';this.move();break;
      case'grab':if(!this.holding&&atoms[this.x][this.y]){this.holding=atoms[this.x][this.y];atoms[this.x][this.y]=null;}break;
      case'drop':if(this.holding&&!atoms[this.x][this.y]){atoms[this.x][this.y]=this.holding;this.holding=null;}break;
      case'grabdrop':if(this.holding){if(!atoms[this.x][this.y]){atoms[this.x][this.y]=this.holding;this.holding=null;}} else {if(atoms[this.x][this.y]){this.holding=atoms[this.x][this.y];atoms[this.x][this.y]=null;}}break;
      case'inA':if(!this.holding){let a=inputA.shift();if(a){this.holding={type:a};}}break;
      case'inB':if(!this.holding){let a=inputB.shift();if(a){this.holding={type:a};}}break;
      case'outA':if(this.holding){outputA.push(this.holding.type);this.holding=null;}break;
      case'outB':if(this.holding){outputB.push(this.holding.type);this.holding=null;}break;
      case'sync':this.wait=true;break;
      case'swap':swapAt(this.x,this.y);break;
      case'sense':/*placeholder*/break;
      case'flipflop':this.flip=!this.flip;break;
      case'rotcw':/*placeholder*/break;
      case'rotccw':/*placeholder*/break;
      case'bondp':/*placeholder*/break;
      case'bondm':/*placeholder*/break;
      case'fuse':/*placeholder*/break;
      case'split':/*placeholder*/break;
      default:this.move();break;
    }
  }
}

function swapAt(x,y){
  if(!swapA||!swapB){return;}
  // if waldo executes SWAP anywhere, swap contents of swapper pair
  const tmp=atoms[swapA.x][swapA.y];
  atoms[swapA.x][swapA.y]=atoms[swapB.x][swapB.y];
  atoms[swapB.x][swapB.y]=tmp;
}

const red=new Waldo('red');
const blue=new Waldo('blue');

let inputA=['H','O','H'];
let inputB=['C','C'];
let outputA=[];let outputB=[];
let swapA=null,swapB=null; // not placed via UI in this minimal version

function resetGame(){red.reset();blue.reset();atoms=[...Array(WIDTH)].map(()=>Array(HEIGHT).fill(null));inputA=['H','O','H'];inputB=['C','C'];outputA=[];outputB=[];red.wait=false;blue.wait=false;}

let running=false;let timer=null;
function stepGame(){red.step();blue.step();if(red.wait&&blue.wait){red.wait=false;blue.wait=false;}render();}

document.getElementById('runBtn').onclick=()=>{if(!running){running=true;timer=setInterval(stepGame,500);}else{running=false;clearInterval(timer);}};
document.getElementById('resetBtn').onclick=()=>{resetGame();render();};

createBoard();resetGame();render();
