// viz/lib3d.js — フレームワーク不使用の最小3D。canvas2D に3D点群/平面を投影し、
// ドラッグで回転できるようにする共有ヘルパ。Three.js 等は使わない（プロジェクト方針）。
//
// 使い方:
//   const cam = Lib3D.camera();            // {yaw,pitch,scale,cx,cy,dist}
//   Lib3D.attachDrag(canvas, cam, draw);   // ドラッグ/ホイールで回転・ズーム
//   const s = Lib3D.project([x,y,z], cam); // → {x,y,depth}
//   平面塗りは Lib3D.quad(ctx, corners3D, cam, fillStyle) など
(function () {
  function camera(opt) {
    return Object.assign({ yaw: -0.6, pitch: 0.42, scale: 64, cx: 0, cy: 0, dist: 14 }, opt || {});
  }
  // p=[x,y,z] を yaw(縦軸まわり)→pitch(横軸まわり) で回転
  function rotate(p, yaw, pitch) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x1 = p[0] * cy + p[2] * sy;
    const z1 = -p[0] * sy + p[2] * cy;
    const y1 = p[1];
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const y2 = y1 * cp - z1 * sp;
    const z2 = y1 * sp + z1 * cp;
    return [x1, y2, z2];
  }
  // 弱透視投影。返り値 {x,y,depth}。depth が大きいほど手前。
  function project(p, cam) {
    const r = rotate(p, cam.yaw, cam.pitch);
    const f = cam.dist / (cam.dist + r[2]);  // r[2]<0 で手前（拡大）
    return { x: cam.cx + r[0] * cam.scale * f, y: cam.cy - r[1] * cam.scale * f, depth: -r[2] };
  }
  // 3D 四隅 corners=[[x,y,z]*4] を塗る。返り値=平均depth（ソート用）
  function quad(ctx, corners, cam, fill, stroke) {
    const ps = corners.map(c => project(c, cam));
    ctx.beginPath();
    ctx.moveTo(ps[0].x, ps[0].y);
    for (let i = 1; i < ps.length; i++) ctx.lineTo(ps[i].x, ps[i].y);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    let d = 0; for (const p of ps) d += p.depth; return d / ps.length;
  }
  function line(ctx, a, b, cam, style, w) {
    const pa = project(a, cam), pb = project(b, cam);
    ctx.strokeStyle = style; ctx.lineWidth = w || 1;
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    return (pa.depth + pb.depth) / 2;
  }
  function attachDrag(canvas, cam, redraw) {
    let drag = false, lx = 0, ly = 0;
    const down = (x, y) => { drag = true; lx = x; ly = y; };
    const move = (x, y) => {
      if (!drag) return;
      cam.yaw += (x - lx) * 0.01;
      cam.pitch += (y - ly) * 0.01;
      cam.pitch = Math.max(-1.45, Math.min(1.45, cam.pitch));
      lx = x; ly = y; redraw();
    };
    canvas.addEventListener('mousedown', e => down(e.clientX, e.clientY));
    window.addEventListener('mouseup', () => drag = false);
    window.addEventListener('mousemove', e => move(e.clientX, e.clientY));
    canvas.addEventListener('touchstart', e => { down(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    window.addEventListener('touchend', () => drag = false);
    window.addEventListener('touchmove', e => { if (drag) { move(e.touches[0].clientX, e.touches[0].clientY); } }, { passive: true });
    canvas.addEventListener('wheel', e => { e.preventDefault(); cam.scale *= (e.deltaY < 0 ? 1.08 : 0.93); cam.scale = Math.max(12, Math.min(400, cam.scale)); redraw(); }, { passive: false });
  }
  window.Lib3D = { camera, rotate, project, quad, line, attachDrag };
})();
