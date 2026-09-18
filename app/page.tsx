'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const scripts = [
  '我们每天都在使用光学仪器，但很多时候并没有意识到。晚上坐在书桌前，我打开一盏 LED 台灯；白天走到路边，一些汽车正在用人眼看不见的激光观察我。这两件仪器都在发光，但一束光是为了让人看见，另一束光是为了让机器看见。接下来我想从这两个非常具体的生活场景出发，讨论它们怎样出现、今天发挥什么作用，以及以后会走向哪里。',
  '第一件仪器是书桌上的 LED 台灯。表面上，我们只是按下开关；内部却经历了从半导体芯片发出蓝光、再由荧光材料形成白光的过程。早期红光和绿光 LED 已经出现，但高效蓝光长期缺失。20 世纪八九十年代，高质量 GaN 外延、p 型 GaN 和 InGaN 有源区取得突破，蓝光 LED 才真正实用。2014 年诺贝尔物理学奖表彰了这一发明。它的历史作用不是多了一种颜色，而是补齐了高效白光照明所需的关键短波光源。',
  '蓝光 LED 的核心是正向偏置的半导体结。n 区电子和 p 区空穴被注入 InGaN/GaN 多量子阱，在很小的有源区内发生辐射复合，把能量以光子形式释放。光子能量近似等于有效带隙，E 等于 hν，也等于 hc 除以 λ。450 纳米蓝光的光子能量约为 2.76 电子伏特。异质结和量子阱的意义，是把电子与空穴限制在一起，提高辐射复合概率。蓝光之所以难，还涉及宽禁带材料的 p 型掺杂、晶格失配、极化场和缺陷控制。',
  '蓝光 LED 本身并不发白光。常见台灯让一部分蓝光直接透过，另一部分蓝光激发荧光粉，转换成较长波长的黄绿和红光；这些光混合后才被人眼感知为白色。现实中的台灯也不能只看功率，还要看照度、显色指数、色温、频闪和光谱分布。未来照明的重点不再只是更亮、更省电，而是根据时间、环境和使用者调节光谱，让合适的光在合适的时间到达合适的位置。',
  '第二件仪器是车载激光雷达。在一些国产智能汽车上，车顶或车头的小型凸起就是它。最直观的测距方式是直接飞行时间法：发射一个短激光脉冲，记录它被目标反射后返回的时间，距离等于光速乘往返时间再除以二。假设行人在 30 米外，光往返 60 米，只需要约 200 纳秒。激光测距早期用于卫星和月球测量，后来进入测绘与机器人领域，现在走到了日常道路上。',
  '一次回波只能得到一个距离。雷达再结合水平和垂直扫描角度，把极坐标转换为三维坐标，连续测量便形成点云。点云中的每个点不仅有位置，还可能带有回波强度等信息，算法据此识别道路、汽车和行人。激光雷达提供精确的三维几何信息，但不能单独完成自动驾驶；它仍要与摄像头、毫米波雷达、定位和决策系统配合。雨雾、强日光、低反射率目标和多雷达串扰，也都是现实限制。',
  '两件仪器都在走向更主动、更集成的光电系统。台灯将从固定白光走向多通道、节律友好的智能光环境；车载雷达则从旋转机械结构走向固态化、芯片化和相干探测。浙大光电学院团队在 2025 年展示了微梳结合硅基光学相控阵的并行 FMCW 激光雷达：多个相干波长通道并行工作，OPA 无机械地偏转光束，相干拍频同时提取距离和径向速度。回到题目，蓝光 LED 台灯改变了人类看世界的条件，车载激光雷达正在改变机器认识世界的方式。'
];

const sourceLinks = [
  ['诺贝尔奖：高效蓝光 LED 的科学背景', 'https://www.nobelprize.org/uploads/2018/06/advanced-physicsprize2014.pdf'],
  ['美国能源部：LED Basics', 'https://www.energy.gov/cmei/ssl/led-basics'],
  ['NASA：卫星激光测距的起点', 'https://www.nasa.gov/technology/how-satellite-laser-ranging-got-its-start-50-years-ago/'],
  ['浙大：固态激光雷达研究进展', 'https://doi.org/10.12086/oee.2019.190218'],
  ['浙大光电学院：微梳与 OPA 并行 FMCW LiDAR', 'https://doi.org/10.1038/s41467-025-56483-9'],
];

