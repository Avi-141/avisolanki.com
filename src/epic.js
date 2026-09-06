import * as THREE from 'three';

// A layered motion study: painted cutouts with local deformation, not rigged characters.
export function createEpic(container, paused) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  container.append(renderer.domElement);
  const world = new THREE.Scene(), camera = new THREE.Camera();
  const u = {
    backgroundArt: { value: null }, foregroundArt: { value: null },
    resolution: { value: new THREE.Vector2() }, bgSize: { value: new THREE.Vector2() },
    fgSize: { value: new THREE.Vector2() }, bgOrigin: { value: new THREE.Vector2() },
    fgOrigin: { value: new THREE.Vector2() }, pointer: { value: new THREE.Vector2() },
    time: { value: 0 }, motion: { value: paused ? 0 : 1 }, zoom: { value: 0 },
    night: { value: Number(document.documentElement.dataset.theme === 'dark') }
  };
  const material = new THREE.ShaderMaterial({ uniforms: u,
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `precision highp float;
      varying vec2 vUv;
      uniform sampler2D backgroundArt,foregroundArt;
      uniform vec2 resolution,bgSize,fgSize,bgOrigin,fgOrigin,pointer;
      uniform float time,motion,zoom,night;
      float area(vec2 p,vec2 center,vec2 size){vec2 q=(p-center)/size;return exp(-dot(q,q)*2.);}
      vec4 art(sampler2D tex,vec2 p){return texture2D(tex,vec2(p.x,1.-p.y));}
      void main(){
        vec2 screen=vec2(vUv.x,1.-vUv.y)*resolution;
        vec2 b=(screen-bgOrigin)/bgSize;
        vec2 f=(screen-fgOrigin)/fgSize;
        b=(b-vec2(.72,.8))/(1.+zoom*.3)+vec2(.72,.8)+pointer*.0015;
        f=(f-vec2(.75,.82))/(1.+zoom)+vec2(.75,.82)+pointer*.005;
        float water=smoothstep(.773,.80,b.y);
        float ripples=sin(b.y*420.-time*1.2)+sin(b.y*235.+b.x*35.+time*.75);
        b.x+=water*ripples*.0008*motion;
        b.y+=water*sin(b.x*110.+time*.6)*.00018*motion;
        vec3 back=art(backgroundArt,b).rgb;
        back+=water*ripples*.0045*motion;
        // Leaf tips move most; the trunk and ground remain anchored.
        float canopy=area(f,vec2(.62,.40),vec2(.30,.32));
        float roots=area(f,vec2(.74,.60),vec2(.16,.09));
        f.x+=(canopy*.0018*sin(time*.63+f.y*11.)+roots*.0011*sin(time*.82+f.x*14.))*motion;
        f.y+=canopy*.0008*cos(time*.51+f.x*12.)*motion;
        // The free end of the blue garment follows a travelling wave.
        float cloth=area(f,vec2(.798,.835),vec2(.052,.023));
        f.y+=cloth*.005*sin(time*1.65-f.x*26.)*motion;
        f.x+=cloth*.0015*cos(time*1.1-f.x*20.)*motion;
        float breath=area(f,vec2(.732,.775),vec2(.02,.066));
        float horses=area(f,vec2(.641,.79),vec2(.045,.048));
        f.y+=(breath*.0009*sin(time*1.45)+horses*.0011*sin(time*1.15+.9))*motion;
        vec3 front=art(foregroundArt,f).rgb;
        // The generated cutout uses a chroma backdrop; key and de-spill at render time.
        float magenta=max(0.,min(front.r,front.b)-front.g);
        float alpha=1.-smoothstep(.035,.28,magenta);
        float spill=smoothstep(.025,.08,magenta);
        front.r=mix(front.r,min(front.r,front.g+.025),spill);
        front.b=mix(front.b,min(front.b,front.g+.065),spill);
        alpha*=step(0.,f.x)*step(f.x,1.)*step(0.,f.y)*step(f.y,1.);
        vec3 color=mix(back,front,alpha);
        vec3 evening=color*vec3(.43,.58,.72)+vec3(.012,.025,.046);
        color=mix(color,evening,night);
        gl_FragColor=vec4(color,1.);
      }`
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2,2), material);
  mesh.frustumCulled = false; world.add(mesh);
  let ready = false, lost = false, frame = 0, last = 0, elapsed = 0;
  let targetNight = u.night.value, zoom = paused ? 0 : .035;
  const pointer = new THREE.Vector2(), reduced = () => paused || document.hidden;
  function draw() { if (ready && !lost) renderer.render(world,camera); }
  function layout() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w,h,false); u.resolution.value.set(w,h);
    const bgW = Math.max(w,h*1.5)*1.025, bgH = bgW/1.5;
    u.bgSize.value.set(bgW,bgH); u.bgOrigin.value.set((w-bgW)/2,(h-bgH)/2);
    // Portrait keeps both travelers in the frame instead of cropping a desktop cover.
    const portrait = w <= 760, fgW = portrait ? w*1.65 : bgW, fgH = fgW/1.5;
    u.fgSize.value.set(fgW,fgH);
    u.fgOrigin.value.set(portrait ? w-fgW*.98 : (w-fgW)/2, h-fgH);
    draw();
  }
  function start() { if (ready && !lost && !reduced() && !frame) frame=requestAnimationFrame(tick); }
  function tick(now) {
    frame=0; if (reduced() || lost) return;
    const dt=last ? Math.min((now-last)/1000,.05) : 0; last=now; elapsed+=dt;
    const blend=1-Math.exp(-dt*3.5);
    u.pointer.value.lerp(pointer,blend);
    const dialogOpen=Boolean(document.querySelector('dialog[open]'));
    zoom += ((dialogOpen ? .07 : 0)-zoom)*(1-Math.exp(-dt*1.8));
    u.zoom.value=zoom; u.time.value=elapsed;
    u.night.value+=(targetNight-u.night.value)*blend;
    draw(); start();
  }
  const loader = new THREE.TextureLoader();
  Promise.all(['/epic/background.webp','/epic/foreground.webp'].map(url=>loader.loadAsync(url))).then(([background,foreground])=>{
    u.backgroundArt.value=background; u.foregroundArt.value=foreground;
    ready=true; layout(); container.classList.add('ready'); start();
  }).catch(()=>{container.dataset.renderState='poster';});
  window.addEventListener('pointermove',event=>{
    if(paused || event.pointerType!=='mouse') return;
    pointer.set((event.clientX/innerWidth-.5)*2,(event.clientY/innerHeight-.5)*2);
  },{passive:true});
  document.documentElement.addEventListener('pointerleave',()=>pointer.set(0,0));
  document.addEventListener('themechange',()=>{
    targetNight=Number(document.documentElement.dataset.theme==='dark');
    if(paused){u.night.value=targetNight;draw();}else start();
  });
  document.addEventListener('visibilitychange',()=>{
    cancelAnimationFrame(frame);frame=0;last=0;if(!document.hidden)start();
  });
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();lost=true;cancelAnimationFrame(frame);frame=0;container.classList.remove('ready');
  });
  renderer.domElement.addEventListener('webglcontextrestored',()=>{
    lost=false;last=0;layout();container.classList.add('ready');start();
  });
  new ResizeObserver(layout).observe(container);
  return {
    setPaused(value){paused=value;u.motion.value=Number(!value);cancelAnimationFrame(frame);frame=0;last=0;
      if(value){u.pointer.value.set(0,0);u.zoom.value=0;u.night.value=targetNight;}draw();start();},
    pulse(){}
  };
}
