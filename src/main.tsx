import React,{useEffect,useRef,useState,useCallback} from 'react';
import{createRoot}from'react-dom/client';
import{getDocument,GlobalWorkerOptions,type PDFDocumentProxy}from'pdfjs-dist';
import workerUrl from'pdfjs-dist/build/pdf.worker.min.mjs?url';
import'./style.css';
GlobalWorkerOptions.workerSrc=workerUrl;
type Preset='book'|'comfort'|'accessible'|'focus';
const modes:Preset[]=['book','comfort','accessible','focus'];
function App(){
 const[file,setFile]=useState<File|null>(null);
 const[pdf,setPdf]=useState<PDFDocumentProxy|null>(null);
 const[page,setPage]=useState(1);
 const[zoom,setZoom]=useState(1);
 const[preset,setPreset]=useState<Preset>(()=>(localStorage.getItem('folio-preset')as Preset)||'book');
 const[error,setError]=useState('');
 const canvas=useRef<HTMLCanvasElement>(null);
 const [viewportWidth,setViewportWidth]=useState(()=>window.innerWidth);
 const [turning,setTurning]=useState(false);
 const [spread,setSpread]=useState(false);
 const [loading,setLoading]=useState(false);
 const [docKey,setDocKey]=useState('');
 const [resume,setResume]=useState(1);
 const renderTaskRef=useRef<any>(null);
 const requestId=useRef(0);
 const go=useCallback((direction:number)=>{if(!pdf||turning)return;const next=Math.max(1,Math.min(pdf.numPages,page+direction*(preset==='book'&&spread?2:1)));if(next===page)return;if(preset==='book'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){setTurning(true);window.setTimeout(()=>{setPage(next);setTurning(false)},180)}else setPage(next)},[pdf,page,preset,spread,turning]);
 useEffect(()=>{const update=()=>setViewportWidth(window.innerWidth);window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update)},[]);
 useEffect(()=>{if(preset!=='book'||viewportWidth<980)setSpread(false)},[preset,viewportWidth]);
 useEffect(()=>{const handler=(e:KeyboardEvent)=>{if(!pdf||['INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName))return;if(e.key==='ArrowRight'||e.key==='PageDown'){e.preventDefault();go(1)}if(e.key==='ArrowLeft'||e.key==='PageUp'){e.preventDefault();go(-1)}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)},[pdf,go]);
 useEffect(()=>{if(pdf&&docKey)localStorage.setItem('folio-progress:'+docKey,String(page))},[pdf,docKey,page]);
 useEffect(()=>{localStorage.setItem('folio-preset',preset)},[preset]);
 useEffect(()=>{if(!file)return;let active=true;setLoading(true);setPdf(null);const key=[file.name,file.size,file.lastModified].join(':');setDocKey(key);const task=file.arrayBuffer().then(buffer=>getDocument({data:new Uint8Array(buffer)}).promise);task.then(doc=>{if(!active){void doc.destroy();return}const saved=Number(localStorage.getItem('folio-progress:'+key)||1);const initial=Number.isFinite(saved)?Math.min(doc.numPages,Math.max(1,saved)):1;setResume(initial);setPdf(doc);setPage(initial);setError('');setLoading(false)}).catch(()=>{if(active){setError('This PDF could not be opened.');setLoading(false)}});return()=>{active=false;task.then(doc=>doc.destroy()).catch(()=>{})}},[file]);
 useEffect(()=>{if(!pdf||!canvas.current)return;let stopped=false;const id=++requestId.current;const c=canvas.current;const render=async()=>{try{renderTaskRef.current?.cancel();const p=await pdf.getPage(page);if(stopped||id!==requestId.current)return;const width=Math.min(viewportWidth-(viewportWidth<780?32:310),spread?560:850);const base=p.getViewport({scale:1});const viewport=p.getViewport({scale:Math.max(.25,width/base.width)*zoom});const ctx=c.getContext('2d');if(!ctx)return;const ratio=Math.min(window.devicePixelRatio||1,2);c.width=Math.ceil(viewport.width*ratio);c.height=Math.ceil(viewport.height*ratio);c.style.width=viewport.width+'px';c.style.height=viewport.height+'px';ctx.setTransform(ratio,0,0,ratio,0,0);const task=p.render({canvasContext:ctx,viewport});renderTaskRef.current=task;await task.promise}catch(e:any){if(!stopped&&e?.name!=='RenderingCancelledException')setError('Unable to render this page.')}};void render();return()=>{stopped=true;renderTaskRef.current?.cancel()}},[pdf,page,zoom,viewportWidth,spread]);
 const open=(f?:File)=>{if(f&&(/\.pdf$/i.test(f.name)||f.type==='application/pdf'))setFile(f);else setError('Please select a PDF document.')};
 return <main data-preset={preset}>
 <header><a className="logo" href="/">◧ Folio</a><span className="tagline">A better place to read.</span><label className="upload small">Open PDF<input type="file" accept=".pdf,application/pdf" onChange={e=>{open(e.target.files?.[0]);e.target.value=''}}/></label></header>
 {loading&&<div className="loading" role="status">Opening your document…</div>}
 {!pdf?<section className="welcome"><span className="eyebrow">YOUR PERSONAL READING SPACE</span><h1>Make room for <em>reading.</em></h1><p>Open a PDF and choose the experience that feels right for you. Free, private, and designed for every screen.</p><label className="drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();open(e.dataTransfer.files[0])}}><span className="drop-icon">↥</span><strong>Drop a PDF here, or browse files</strong><small>Documents stay on your device.</small><input type="file" accept=".pdf,application/pdf" onChange={e=>open(e.target.files?.[0])}/></label><h2>Read your way</h2><div className="cards">{modes.map(m=><button key={m} className={'mode '+m} onClick={()=>setPreset(m)}><span className="symbol">{m==='book'?'◫':m==='comfort'?'☼':m==='accessible'?'◎':'◇'}</span><strong>{m}</strong><small>{m==='book'?'Paper-like pages':m==='comfort'?'Calm and gentle':m==='accessible'?'High contrast': 'Distraction-free'}</small>{preset===m&&<span className="chosen">Selected</span>}</button>)}</div></section>:<section className="workspace"><aside><p className="eyebrow">READING EXPERIENCE</p><div className="modes">{modes.map(m=><button className={preset===m?'selected':''} key={m} onClick={()=>setPreset(m)}>{m[0].toUpperCase()+m.slice(1)}</button>)}</div><p className="eyebrow">DOCUMENT</p><p className="filename">{file?.name}</p><p>{pdf.numPages} pages</p><p className="hint">Original PDF pages are preserved. Book Mode adds a gentle turn transition. Full 3D page curling and text reflow are future improvements.</p>{resume>1&&<p className="hint">Resumed at page {resume}</p>}</aside><article className="reading"><div className="toolbar">{preset==='book'&&viewportWidth>=980&&<button aria-pressed={spread} onClick={()=>setSpread(v=>!v)}>{spread?'Single page':'Book spread'}</button>}<button disabled={page<=1} onClick={()=>go(-1)} aria-label="Previous page">←</button><span>Page {page} of {pdf.numPages}</span><button disabled={page>=pdf.numPages} onClick={()=>go(1)} aria-label="Next page">→</button><span className="separator"/><button onClick={()=>setZoom(z=>Math.max(.5,z-.1))} aria-label="Zoom out">−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(2,z+.1))} aria-label="Zoom in">+</button></div><div className={"page "+(preset==="book"?"book-page ":"")+(turning?"turning":"")}><canvas ref={canvas}/>{spread&&preset==="book"&&<div className="spread-note">Two-page layout preview · Next page follows using the arrow controls</div>}</div></article></section>}
 {error&&<div role="alert" className="error">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
 <footer>Made for comfortable reading · Your files stay local · Free forever</footer>
 </main>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);