'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

const sections = ['top', 'question', 'led-history', 'led-principle', 'white-light', 'lidar-history', 'tof', 'point-cloud', 'future'];
const ledSteps = [
  ['未加偏压', '载流子分处两侧，结区势垒阻止持续注入。'],
  ['正向注入', '电子由 n 区、空穴由 p 区进入 InGaN 有源区。'],
  ['量子阱限域', '势阱把两类载流子限制在纳米尺度，提高波函数重叠。'],
  ['辐射复合', '电子跨越有效带隙与空穴复合，释放约 450 nm 蓝光。'],
];
const whiteModes = [
  ['蓝光芯片', '450 nm 窄峰', '蓝光仍然只是单色光。'],
  ['中性白光', '蓝峰＋荧光宽带', '部分蓝光透过，部分被下转换后共同形成白光。'],
  ['暖白高显色', '增强长波成分', '增加红色成分可改善暖色物体的呈现，但转换损耗也会变化。'],
];
const pointSteps = [
  ['一次回波', '一次测量只得到一个距离点。'],
  ['一条扫描线', '水平扫描角 θ 改变，点开始勾勒物体横截面。'],
  ['一帧点云', '再加入垂直角 φ，连续回波逐渐构成三维轮廓。'],
  ['机器理解', '位置和强度来自传感器；分类与检测来自后续算法。'],
];
const references = [
  ['Nobel Prize 2014：高效蓝光 LED', 'https://www.nobelprize.org/uploads/2018/06/advanced-physicsprize2014.pdf'],
  ['DOE：LED Basics', 'https://www.energy.gov/cmei/ssl/led-basics'],
  ['NASA：Intro to LIDAR 3D', 'https://svs.gsfc.nasa.gov/10757'],
  ['浙江大学：固态激光雷达研究进展', 'https://doi.org/10.12086/oee.2019.190218'],
  ['浙江大学光电学院：微梳—OPA 并行 FMCW LiDAR', 'https://doi.org/10.1038/s41467-025-56483-9'],
];

function StepButtons({ step, setStep, labels }: { step: number; setStep: (value: number) => void; labels: string[] }) {
  return <div className="step-buttons" aria-label="动画步骤">{labels.map((label, index) => (
    <button key={label} className={step === index ? 'active' : ''} onClick={() => setStep(index)}>
      <b>{String(index + 1).padStart(2, '0')}</b>{label}
    </button>
  ))}</div>;
}

