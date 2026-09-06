import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// A composed illustration supplies the architecture; the foreground instrument is live 3D.
export function createCourtyard(container, paused) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);
  const world = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
  world.environment = pmrem.fromScene(room, .04).texture; room.dispose(); pmrem.dispose();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 2000);
  camera.position.z = 1000;
  const uniforms = {
    art: { value: null }, uvScale: { value: new THREE.Vector2(1, 1) }, uvOffset: { value: new THREE.Vector2() },
    time: { value: 0 }, warmth: { value: 0 }, night: { value: 0 }, mobile: { value: 0 },
    ripple: { value: new THREE.Vector2(.15, .34) }, rippleAge: { value: 10 }, moving: { value: paused ? 0 : 1 }
  };
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 uvArt;void main(){uvArt=uv;gl_Position=vec4(position.xy,1.,1.);}`,
    fragmentShader: `precision highp float;varying vec2 uvArt;uniform sampler2D art;uniform vec2 uvScale,uvOffset,ripple;uniform float time,warmth,night,mobile,rippleAge,moving;
      void main(){vec2 uv=uvArt*uvScale+uvOffset;vec2 p=uv;
      float bottom=mix(.21+uv.x*.64,.38+uv.x*.29,mobile);float top=mix(.463,.565,mobile);
      float water=smoothstep(bottom,bottom+.018,uv.y)*(1.-smoothstep(top-.012,top,uv.y))*(1.-smoothstep(.35,.43,uv.x));
      float wave=sin(uv.y*420.+time*.75)+sin(uv.x*220.+uv.y*160.-time*.53);
      float d=length((uv-ripple)*vec2(1.,.6));float ring=sin(d*260.-rippleAge*5.)*exp(-pow((d-rippleAge*.055)*22.,2.))*exp(-rippleAge*.7);
      p.x+=water*(wave*.00048*moving+ring*.0025);p.y+=water*ring*.0009;
      vec3 c=texture2D(art,p).rgb;
      c+=vec3(.017,.016,.012)*wave*water*moving;
      c*=vec3(1.+warmth*.04,1.+warmth*.012,1.-warmth*.045);
      vec3 blue=c*vec3(.59,.74,.87)+vec3(.025,.055,.075);
      c=mix(c,blue,night*.72);gl_FragColor=vec4(c,1.);}`
  }));
  plate.renderOrder = -10; plate.frustumCulled = false; world.add(plate);
  world.add(new THREE.AmbientLight(0xe4eef6, 2.2));
  const sun = new THREE.DirectionalLight(0xffe3ab, 3.6); sun.position.set(-200, 400, 600); world.add(sun);
  const fill = new THREE.DirectionalLight(0xc3dcee, 1.4); fill.position.set(400, -100, 300); world.add(fill);
  const dial = new THREE.Group(); world.add(dial); dial.rotation.x = -.93;
  const brass = new THREE.MeshStandardMaterial({ color: 0xb5924f, roughness: .38, metalness: .5 });
  const edge = new THREE.MeshStandardMaterial({ color: 0x73582d, roughness: .5, metalness: .4 });
  function cylinder(radius, height, z, material) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 80), material);
    mesh.rotation.x = Math.PI / 2; mesh.position.z = z; dial.add(mesh); return mesh;
  }
  cylinder(1, .07, 0, edge); cylinder(.97, .045, .045, brass); cylinder(.68, .01, .073, brass);
  for (const radius of [.72, .77, .91]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, .003, 4, 96), edge);
    ring.position.z = .073; dial.add(ring);
  }
  const marks = new THREE.Group(); dial.add(marks);
  const points = [];
  for (let i = 0; i < 72; i++) {
    const angle = i / 72 * Math.PI * 2, inner = i % 6 ? .83 : .78;
    points.push(new THREE.Vector3(Math.cos(angle)*inner,Math.sin(angle)*inner,.077),new THREE.Vector3(Math.cos(angle)*.89,Math.sin(angle)*.89,.077));
  }
  marks.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x614622})));
  cylinder(.18,.04,.105,edge); cylinder(.12,.09,.16,brass); cylinder(.045,.5,.42,brass);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.045,16,12),brass); cap.position.z=.67; dial.add(cap);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(.015,.53,.01),edge); needle.position.set(0,.31,.08); dial.add(needle);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.9,1.7),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,uniforms:{},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p,p)*4.)*.4;gl_FragColor=vec4(.12,.09,.05,a);}`
  }));world.add(shadow);
  // The gnomon's ground shadow rotates with the visitor's light setting.
  const gnomonShadow=new THREE.Mesh(new THREE.PlaneGeometry(.1,.65),new THREE.MeshBasicMaterial({color:0x56432c,transparent:true,opacity:.28,depthWrite:false}));
  gnomonShadow.position.set(.12,-.24,.082);dial.add(gnomonShadow);
  const input=document.getElementById('light-dial'),anchor=document.getElementById('dial-anchor');
  const water=document.getElementById('water-touch'),notebook=document.getElementById('open-notebook');
  let width=1,height=1,artWidth=1,artHeight=1,left=0,top=0,mobile=false,texture,loadId=0,frame=0,last=0,time=0,rippleStart=-10;
  function point(x,y){return {x:left+x*artWidth,y:top+y*artHeight};}
  function place(el,x,y,w,h){const p=point(x,y);Object.assign(el.style,{left:`${p.x}px`,top:`${p.y}px`,width:`${w*artWidth}px`,height:`${h*artHeight}px`});}
  function layout(){
    if(!texture)return;
    const image=texture.image,scale=Math.max(width/image.width,height/image.height);
    artWidth=mobile?image.width*scale:width;artHeight=mobile?image.height*scale:height;left=(width-artWidth)/2;top=height-artHeight;
    uniforms.uvScale.value.set(width/artWidth,height/artHeight);uniforms.uvOffset.value.set(-left/artWidth,0);
    const p=point(mobile?.345:.382,mobile?.686:.887),radius=Math.min(artWidth*(mobile?.11:.085),150);
    dial.position.set(p.x-width/2,height/2-p.y,20);dial.scale.setScalar(radius);
    shadow.position.set(dial.position.x+radius*.12,dial.position.y-radius*.12,2);shadow.scale.setScalar(radius);
    Object.assign(anchor.style,{left:`${p.x}px`,top:`${p.y-radius*.18}px`,width:`${radius*2.2}px`,height:`${radius*1.8}px`});
    place(water,mobile?.025:.02,mobile?.465:.55,mobile?.22:.25,mobile?.13:.15);
    place(notebook,mobile?.61:.60,mobile?.572:.72,mobile?.28:.28,mobile?.11:.17);
    draw();
  }
  function resize(){
    width=container.clientWidth;height=container.clientHeight;
    renderer.setSize(width,height,false);camera.left=-width/2;camera.right=width/2;camera.top=height/2;camera.bottom=-height/2;camera.updateProjectionMatrix();
    const next=innerWidth<=760;
    if(!texture||next!==mobile){
      mobile=next;uniforms.mobile.value=Number(mobile);const current=++loadId;
      new THREE.TextureLoader().load(mobile?'/art/courtyard-mobile.webp':'/art/courtyard.webp',loaded=>{
        if(current!==loadId){loaded.dispose();return;}texture?.dispose();texture=loaded;
        uniforms.art.value=texture;layout();container.classList.add('ready');start();
      },undefined,()=>container.classList.remove('ready'));
    }else layout();
  }
  function draw(){if(texture)renderer.render(world,camera);}
  function light(){const angle=Number(input.value)*Math.PI/180;uniforms.warmth.value=Number(input.value)/60;marks.rotation.z=angle;needle.rotation.z=-angle;sun.position.x=-200+Number(input.value)*6;gnomonShadow.rotation.z=-angle;gnomonShadow.position.set(Math.sin(angle)*.25,-Math.cos(angle)*.25,.082);draw();}
  function theme(){uniforms.night.value=Number(document.documentElement.dataset.theme==='dark');sun.intensity=uniforms.night.value?2.3:3.6;draw();}
  function tick(now){frame=0;if(paused||document.hidden)return;if(now-last>=1000/24){const dt=last?Math.min((now-last)/1000,.1):0;last=now;time+=dt;uniforms.time.value=time;uniforms.rippleAge.value=time-rippleStart;draw();}start();}
  function start(){if(!paused&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
  input.addEventListener('input',light);
  water.addEventListener('click',event=>{
    const rect=water.getBoundingClientRect(),x=event.detail?event.clientX:rect.x+rect.width/2,y=event.detail?event.clientY:rect.y+rect.height/2;
    uniforms.ripple.value.set((x-left)/artWidth,1-(y-top)/artHeight);rippleStart=time;uniforms.rippleAge.value=paused?.5:0;draw();start();
  });
  document.addEventListener('themechange',theme);
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden)start();});
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);frame=0;container.classList.remove('ready');});
  renderer.domElement.addEventListener('webglcontextrestored',()=>{layout();container.classList.add('ready');start();});
  new ResizeObserver(resize).observe(container);theme();light();resize();
  return {setPaused(value){paused=value;uniforms.moving.value=value?0:1;cancelAnimationFrame(frame);frame=0;draw();start();},pulse(){if(!paused){rippleStart=time;start();}}};
}
