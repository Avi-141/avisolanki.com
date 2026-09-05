import * as THREE from 'three';

export function createDawn(container, paused) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  const world = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.z = 9;
  const group = new THREE.Group(); world.add(group);
  const uniforms = { time: { value: 0 }, burst: { value: 0 } };
  const sun = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec3 vPosition; varying vec3 vNormal;
      void main(){vPosition=position;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `precision highp float; varying vec3 vPosition; varying vec3 vNormal; uniform float time; uniform float burst;
      float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
      float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
      float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=p*2.05+vec3(3.2,1.7,2.1);a*=.5;}return v;}
      void main(){vec3 p=vPosition;float n=fbm(p*9.+vec3(time*.045,time*.025,0.));float grain=noise(p*160.);float face=pow(max(vNormal.z,0.),.5);
        vec3 gold=mix(vec3(.99,.49,.12),vec3(1.,.88,.49),face*.7+n*.22);gold+=(grain-.5)*.025;gold+=burst*.055;gl_FragColor=vec4(gold,1.);}`
  }));
  sun.position.y = .52; group.add(sun);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5), new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float time;uniform float burst;void main(){vec2 p=vUv-.5;float d=length(p)*2.;float a=atan(p.y,p.x);float breathe=1.+sin(time*.65)*.035;float rim=.365*breathe;float corona=exp(-abs(d-rim)*35.)*(.21+.025*sin(a*11.+time*.3));float aura=exp(-d*d*7.)*.19;gl_FragColor=vec4(vec3(1.,.63,.19),(aura+corona)*(1.+burst*.2));}`
  }));
  glow.position.set(0, .52, -.35); group.add(glow);

  const pointer = new THREE.Vector2();
  let running = 0, previous = 0, elapsed = 0, flash = 0;
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    const mobile = innerWidth <= 760;
    group.position.set(mobile ? .17 : .1, mobile ? 1.45 : .2, 0);
    group.scale.setScalar(mobile ? .63 : 1);
    render(performance.now(), true);
  }
  function render(now, once = false) {
    if (!once && (paused || document.hidden)) { running = 0; return; }
    const delta = previous ? Math.min((now - previous) / 1000, .1) : 0;
    if (once || delta >= 1 / 24) {
      previous = now; elapsed += paused ? 0 : delta; flash *= .93;
      uniforms.time.value = elapsed; uniforms.burst.value = flash;
      sun.rotation.y = elapsed * .035; sun.rotation.z = -.16;
      glow.scale.setScalar(1 + Math.sin(elapsed * .45) * .018);
      camera.position.x += ((paused ? 0 : pointer.x * .16) - camera.position.x) * .035;
      camera.position.y += ((paused ? 0 : pointer.y * .1) - camera.position.y) * .035;
      camera.lookAt(0, 0, 0); renderer.render(world, camera);
    }
    if (!once) running = requestAnimationFrame(render);
  }
  function start() { if (!paused && !document.hidden && !running) { previous = performance.now(); running = requestAnimationFrame(render); } }
  document.addEventListener('pointermove', e => { pointer.set((e.clientX / innerWidth - .5) * 2, -(e.clientY / innerHeight - .5) * 2); start(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(running); running = 0; } else start(); });
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(running); running = 0; container.classList.remove('ready'); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { resize(); start(); container.classList.add('ready'); });
  new ResizeObserver(resize).observe(container);
  resize(); container.classList.add('ready'); start();
  return {
    setPaused(value) { paused = value; if (paused) { cancelAnimationFrame(running); running = 0; render(performance.now(), true); } else start(); },
    pulse() { if (!paused) { flash = 1; start(); } }
  };
}