function PointCloud({ stage, mode }: { stage: number; mode: 'distance' | 'intensity' | 'semantic' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const started = performance.now();
    const duration = stage === 2 ? 1500 : 900;
    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.max(1, Math.round(rect.width * ratio));
      const targetH = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== targetW || canvas.height !== targetH) { canvas.width = targetW; canvas.height = targetH; }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#07111b'; ctx.fillRect(0, 0, w, h);
      const points: Array<[number, number, number, number]> = [];
      for (let x = 20; x < w - 18; x += 11) {
        const y = h * .78 + Math.sin(x * .033) * 3;
        points.push([x, y, .35, 0]); if (x % 22 < 5) points.push([x, y + 28, .2, 0]);
      }
      for (let y = h * .31; y < h * .76; y += 8) {
        const t = (y - h * .31) / (h * .45);
        points.push([w * .29 - 23 + t * 7, y, .82, 1], [w * .29 + 23 - t * 7, y, .82, 1]);
      }
      for (let a = 0; a < Math.PI * 2; a += .25) points.push([w * .29 + Math.cos(a) * 19, h * .25 + Math.sin(a) * 23, .94, 1]);
      for (let x = w * .53; x < w * .88; x += 9) {
        const roof = Math.abs((x - w * .70) / (w * .18));
        points.push([x, h * (.56 + roof * .09), .78, 2], [x, h * .7, .72, 2]);
      }
      for (let a = 0; a < Math.PI * 2; a += .22) {
        points.push([w * .60 + Math.cos(a) * 27, h * .71 + Math.sin(a) * 27, .82, 2]);
        points.push([w * .81 + Math.cos(a) * 27, h * .71 + Math.sin(a) * 27, .82, 2]);
      }
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      let visible = 1;
      if (stage === 1) visible = Math.max(8, Math.floor(points.length * .18 * eased));
      if (stage >= 2) visible = Math.max(12, Math.floor(points.length * eased));
      const selected = points[Math.min(points.length - 1, Math.max(0, visible - 1))];
      if (stage <= 2 && selected) {
        ctx.strokeStyle = 'rgba(115,232,255,.34)'; ctx.lineWidth = 1; ctx.beginPath();
        ctx.moveTo(w * .08, h * .86); ctx.lineTo(selected[0], selected[1]); ctx.stroke();
      }
      points.slice(0, visible).forEach(([x, y, alpha, kind]) => {
        let color = 'rgba(106,221,255,' + alpha + ')';
        if (mode === 'distance') {
          const near = 1 - x / w;
          color = 'rgba(' + (80 + 180 * near) + ',' + (150 + 75 * (1 - near)) + ',' + (230 - 70 * near) + ',' + alpha + ')';
        }
        if (mode === 'intensity') {
          const v = Math.round(125 + alpha * 130);
          color = 'rgba(' + v + ',' + v + ',' + v + ',' + Math.min(1, alpha + .15) + ')';
        }
        if (mode === 'semantic') color = kind === 1 ? 'rgba(255,112,151,' + alpha + ')' : kind === 2 ? 'rgba(255,192,82,' + alpha + ')' : 'rgba(112,184,213,' + alpha + ')';
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, stage === 0 ? 3.6 : 1.55, 0, Math.PI * 2); ctx.fill();
      });
      if (stage === 3 && progress > .45) {
        ctx.setLineDash([5, 5]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,112,151,.65)';
        ctx.strokeRect(w * .23, h * .18, w * .12, h * .61); ctx.strokeStyle = 'rgba(255,192,82,.65)';
        ctx.strokeRect(w * .5, h * .46, w * .4, h * .31); ctx.setLineDash([]);
      }
      if (progress < 1) raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [stage, mode]);
  return <canvas ref={canvasRef} aria-label="从单次回波逐步形成行人、汽车与道路点云的动画" />;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState(0);
  const [ledStep, setLedStep] = useState(0);
  const [whiteMode, setWhiteMode] = useState(1);
  const [distance, setDistance] = useState(30);
  const [pulseKey, setPulseKey] = useState(0);
  const [pointStep, setPointStep] = useState(0);
  const [pointMode, setPointMode] = useState<'distance' | 'intensity' | 'semantic'>('distance');
  const [futureStep, setFutureStep] = useState(0);
  const [referencesOpen, setReferencesOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveSection(sections.indexOf(visible.target.id));
    }, { threshold: [.36, .62] });
    sections.forEach(id => { const element = document.getElementById(id); if (element) observer.observe(element); });
    return () => observer.disconnect();
  }, []);
  const scrollToSection = useCallback((index: number) => {
    document.getElementById(sections[Math.max(0, Math.min(sections.length - 1, index))])?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown' || event.key === 'PageDown') { event.preventDefault(); scrollToSection(activeSection + 1); }
      if (event.key === 'ArrowUp' || event.key === 'PageUp') { event.preventDefault(); scrollToSection(activeSection - 1); }
      if (event.key === 'Escape') setReferencesOpen(false);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [activeSection, scrollToSection]);
  const roundTrip = useMemo(() => (distance * 2 / 299792458 * 1e9).toFixed(0), [distance]);
  const echoPosition = 23 + (distance - 10) / 90 * 68;

  return (
    <main className="story">
      <header className="story-nav">
        <a href="#top" className="wordmark"><b>OPTICS / 02</b><span>光基科技与人类文明</span></a>
        <div className="nav-axis">
          <a className={activeSection <= 4 ? 'active' : ''} href="#led-history">01 让人看见</a><i />
          <a className={activeSection >= 5 && activeSection <= 7 ? 'active' : ''} href="#lidar-history">02 让机器看见</a><i />
          <a className={activeSection === 8 ? 'active' : ''} href="#future">03 主动光学</a>
        </div>
        <span className="section-count"><i>SYS · ONLINE</i>{String(activeSection + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}</span>
      </header>
      <div className="story-progress" aria-hidden="true"><i style={{ height: `${((activeSection + 1) / sections.length) * 100}%` }} /><span>SCROLL</span></div>

      <section className="story-hero" id="top">
        <div className="hero-scene hero-scene-lamp" /><div className="hero-scene hero-scene-car" /><div className="hero-vignette" /><div className="hero-grid" />
        <div className="hero-hud" aria-hidden="true"><span>EMISSION · 450 NM</span><span>TIME OF FLIGHT · ΔT</span><i /><i /></div>
        <div className="hero-title"><p>两件身边的光学仪器</p><h1>从书桌<br />到车前</h1>
          <div className="hero-thesis"><span><b className="warm-dot" />制造光，让人看见</span><span><b className="cyan-dot" />测量光，让机器看见</span></div>
        </div>
        <div className="light-path human-path"><span>LED</span><i /><span>书本</span><i /><strong>人眼</strong></div>
        <div className="light-path machine-path"><span>LiDAR</span><i /><span>行人</span><i className="return" /><strong>探测器</strong></div>
        <div className="spectrum-scale" aria-hidden="true"><span>380</span><i /><i /><i /><i /><i /><span>780 nm</span></div>
        <a className="scroll-cue" href="#question">沿着光，继续向下 <b>↓</b></a>
      </section>

      <section className="opening-question" id="question">
        <div className="question-copy"><p className="eyebrow">一天 · 两个动作</p><h2>按下台灯开关。<br />走过一辆汽车。</h2><p>两个再普通不过的瞬间，背后对应着光学技术的两次跨越：</p></div>
        <div className="question-pair">
          <article><span>01</span><h3>怎样高效地<br />制造白光？</h3><p>蓝光 LED 补齐固态照明缺失的短波光源。</p></article>
          <article><span>02</span><h3>怎样精确地<br />测量空间？</h3><p>激光雷达把纳秒级时间差换算成三维距离。</p></article>
        </div>
      </section>

      <section className="chapter-opening led-opening" id="led-history">
        <div className="chapter-photo led-photo" />
        <div className="chapter-copy"><p className="eyebrow warm">第一道难题 · 历史</p><h2>白光照明，<br />曾缺少最后一块拼图。</h2>
          <p>红光与绿光 LED 已经出现，高效蓝光却长期缺席。蓝光的突破不是“多一种颜色”，而是让固态白光照明真正成立。</p>
          <div className="history-line"><span><b>1960s</b>红光 LED</span><i /><span><b>1989</b>p-GaN</span><i /><span><b>1990s</b>InGaN 蓝光</span><i /><span><b>2014</b>Nobel</span></div>
        </div>
      </section>

      <section className="lab-section led-lab-section" id="led-principle">
        <div className="lab-copy"><p className="eyebrow blue">蓝光如何产生</p><h2>把载流子关进<br />纳米尺度的量子阱。</h2><p className="lab-intro">{ledSteps[ledStep][1]}</p>
          <div className="formula compact"><span>hν ≈ E<sub>transition</sub></span><b>450 nm ≈ 2.76 eV</b></div>
          <StepButtons step={ledStep} setStep={setLedStep} labels={ledSteps.map(item => item[0])} />
        </div>
        <div className={'led-stage led-step-' + ledStep}>
          <div className="device-title"><span>器件剖面</span><b>{ledSteps[ledStep][0]}</b></div>
          <div className="device-stack">
            <div className="p-layer"><span>p-GaN</span><div className="carrier hole h-one">h⁺</div><div className="carrier hole h-two">h⁺</div></div>
            <div className="mqw-layer"><span>InGaN / GaN MQW</span><i /><i /><i /><div className="recombination">hν</div></div>
            <div className="n-layer"><span>n-GaN</span><div className="carrier electron e-one">e⁻</div><div className="carrier electron e-two">e⁻</div></div>
          </div>
          <div className="band-panel"><div className="energy-axis"><span>E</span><i /></div><div className="band-row conduction"><b>E<sub>c</sub></b><i /><i /><i /></div><div className="transition-arrow"><span>电子跃迁</span></div><div className="band-row valence"><b>E<sub>v</sub></b><i /><i /><i /></div><div className="photon-wave"><i /><i /><i /><i /></div></div>
          <p className="stage-note">示意图不按尺度绘制</p>
        </div>
      </section>

      <section className="lab-section white-lab-section" id="white-light">
        <div className="lab-copy"><p className="eyebrow warm">从蓝光到白光 · 现实</p><h2>白光不是一种光，<br />而是一组光谱。</h2><p className="lab-intro">{whiteModes[whiteMode][2]}</p>
          <div className="mode-tabs">{whiteModes.map((mode,index)=><button key={mode[0]} className={whiteMode===index?'active':''} onClick={()=>setWhiteMode(index)}>{mode[0]}</button>)}</div>
          <div className="metric-row"><span><b>看亮度</b>照度</span><span><b>看颜色</b>显色</span><span><b>看时间</b>频闪与节律</span></div>
        </div>
        <div className={'white-stage white-mode-' + whiteMode}>
          <div className="package-demo"><div className="blue-chip">InGaN<span>450 nm</span></div><div className="blue-rays"><i /><i /><i /><i /><i /></div><div className="phosphor-layer"><span>荧光粉</span><b>吸收 · 弛豫 · 再发射</b></div><div className="converted-rays"><i /><i /><i /><i /><i /></div><div className="white-output">白光</div></div>
          <div className="spectrum-panel"><div className="spectrum-grid" /><div className="spectral-blue"><span>蓝光窄峰</span></div><div className="spectral-wide"><span>荧光宽带</span></div><div className="spectrum-axis"><span>400</span><span>500</span><span>600</span><span>700 nm</span></div><strong>{whiteModes[whiteMode][1]}</strong></div>
        </div>
      </section>

      <section className="chapter-opening lidar-opening" id="lidar-history">
        <div className="chapter-copy"><p className="eyebrow cyan">第二道难题 · 历史</p><h2>机器看见了行人，<br />但他究竟有多远？</h2><p>摄像头提供纹理与语义，距离却不是每个像素直接给出的量。LiDAR 选择了一种更主动的方法：发出光，再给光的往返计时。</p>
          <div className="history-line dark-line"><span><b>1964</b>卫星激光测距</span><i /><span><b>2000s</b>无人车与机器人</span><i /><span><b>今天</b>走上日常道路</span></div>
        </div>
        <div className="chapter-photo lidar-photo" />
      </section>

      <section className="lab-section tof-lab-section" id="tof">
        <div className="lab-copy"><p className="eyebrow cyan">直接飞行时间 · dToF</p><h2>给光按下一块<br />纳秒级秒表。</h2><p className="lab-intro">空间距离越远，时间轴上的回波峰就越向右移动。</p>
          <div className="formula tof-equation"><span>R = cΔt / 2</span><b>{distance} m ↔ {roundTrip} ns</b></div>
          <label className="distance-control"><span>目标距离</span><input type="range" min="10" max="100" value={distance} onChange={event=>setDistance(Number(event.target.value))}/><strong>{distance} m</strong></label>
          <button className="primary-action" onClick={()=>setPulseKey(value=>value+1)}>发射一次 <b>→</b></button>
        </div>
        <div className="tof-stage">
          <div className="space-view"><div className="sensor-object"><i /><span>LiDAR</span></div><div className="target-object" style={{left:echoPosition+'%'}}><i /><span>行人 · {distance} m</span></div><div className="range-line" style={{width:(echoPosition-11)+'%'}}><span>{distance} m</span></div>
            <div className={pulseKey > 0 ? 'pulse-sequence fired' : 'pulse-sequence'} key={pulseKey} style={{'--target':echoPosition+'%','--pulse-time':Math.max(1.25,distance/45)+'s'} as CSSProperties}><i className="outgoing-pulse"/><i className="return-pulse"/></div>
          </div>
          <div className={pulseKey > 0 ? 'time-view fired' : 'time-view'} key={'time-'+pulseKey}><div className="plot-label"><span>探测信号</span><b>Δt = {roundTrip} ns</b></div><div className="time-axis"><i /><span>0</span><span>时间 / ns</span></div><div className="signal-peak launch-peak"><span>发射</span></div><div className="signal-peak echo-peak" style={{left:echoPosition+'%'}}><span>回波</span></div><div className="delta-bracket" style={{left:'15%',width:(echoPosition-15)+'%'}}><span>Δt</span></div></div>
          <p className="stage-note">动画已将光速大幅放慢，仅用于显示因果关系</p>
        </div>
      </section>

      <section className="lab-section point-lab-section" id="point-cloud">
        <div className="lab-copy"><p className="eyebrow cyan">从一次回波到三维世界</p><h2>一个点，怎样长成<br />机器眼中的道路？</h2><p className="lab-intro">{pointSteps[pointStep][1]}</p>
          <div className="coordinate-chain"><span>Δt</span><i>→</i><span>R, θ, φ</span><i>→</i><span>x, y, z</span><i>→</i><b>点云</b></div>
          <StepButtons step={pointStep} setStep={setPointStep} labels={pointSteps.map(item=>item[0])}/>
        </div>
        <div className="point-stage"><div className="cloud-frame"><PointCloud stage={pointStep} mode={pointMode}/><span className="cloud-live">LIVE · SCAN {pointStep+1}/4</span><span className="cloud-legend">{pointStep===3?'位置来自光学 · 类别来自算法':'R + θ + φ'}</span></div>
          <div className="point-modes"><span>点的颜色表示</span>{(['distance','intensity','semantic'] as const).map(mode=><button key={mode} className={pointMode===mode?'active':''} onClick={()=>setPointMode(mode)}>{mode==='distance'?'距离':mode==='intensity'?'反射强度':'语义结果'}</button>)}</div>
          <div className="sensor-roles"><span><b>LiDAR</b>三维几何</span><span><b>Camera</b>纹理语义</span><span><b>Radar</b>速度与全天候</span></div>
        </div>
      </section>

      <section className="future-section" id="future">
        <div className="future-heading"><p className="eyebrow">未来 · 从器件到主动光电系统</p><h2>不只是发光或收光，<br />而是控制光。</h2></div>
        <div className="future-paths"><article className="future-path warm-path"><span>LED 台灯</span><div><b>固定白光</b><i/>多通道光谱<i/>人因照明</div><p>合适的光，在合适的时间，到达合适的位置。</p></article><article className="future-path cyan-path"><span>车载 LiDAR</span><div><b>机械扫描</b><i/>固态扫描<i/>光子芯片</div><p>更小、更可靠，并同时获取距离与径向速度。</p></article></div>
        <div className="research-showcase">
          <div className="research-copy"><p>浙江大学光电学院 · 2025</p><h3>微梳 × OPA × FMCW</h3><div className="research-tabs">{['微梳并行通道','OPA 无机械扫描','FMCW 相干测距'].map((label,index)=><button key={label} className={futureStep===index?'active':''} onClick={()=>setFutureStep(index)}>{label}</button>)}</div><p className="research-explain">{['一个泵浦源产生多条等间隔相干波长，为并行测量提供通道。','阵元相位梯度改变，远场主瓣随之偏转，不依赖宏观旋转机构。','发射扫频光与延迟回波相干混频，拍频中编码距离与径向速度。'][futureStep]}</p><a href="https://doi.org/10.1038/s41467-025-56483-9" target="_blank" rel="noreferrer">Nature Communications 16, 1056 →</a></div>
          <div className={'future-animation future-step-'+futureStep}><div className="microcomb"><i/><i/><i/><i/><i/><i/></div><div className="opa-array"><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="steered-beams"><i/><i/><i/><i/></div><div className="chirp-chart"><i className="tx"/><i className="rx"/><span>f<sub>b</sub></span></div><img src="/zju-fmcw-lidar.png" alt="浙江大学微梳结合光学相控阵并行FMCW激光雷达系统图"/></div>
        </div>
        <blockquote>蓝光 LED 改变了人看世界的条件；<br/>激光雷达正在改变机器认识世界的方式。</blockquote>
        <footer className="story-footer"><span>图片授权信息见资料来源</span><button onClick={()=>setReferencesOpen(true)}>资料与图片来源 ↗</button><a href="#top">回到开头 ↑</a></footer>
      </section>

      {referencesOpen&&<div className="reference-backdrop" role="dialog" aria-modal="true" onClick={event=>{if(event.target===event.currentTarget)setReferencesOpen(false)}}>
        <section className="reference-modal"><header><p className="eyebrow cyan">REFERENCES</p><button onClick={()=>setReferencesOpen(false)}>×</button></header><h2>资料与图片来源</h2><ol>{references.map(([label,url])=><li key={url}><a href={url} target="_blank" rel="noreferrer">{label}</a></li>)}</ol><p>台灯照片：Yury Rymko / Pexels；车辆照片：MB-one / CC BY-SA 4.0；LED 灯板：Raimond Spekking / CC BY-SA 4.0。浙大论文系统图原图未改动，CC BY-NC-ND 4.0。</p></section>
      </div>}
    </main>
  );
}
