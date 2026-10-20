import React,{useEffect,useRef,useState} from 'react';
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
 useEffect(()=>{localStorage.setItem('folio-preset',preset)},[preset]);
 useEffect(()=>{if(!file)return;let cancelled=false;const task=getDocument({data:new Uint8Array([])});void task;},[]);
 useEffect(()=>{if(!file)return;let active=true;file.arrayBuffer().then(buffer=>getDocument({data:new Uint8Array(buffer)}).promise).then(doc=>{if(active){setPdf(doc);setPage(1);setError('')}}).catch(()=>{if(active)setError('This PDF could not be opened.')});return()=>{active=false}},[file]);
 useEffect(()=>{if(!pdf||!canvas.current)return;let stopped=false;let renderTask:any;
 pdf.getPage(page).then(p=>{if(stopped)return;const width=Math.min(window.innerWidth-40,850);const base=p.getViewport({scale:1});const viewport=p.getViewport({scale:Math.max(.3,width/base.width)*zoom});const c=canvas.current!;const ctx=c.getContext('2d');if(!ctx)return;c.width=Math.ceil(viewport.width*devicePixelRatio);c.height=Math.ceil(viewport.height*devicePixelRatio);c.style.width=viewport.width+'px';c.style.height=viewport.height+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);renderTask=p.render({canvasContext:ctx,viewport});return renderTask.promise}).catch(e=>{if(e?.name!=='RenderingCancelledException')setError('Unable to render this page.')});return()=>{stopped=true;renderTask?.cancel()}},[pdf,page,zoom]);
 const open=(f?:File)=>{if(f&&(/\.pdf$/i.test(f.name)||f.type==='application/pdf'))setFile(f);else setError('Please select a PDF document.')};
 return <main data-preset={preset}>
 <header><a className="logo" href="/">◧ Folio</a><span className="tagline">A better place to read.</span><label className="upload small">Open PDF<input type="file" accept=".pdf,application/pdf" onChange={e=>open(e.target.files?.[0])}/></label></header>
 {!pdf?<section className="welcome"><span className="eyebrow">YOUR PERSONAL READING SPACE</span><h1>Make room for <em>reading.</em></h1><p>Open a PDF and choose the experience that feels right for you. Free, private, and designed for every screen.</p><label className="drop" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();open(e.dataTransfer.files[0])}}><span className="drop-icon">↥</span><strong>Drop a PDF here, or browse files</strong><small>Documents stay on your device.</small><input type="file" accept=".pdf,application/pdf" onChange={e=>open(e.target.files?.[0])}/></label><h2>Read your way</h2><div className="cards">{modes.map(m=><button key={m} className={'mode '+m} onClick={()=>setPreset(m)}><span className="symbol">{m==='book'?'◫':m==='comfort'?'☼':m==='accessible'?'◎':'◇'}</span><strong>{m}</strong><small>{m==='book'?'Paper-like pages':m==='comfort'?'Calm and gentle':m==='accessible'?'High contrast': 'Distraction-free'}</small>{preset===m&&<span className="chosen">Selected</span>}</button>)}</div></section>:<section className="workspace"><aside><p className="eyebrow">READING EXPERIENCE</p><div className="modes">{modes.map(m=><button className={preset===m?'selected':''} key={m} onClick={()=>setPreset(m)}>{m[0].toUpperCase()+m.slice(1)}</button>)}</div><p className="eyebrow">DOCUMENT</p><p className="filename">{file?.name}</p><p>{pdf.numPages} pages</p><p className="hint">The original PDF layout is preserved. Reflowed text and animated page turns are planned for later versions.</p></aside><article className="reading"><div className="toolbar"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} aria-label="Previous page">←</button><span>Page {page} of {pdf.numPages}</span><button disabled={page>=pdf.numPages} onClick={()=>setPage(p=>p+1)} aria-label="Next page">→</button><span className="separator"/><button onClick={()=>setZoom(z=>Math.max(.5,z-.1))} aria-label="Zoom out">−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(2,z+.1))} aria-label="Zoom in">+</button></div><div className="page"><canvas ref={canvas}/></div></article></section>}
 {error&&<div role="alert" className="error">{error}<button onClick={()=>setError('')}>Dismiss</button></div>}
 <footer>Made for comfortable reading · Your files stay local · Free forever</footer>
 </main>}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);