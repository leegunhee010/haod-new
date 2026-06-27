// 웹구축센터 — 다크 히어로 홀로그래픽 글래스 (Three.js 실제 굴절·분산)
import * as THREE from 'three';

const canvas = document.getElementById('holo3d');
if (canvas) {
  try { initHolo(canvas); }
  catch (e) { console.warn('holo3d init 실패:', e); canvas.style.display = 'none'; }
}

function initHolo(canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping || THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  // 홀로그래픽 환경맵 (오렌지 우세 무지개) — 다크 배경에서 유리 가장자리에 색 실림
  const envTex = makeEnvTexture();
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envRT = pmrem.fromEquirectangular(envTex);
  scene.environment = envRT.texture;
  envTex.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(3, 4, 5); scene.add(key);
  const warm = new THREE.PointLight(0xff7a2e, 90, 40); warm.position.set(-5, -1, 4); scene.add(warm);
  const cool = new THREE.PointLight(0xff52d6, 40, 40); cool.position.set(5, 3, 2); scene.add(cool);
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));

  function glassMat() {
    const m = new THREE.MeshPhysicalMaterial({
      transmission: 0.8, thickness: 0.8, roughness: 0.02, metalness: 0,
      ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.02,
      iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessRange: [140, 1150],
      attenuationColor: new THREE.Color(0xffcaa0), attenuationDistance: 5,
      envMapIntensity: 3.6, transparent: true
    });
    if ('dispersion' in m) m.dispersion = 22;
    return m;
  }

  const group = new THREE.Group(); scene.add(group);
  const shapes = [];
  function add(geo, pos, scl, rot, spin) {
    const mesh = new THREE.Mesh(geo, glassMat());
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.scale.setScalar(scl);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    group.add(mesh);
    shapes.push({ mesh, spin, ph: pos[0] * 1.3, baseX: pos[0], baseY: pos[1], baseZ: pos[2], depth: 0.5 + shapes.length * 0.3 });
  }
  // 중앙 텍스트를 피해 양옆에 배치 (좌: 큰 링 + 작은 링 / 우: 캡슐 + 구)
  add(new THREE.TorusGeometry(1.0, 0.4, 96, 240), [-3.3, 0.5, 0], 1.15, [0.5, 0.3, 0], [0.16, 0.24, 0.05]);
  add(new THREE.TorusGeometry(0.6, 0.26, 80, 180), [-2.7, -1.5, -0.4], 0.8, [1.1, 0.4, 0.3], [0.22, 0.16, 0.18]);
  add(new THREE.CapsuleGeometry(0.4, 1.1, 56, 112), [3.0, 1.0, -0.3], 0.95, [0.7, 0.2, 0.9], [0.12, 0.28, 0.1]);
  add(new THREE.SphereGeometry(0.8, 96, 96), [3.3, -0.9, 0.2], 1.0, [0.2, 0.3, 0], [0.04, 0.1, 0.03]);

  function makeEnvTexture() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 1024, 512);
    g.addColorStop(0.00, '#0a0610');
    g.addColorStop(0.15, '#ff5a00');
    g.addColorStop(0.30, '#ff9a2e');
    g.addColorStop(0.44, '#ffd000');
    g.addColorStop(0.58, '#ff5a7a');
    g.addColorStop(0.70, '#9a6cff');
    g.addColorStop(0.83, '#00b3ff');
    g.addColorStop(0.93, '#46ffe0');
    g.addColorStop(1.00, '#ffffff');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    x.globalAlpha = 0.55;
    for (let i = 1; i < 8; i++) { x.fillStyle = '#000'; x.fillRect(i * 128 - 3, 0, 6, 512); }
    x.globalAlpha = 1;
    const blobs = [[780, 380, 220, '#ffae66'], [500, 180, 160, '#ffcf5a'], [920, 110, 140, '#5ad8ff']];
    for (const [bx, by, r, col] of blobs) {
      const rg = x.createRadialGradient(bx, by, 0, bx, by, r);
      rg.addColorStop(0, col); rg.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = rg; x.fillRect(0, 0, 1024, 512);
    }
    function softbox(cx, cy, w, h) {
      x.save(); x.fillStyle = '#fff'; x.shadowColor = '#fff'; x.shadowBlur = 26;
      const r = Math.min(w, h) / 2;
      x.beginPath();
      x.moveTo(cx - w / 2 + r, cy - h / 2);
      x.arcTo(cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2, r);
      x.arcTo(cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2, r);
      x.arcTo(cx - w / 2, cy + h / 2, cx - w / 2, cy - h / 2, r);
      x.arcTo(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, r);
      x.closePath(); x.fill(); x.restore();
    }
    softbox(170, 120, 120, 40); softbox(620, 90, 50, 180); softbox(340, 400, 90, 30); softbox(880, 300, 40, 120);
    const t = new THREE.Texture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
    return t;
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const narrow = w < 760;
    group.scale.setScalar(narrow ? 0.62 : 1);
  }

  let t = 0, mx = 0, my = 0, mxS = 0, myS = 0;
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; }, { passive: true });
  addEventListener('deviceorientation', e => {
    if (e.gamma != null) { mx = Math.max(-0.5, Math.min(0.5, e.gamma / 45)); my = Math.max(-0.5, Math.min(0.5, (e.beta - 45) / 45)); }
  }, { passive: true });

  function frame() {
    t += 0.006;
    mxS += (mx - mxS) * 0.07;
    myS += (my - myS) * 0.07;
    for (let i = 0; i < shapes.length; i++) {
      const s = shapes[i];
      s.mesh.rotation.x += s.spin[0] * 0.02;
      s.mesh.rotation.y += s.spin[1] * 0.02;
      s.mesh.rotation.z += s.spin[2] * 0.02;
      const fy = Math.sin(t * 1.15 + s.ph) * 0.3;
      const fx = Math.cos(t * 0.85 + s.ph * 0.7) * 0.18;
      s.mesh.position.x = s.baseX + fx + mxS * s.depth * 2.4;
      s.mesh.position.y = s.baseY + fy - myS * s.depth * 1.8;
      s.mesh.position.z = s.baseZ + mxS * s.depth * 0.7;
    }
    group.rotation.y += (mxS * 0.6 - group.rotation.y) * 0.06;
    group.rotation.x += (-myS * 0.4 - group.rotation.x) * 0.06;
    group.rotation.z = Math.sin(t * 0.4) * 0.04;
    camera.position.x += (mxS * 0.9 - camera.position.x) * 0.045;
    camera.position.y += (-myS * 0.6 - camera.position.y) * 0.045;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', resize);
  if (canvas.clientWidth) { frame(); }
  else { requestAnimationFrame(function w() { resize(); canvas.clientWidth ? frame() : requestAnimationFrame(w); }); }
}
