// 웹구축센터 — 글로시 풍선 히어로 (eimokdesign 스타일, 하오 오렌지/블랙/화이트)
import * as THREE from 'three';

const canvas = document.getElementById('holo3d');
if (canvas) {
  try { initBalloons(canvas); }
  catch (e) { console.warn('balloons init 실패:', e); canvas.style.display = 'none'; }
}

function initBalloons(canvas) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[(Math.random() * arr.length) | 0];

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  // 스튜디오 환경맵 (글로시 하이라이트 + 반짝이) — 어두운 베이스 + 밝은 소프트박스/점
  const envTex = makeEnv();
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(4, 6, 6); scene.add(key);
  const warm = new THREE.PointLight(0xff7a2e, 60, 50); warm.position.set(-6, -2, 5); scene.add(warm);
  const rim = new THREE.DirectionalLight(0xffd0b0, 1.2); rim.position.set(-5, 2, -4); scene.add(rim);

  // 하오 컬러 풍선 팔레트 (오렌지 우세 / 블랙 / 화이트)
  const PALETTE = [
    0xe83817, 0xff5a23, 0xff8a3d, 0xf25b35, // 오렌지 계열
    0xe83817, 0xff6a2e,                       // 오렌지 가중
    0x0c0c10, 0x141318,                       // 블랙
    0xf4f3f5, 0xffffff                        // 화이트
  ];
  function balloonMat(color) {
    const c = new THREE.Color(color);
    const dark = (c.r + c.g + c.b) < 0.4;
    return new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.22, metalness: 0,
      clearcoat: 1, clearcoatRoughness: 0.12,
      envMapIntensity: dark ? 0.9 : 1.15,
      sheen: 0.4, sheenColor: new THREE.Color(0xffffff), sheenRoughness: 0.5
    });
  }

  const sphereGeo = new THREE.SphereGeometry(1, 48, 48);
  const capGeo = new THREE.CapsuleGeometry(0.5, 1.1, 24, 40);

  const BOUND = { x: 7.8, y: 3.7, z: 2.6 };
  const balloons = [];
  const COUNT = innerWidth < 760 ? 22 : 40;
  for (let i = 0; i < COUNT; i++) {
    const isCap = Math.random() < 0.26;
    const r = isCap ? rnd(0.3, 0.58) : rnd(0.32, 1.2);
    const mesh = new THREE.Mesh(isCap ? capGeo : sphereGeo, balloonMat(pick(PALETTE)));
    // 가장자리에 더 몰리도록 중앙 회피 분포
    let px, py;
    do { px = rnd(-BOUND.x, BOUND.x); py = rnd(-BOUND.y, BOUND.y); }
    while (Math.abs(px) < 2.6 && Math.abs(py) < 1.6 && Math.random() < 0.7);
    const pz = rnd(-BOUND.z, BOUND.z);
    mesh.position.set(px, py, pz);
    mesh.scale.setScalar(isCap ? r * 1.3 : r);
    mesh.rotation.set(rnd(0, 6.28), rnd(0, 6.28), rnd(0, 6.28));
    scene.add(mesh);
    balloons.push({
      mesh, r: isCap ? r * 1.6 : r,
      vel: new THREE.Vector3(rnd(-0.004, 0.004), rnd(-0.004, 0.004), rnd(-0.002, 0.002)),
      spin: new THREE.Vector3(rnd(-0.004, 0.004), rnd(-0.004, 0.004), rnd(-0.004, 0.004)),
      ph: rnd(0, 6.28)
    });
  }

  function makeEnv() {
    const c = document.createElement('canvas'); c.width = 1024; c.height = 512;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#1a2236'); g.addColorStop(0.5, '#0d1018'); g.addColorStop(1, '#05060a');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    // 따뜻한 글로우 (오렌지 반사용)
    const wg = x.createRadialGradient(220, 360, 0, 220, 360, 320);
    wg.addColorStop(0, 'rgba(255,120,40,.5)'); wg.addColorStop(1, 'rgba(255,120,40,0)');
    x.fillStyle = wg; x.fillRect(0, 0, 1024, 512);
    // 밝은 소프트박스 (글로시 하이라이트)
    function box(cx, cy, w, h, col) {
      x.save(); x.fillStyle = col; x.shadowColor = col; x.shadowBlur = 30;
      const r = Math.min(w, h) / 2;
      x.beginPath();
      x.moveTo(cx - w / 2 + r, cy - h / 2);
      x.arcTo(cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2, r);
      x.arcTo(cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2, r);
      x.arcTo(cx - w / 2, cy + h / 2, cx - w / 2, cy - h / 2, r);
      x.arcTo(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, r);
      x.closePath(); x.fill(); x.restore();
    }
    box(300, 120, 220, 90, '#ffffff');
    box(720, 150, 120, 240, '#ffffff');
    box(540, 90, 90, 60, '#fff0e0');
    // 작은 반짝이 점
    x.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(Math.random() * 1024, Math.random() * 512, Math.random() * 2 + 1, 0, 6.28); x.fill(); }
    const t = new THREE.Texture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
    return t;
  }

  // 마우스 → 월드 좌표(z=0 평면)
  const mouseW = new THREE.Vector3(999, 999, 0);
  let mx = 0, my = 0, mActive = false;
  addEventListener('pointermove', e => {
    const ndc = new THREE.Vector3((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1, 0.5);
    ndc.unproject(camera);
    const dir = ndc.sub(camera.position).normalize();
    const dist = -camera.position.z / dir.z;
    mouseW.copy(camera.position).add(dir.multiplyScalar(dist));
    mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; mActive = true;
  }, { passive: true });
  addEventListener('pointerleave', () => { mActive = false; mouseW.set(999, 999, 0); }, { passive: true });

  let t = 0, gx = 0, gy = 0;
  function frame() {
    t += 0.006;
    gx += (mx * 0.4 - gx) * 0.04; gy += (-my * 0.25 - gy) * 0.04;
    camera.position.x += (gx * 1.2 - camera.position.x) * 0.04;
    camera.position.y += (gy * 0.8 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, 0);

    for (let i = 0; i < balloons.length; i++) {
      const b = balloons[i], p = b.mesh.position;
      // 마우스 반발
      if (mActive) {
        const dx = p.x - mouseW.x, dy = p.y - mouseW.y;
        const d2 = dx * dx + dy * dy, R = 2.6;
        if (d2 < R * R) {
          const d = Math.sqrt(d2) || 0.001, f = (1 - d / R) * 0.012;
          b.vel.x += (dx / d) * f; b.vel.y += (dy / d) * f;
        }
      }
      // 중앙(텍스트 영역) 비우기 — 앞쪽 풍선만 바깥으로
      const cd = Math.hypot(p.x, p.y * 1.5);
      if (cd < 3.0 && p.z > 0.2) {
        const f = (1 - cd / 3.0) * 0.004, n = cd || 0.001;
        b.vel.x += (p.x / n) * f; b.vel.y += (p.y / n) * f;
      }
      p.addScaledVector(b.vel, 1);
      p.y += Math.sin(t + b.ph) * 0.0016; // 부유
      if (p.x > BOUND.x || p.x < -BOUND.x) b.vel.x *= -1;
      if (p.y > BOUND.y || p.y < -BOUND.y) b.vel.y *= -1;
      if (p.z > BOUND.z || p.z < -BOUND.z) b.vel.z *= -1;
      p.x = Math.max(-BOUND.x, Math.min(BOUND.x, p.x));
      p.y = Math.max(-BOUND.y, Math.min(BOUND.y, p.y));
      p.z = Math.max(-BOUND.z, Math.min(BOUND.z, p.z));
      b.vel.multiplyScalar(0.99); // 감쇠
      if (b.vel.lengthSq() < 4e-7) b.vel.set(rnd(-0.003, 0.003), rnd(-0.003, 0.003), 0);
      b.mesh.rotation.x += b.spin.x; b.mesh.rotation.y += b.spin.y;
    }
    // 충돌 분리 — 서로 통과하지 않고 자연스럽게 밀어냄
    for (let i = 0; i < balloons.length; i++) {
      const a = balloons[i], pa = a.mesh.position;
      for (let j = i + 1; j < balloons.length; j++) {
        const bb = balloons[j], pb = bb.mesh.position;
        const dx = pa.x - pb.x, dy = pa.y - pb.y, dz = pa.z - pb.z;
        const minD = (a.r + bb.r) * 0.9, d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < minD * minD && d2 > 1e-6) {
          const d = Math.sqrt(d2), ov = (minD - d) * 0.5;
          const nx = dx / d, ny = dy / d, nz = dz / d;
          pa.x += nx * ov; pa.y += ny * ov; pa.z += nz * ov;
          pb.x -= nx * ov; pb.y -= ny * ov; pb.z -= nz * ov;
          a.vel.x += nx * 0.0008; a.vel.y += ny * 0.0008;
          bb.vel.x -= nx * 0.0008; bb.vel.y -= ny * 0.0008;
        }
      }
    }
    renderer.render(scene, camera);
    if (!reduce) requestAnimationFrame(frame);
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);
  if (canvas.clientWidth) frame();
  else requestAnimationFrame(function w() { resize(); canvas.clientWidth ? frame() : requestAnimationFrame(w); });
}
