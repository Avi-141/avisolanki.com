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
      void main(){vec3 p=vPosition;float n=fbm(p*5.+vec3(0.,time*.035,0.));float grain=noise(p*130.);float veins=fbm(p*18.+n*3.+time*.015);float shade=pow(max(0.,dot(normalize(vNormal),normalize(vec3(-.5,.7,1.3)))),.45);float rim=pow(1.-max(vNormal.z,0.),2.);
        vec3 gold=mix(vec3(.38,.27,.16),vec3(.94,.82,.61),n*.25+shade*.7);gold+=veins*.035+grain*.014;gold=mix(gold,vec3(.92,.78,.53),rim*.35);gold+=burst*.08;gl_FragColor=vec4(gold,1.);}`
  }));
  sun.position.y = .52; group.add(sun);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 5.5), new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform float burst;void main(){float d=length(vUv-.5)*2.;float aura=exp(-d*d*5.)*.06+exp(-d*d*16.)*.12;float corona=exp(-abs(d-.3636)*60.)*.13;gl_FragColor=vec4(vec3(.92,.54,.18), (aura+corona)*(1.+burst*.4));}`
  }));
  glow.position.set(0, .52, -.35); group.add(glow);

  const paths = new THREE.Group(); paths.position.y = .52; group.add(paths);
  for (let j = 0; j < 2; j++) {
    const points = [];
    for (let i = 0; i <= 180; i++) {
      const angle = i / 180 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * (1.58 + j * .38), Math.sin(angle) * (1.58 + j * .38), 0));
    }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0xc69b60, transparent: true, opacity: j === 0 ? .18 : .09 }));
    line.rotation.set(1.02 + j * .17, .25, -.35 + j * .22); paths.add(line);
  }
  const spark = new THREE.Mesh(new THREE.SphereGeometry(.026, 12, 8), new THREE.MeshBasicMaterial({color:0xffdda3}));
  paths.children[0].add(spark);
  const pointer = new THREE.Vector2();
  let running = 0, previous = 0, elapsed = 0, flash = 0, activeUntil = performance.now() + 4000;
  function resize() {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    const mobile = innerWidth <= 760;
    group.position.set(mobile ? .17 : .1, mobile ? 1.45 : .2, 0);
    group.scale.setScalar(mobile ? .63 : 1);
    render(performance.now(), true);
  }
  function render(now, once = false) {
    if (!once && (paused || document.hidden || now > activeUntil)) { running = 0; return; }
    const delta = previous ? Math.min((now - previous) / 1000, .1) : 0;
    if (once || delta >= 1 / 30) {
      previous = now; elapsed += paused ? 0 : delta; flash *= .93;
      uniforms.time.value = elapsed; uniforms.burst.value = flash;
      sun.rotation.y = elapsed * .035; sun.rotation.z = -.16;
      paths.rotation.y = Math.sin(elapsed * .08) * .08;
      spark.position.set(Math.cos(elapsed * .18) * 1.58, Math.sin(elapsed * .18) * 1.58, 0);
      camera.position.x += ((paused ? 0 : pointer.x * .16) - camera.position.x) * .035;
      camera.position.y += ((paused ? 0 : pointer.y * .1) - camera.position.y) * .035;
      camera.lookAt(0, 0, 0); renderer.render(world, camera);
    }
    if (!once) running = requestAnimationFrame(render);
  }
  function start() { if (!paused && !document.hidden && !running) { previous = performance.now(); running = requestAnimationFrame(render); } }
  document.addEventListener('pointermove', e => { pointer.set((e.clientX / innerWidth - .5) * 2, -(e.clientY / innerHeight - .5) * 2); activeUntil = performance.now() + 900; start(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(running); running = 0; } else start(); });
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); cancelAnimationFrame(running); running = 0; container.classList.remove('ready'); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { resize(); start(); container.classList.add('ready'); });
  new ResizeObserver(resize).observe(container);
  resize(); container.classList.add('ready'); start();
  return {
    setPaused(value) { paused = value; if (paused) { cancelAnimationFrame(running); running = 0; render(performance.now(), true); } else start(); },
    pulse() { if (!paused) { flash = 1; activeUntil = performance.now() + 1500; start(); } }
  };
}