function PointCloud() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let frame = 0;
    let animation = 0;

    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== rect.width * ratio || canvas.height !== rect.height * ratio) {
        canvas.width = rect.width * ratio;
        canvas.height = rect.height * ratio;
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#06101d';
      ctx.fillRect(0, 0, w, h);

      const scan = (frame % 240) / 240 * w;
      const points: Array<[number, number, number]> = [];
      for (let x = 0; x < w; x += 12) {
        const roadY = h * .78 + Math.sin(x * .035) * 3;
        points.push([x, roadY, .45]);
        if (x % 24 === 0) points.push([x, roadY + 28, .24]);
      }
      for (let y = h * .31; y < h * .76; y += 9) {
        const t = (y - h * .31) / (h * .45);
        points.push([w * .31 - 24 + t * 7, y, .9]);
        points.push([w * .31 + 24 - t * 7, y, .9]);
      }
      for (let a = 0; a < Math.PI * 2; a += .28) {
        points.push([w * .31 + Math.cos(a) * 20, h * .25 + Math.sin(a) * 24, 1]);
      }
      for (let x = w * .55; x < w * .86; x += 10) {
        const roof = Math.abs((x - w * .7) / (w * .16));
        points.push([x, h * (.58 + roof * .08), .82]);
        points.push([x, h * .7, .76]);
      }
      for (let a = 0; a < Math.PI * 2; a += .25) {
        points.push([w * .61 + Math.cos(a) * 28, h * .71 + Math.sin(a) * 28, .85]);
        points.push([w * .8 + Math.cos(a) * 28, h * .71 + Math.sin(a) * 28, .85]);
      }

      points.forEach(([x, y, alpha]) => {
        if (x > scan + 55) return;
        const proximity = Math.max(0, 1 - Math.abs(x - scan) / 90);
        ctx.fillStyle = `rgba(${90 + proximity * 80}, ${205 + proximity * 40}, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, 1.4 + proximity * 1.2, 0, Math.PI * 2);
        ctx.fill();
      });
      const gradient = ctx.createLinearGradient(scan - 55, 0, scan + 20, 0);
      gradient.addColorStop(0, 'rgba(75,225,255,0)');
      gradient.addColorStop(1, 'rgba(75,225,255,.2)');
      ctx.fillStyle = gradient;
      ctx.fillRect(scan - 55, 0, 75, h);
      frame += 1;
      animation = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animation);
  }, []);

  return <canvas ref={canvasRef} className="point-cloud" aria-label="激光雷达扫描生成行人与车辆点云的动画" />;
}

export default function Home() {
  const [slide, setSlide] = useState(0);
  const [notesOpen, setNotesOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [lampOpen, setLampOpen] = useState(false);
  const [forwardBias, setForwardBias] = useState(false);
  const [phosphor, setPhosphor] = useState(54);
  const [distance, setDistance] = useState(30);
  const touchStart = useRef<number | null>(null);

  const go = useCallback((next: number) => {
    setSlide(Math.max(0, Math.min(6, next)));
    setNotesOpen(false);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') go(slide + 1);
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') go(slide - 1);
      if (event.key.toLowerCase() === 's') setNotesOpen((value) => !value);
      if (event.key === 'Escape') { setNotesOpen(false); setSourcesOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, slide]);

  const roundTrip = useMemo(() => (distance * 2 / 299792458 * 1e9).toFixed(0), [distance]);
  const cct = Math.round(6700 - phosphor * 52);

  return (
    <main
      className="presentation-shell"
      onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return;
        const delta = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 55) go(slide + (delta < 0 ? 1 : -1));
        touchStart.current = null;
      }}
    >
      <header className="topbar">
        <span className="course-label">光基科技与人类文明</span>
        <nav className="chapter-nav" aria-label="章节">
          <span className={slide <= 3 ? 'active' : ''}>LED 台灯</span>
          <i aria-hidden="true" />
          <span className={slide >= 4 ? 'active' : ''}>车载激光雷达</span>
        </nav>
        <span className="slide-count">{String(slide + 1).padStart(2, '0')} / 07</span>
      </header>

      <div className="slides" style={{ transform: `translateX(-${slide * 100}vw)` }}>
        <section className="slide hero-slide" aria-label="封面">
          <div className="hero-image hero-lamp" aria-hidden="true" />
          <div className="hero-image hero-car" aria-hidden="true" />
          <div className="hero-shade" aria-hidden="true" />
          <div className="hero-copy">
            <p className="eyebrow">两件身边的光学仪器</p>
            <h1>从书桌<br />到车前</h1>
            <p className="hero-deck"><span>一束光让人看见</span><span>一束光让机器看见</span></p>
            <button className="pill-button" type="button" onClick={() => go(1)}>开始讲述 <b>→</b></button>
          </div>
          <div className="scene-label scene-label-left"><b>01</b><span>书桌上的 LED 台灯</span></div>
          <div className="scene-label scene-label-right"><b>02</b><span>道路上的车载激光雷达</span></div>
        </section>

        <section className="slide lamp-slide" aria-label="书桌上的LED台灯">
          <div className="content-wrap split-layout">
            <div className="copy-block">
              <p className="section-kicker warm">仪器一 · 身边</p>
              <h2>书桌上的<br />LED 台灯</h2>
              <p className="lead">每天按下的开关，连接着一场材料革命。</p>
              <div className="timeline compact-timeline">
                <span><b>1989</b> p-GaN</span><span><b>1990s</b> InGaN 蓝光</span><span><b>2014</b> Nobel</span><span><b>今天</b> 固态照明</span>
              </div>
            </div>
            <button className={`lamp-reveal ${lampOpen ? 'open' : ''}`} onClick={() => setLampOpen(!lampOpen)} aria-pressed={lampOpen}>
              <img src={lampOpen ? '/led-board.jpg' : '/desk-lamp.jpg'} alt={lampOpen ? 'LED台灯内部的SMD灯板' : '书桌上的台灯'} />
              <span>{lampOpen ? '回到日常' : '拆开灯头'} <b>↗</b></span>
            </button>
          </div>
          <p className="source-note">图片：Yury Rymko / Pexels；Raimond Spekking / CC BY-SA 4.0</p>
        </section>

        <section className="slide principle-slide" aria-label="蓝光LED原理">
          <div className="content-wrap principle-grid">
            <div className="copy-block">
              <p className="section-kicker blue">原理 · 蓝光为什么难</p>
              <h2>把电子与空穴<br />关进量子阱</h2>
              <div className="formula-card"><span>E<sub>photon</sub> ≈ E<sub>g</sub> = hc / λ</span><strong>450 nm → 2.76 eV</strong></div>
              <p className="micro-copy">GaN 宽禁带 · InGaN 调波长 · 多量子阱限域</p>
            </div>
            <div className={`band-diagram ${forwardBias ? 'biased' : ''}`}>
              <div className="band-label p-label">p-GaN<br /><small>空穴注入</small></div>
              <div className="quantum-wells" aria-hidden="true"><i /><i /><i /></div>
              <div className="band-label n-label">n-GaN<br /><small>电子注入</small></div>
              <div className="carrier electron e1">e⁻</div><div className="carrier electron e2">e⁻</div>
              <div className="carrier hole h1">h⁺</div><div className="carrier hole h2">h⁺</div>
              <div className="photon">hν</div>
              <p>InGaN / GaN 多量子阱</p>
              <button className="control-button" onClick={() => setForwardBias(!forwardBias)}>{forwardBias ? '复位' : '加正向电压'}</button>
            </div>
          </div>
          <p className="source-note">科学背景：The Nobel Prize in Physics 2014</p>
        </section>

        <section className="slide white-light-slide" aria-label="蓝光LED产生白光">
          <div className="content-wrap">
            <p className="section-kicker warm">现实 · 从蓝光到白光</p>
            <div className="headline-row"><h2>不是“白色芯片”<br />而是光谱混合</h2><p>蓝光直出<br /><b>＋</b><br />荧光粉下转换</p></div>
            <div className="spectrum-lab">
              <div className="spectrum-plot" aria-label="简化的白光LED光谱">
                <div className="grid-lines" aria-hidden="true" />
                <div className="blue-peak" style={{ height: `${88 - phosphor * .45}%` }}><span>450 nm</span></div>
                <div className="phosphor-band" style={{ opacity: .35 + phosphor / 120 }}><span>荧光粉宽谱</span></div>
                <div className="axis-labels"><span>400</span><span>500</span><span>600</span><span>700 nm</span></div>
              </div>
              <div className="spectrum-control">
                <label htmlFor="phosphor">荧光粉转换比例</label>
                <input id="phosphor" type="range" min="20" max="80" value={phosphor} onChange={(event) => setPhosphor(Number(event.target.value))} />
                <strong>≈ {cct} K</strong>
                <div className="quality-tags"><span>照度</span><span>显色</span><span>频闪</span><span>节律</span></div>
              </div>
            </div>
          </div>
          <p className="source-note">数据关系参考：DOE LED Basics；光谱原图：Jcb1976 / CC BY-SA 4.0</p>
        </section>

        <section className="slide tof-slide" aria-label="车载激光雷达飞行时间测距">
          <div className="lidar-photo" aria-hidden="true" />
          <div className="lidar-overlay" aria-hidden="true" />
          <div className="content-wrap lidar-content">
            <p className="section-kicker cyan">仪器二 · 身边</p>
            <h2>车上的<br />激光雷达</h2>
            <p className="lead">一次往返，把“看见”变成时间测量。</p>
            <div className="tof-card">
              <div className="tof-formula">R = cΔt / 2</div>
              <div className="tof-live"><span>目标距离</span><strong>{distance} m</strong><span>往返时间</span><strong>{roundTrip} ns</strong></div>
              <input aria-label="改变目标距离" type="range" min="10" max="100" value={distance} onChange={(event) => setDistance(Number(event.target.value))} />
              <div className="beam-track"><i style={{ animationDuration: `${Math.max(1.2, distance / 24)}s` }} /></div>
            </div>
            <div className="mini-history"><span><b>1964</b> 卫星测距</span><i>→</i><span><b>2000s</b> 无人车</span><i>→</i><span><b>今天</b> 走上街道</span></div>
          </div>
          <p className="source-note">车辆图片：MB-one / CC BY-SA 4.0；历史资料：NASA</p>
        </section>

        <section className="slide point-slide" aria-label="激光雷达点云">
          <div className="content-wrap point-grid">
            <div className="copy-block">
              <p className="section-kicker cyan">原理 · 从距离到空间</p>
              <h2>一个回波<br />怎样成为三维世界？</h2>
              <div className="data-chain"><span>Δt</span><i>→</i><span>R, θ, φ</span><i>→</i><span>x, y, z</span><i>→</i><b>点云</b></div>
              <div className="sensor-list"><span>几何：LiDAR</span><span>纹理：Camera</span><span>速度：Radar</span></div>
            </div>
            <div className="cloud-frame">
              <PointCloud />
              <span className="cloud-status">LIVE · 3D POINT CLOUD</span>
              <span className="cloud-legend">行人　车辆　道路</span>
            </div>
          </div>
        </section>

        <section className="slide future-slide" aria-label="未来发展与总结">
          <div className="content-wrap future-wrap">
            <p className="section-kicker future">未来 · 两条路径，同一个方向</p>
            <h2>光，正在变得更主动</h2>
            <div className="future-columns">
              <article className="future-card warm-card">
                <span>LED 台灯</span><h3>从照亮房间<br />到调控光环境</h3>
                <ul><li>多通道可调光谱</li><li>节律友好照明</li><li>感知与通信融合</li></ul>
              </article>
              <article className="future-card research-card">
                <img src="/zju-fmcw-lidar.png" alt="浙江大学微梳结合光学相控阵的并行FMCW激光雷达论文系统图" />
                <div><span>浙江大学光电学院 · 2025</span><h3>微梳 × OPA × FMCW</h3><p>并行 · 相干 · 无机械扫描</p></div>
              </article>
              <article className="future-card cyan-card">
                <span>车载激光雷达</span><h3>从旋转机械<br />到光子芯片</h3>
                <ul><li>固态光束扫描</li><li>距离与径向速度</li><li>多传感器融合</li></ul>
              </article>
            </div>
            <blockquote>蓝光 LED 改变了人看世界的条件；<br />激光雷达正在改变机器认识世界的方式。</blockquote>
          </div>
          <p className="source-note">Chen et al., Nature Communications 16, 1056 (2025) · 原图未改动 · CC BY-NC-ND 4.0</p>
        </section>
      </div>

      <footer className="controls">
        <button onClick={() => go(slide - 1)} disabled={slide === 0} aria-label="上一页">←</button>
        <div className="progress" aria-label={`第 ${slide + 1} 页，共 7 页`}><i style={{ width: `${(slide + 1) / 7 * 100}%` }} /></div>
        <button onClick={() => go(slide + 1)} disabled={slide === 6} aria-label="下一页">→</button>
        <button className="text-control" onClick={() => setNotesOpen(!notesOpen)} aria-expanded={notesOpen}>讲稿 S</button>
        <button className="text-control" onClick={() => setSourcesOpen(true)}>来源</button>
      </footer>

      <aside className={`speaker-notes ${notesOpen ? 'open' : ''}`} aria-hidden={!notesOpen}>
        <div><span>第 {slide + 1} 页讲稿</span><button onClick={() => setNotesOpen(false)}>×</button></div>
        <p>{scripts[slide]}</p>
      </aside>

      {sourcesOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="资料来源">
          <section className="source-modal"><div><p className="section-kicker cyan">REFERENCES</p><button onClick={() => setSourcesOpen(false)}>×</button></div><h2>资料与图片来源</h2><ol>{sourceLinks.map(([label, url]) => <li key={url}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>)}</ol><p>图片授权与作者信息见各页面底部。演示中的能带、光谱、飞行时间和点云动画均为本网页原创表达。</p></section>
        </div>
      )}
    </main>
  );
}
