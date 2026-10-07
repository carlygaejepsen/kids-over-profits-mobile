/** Documents (PDFs and pictures from the site's library) and how the in-app viewer shows them. */

export type DocKind = 'pdf' | 'image' | 'other';

const IMAGE = /\.(jpe?g|png|gif|webp)$/i;

/** What the viewer can draw for an address or a path: a PDF (pdf.js), a picture, or nothing it can draw. */
export function docKindOf(pathOrUrl: string | null | undefined, ext?: string): DocKind {
  let path = String(pathOrUrl ?? '');
  try {
    path = new URL(path).pathname;
  } catch {
    path = path.replace(/[?#].*$/, '');
  }
  const e = (ext || path.split('.').pop() || '').toLowerCase();
  if (e === 'pdf') return 'pdf';
  if (IMAGE.test(`.${e}`)) return 'image';
  return 'other';
}

/** "1.2 MB", "340 KB"; '' when the size is unknown. */
export function sizeLabel(bytes: number | null | undefined): string {
  const n = Number(bytes) || 0;
  if (n <= 0) return '';
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/** A value written into the page's script, safe inside <script>. */
const js = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c');

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

/**
 * A page that draws a PDF with pdf.js, one canvas per page, only the pages near the screen kept drawn (a
 * 70-page Woodbury issue would otherwise hold hundreds of MB), opened at `page`, with a "Page 3 of 40" pill.
 * Loaded with the site as its base URL, so our own files are fetched same-origin. Posts {type:'loaded'|'error'}.
 */
export function pdfViewerHtml(url: string, page = 1): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
<style>
html,body{margin:0;background:#000435;-webkit-text-size-adjust:100%}
#pages{display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px 0 56px}
.pg{background:#fff;width:calc(100vw - 16px);position:relative}
.pg canvas{display:block;width:100%;height:100%}
#bar{position:fixed;bottom:12px;left:50%;transform:translateX(-50%);background:#000080;border:1px solid #33A7B5;color:#fff;font:600 13px -apple-system,system-ui,sans-serif;padding:6px 14px;border-radius:999px}
#msg{color:#fff;font:16px -apple-system,system-ui,sans-serif;padding:32px 24px;text-align:center}
</style></head><body>
<div id="msg">Loading the document</div><div id="pages"></div><div id="bar" hidden></div>
<script src="${PDFJS}/pdf.min.js"></script>
<script>
(function(){
  var URL_=${js(url)}, START=${js(Math.max(1, Math.floor(page) || 1))};
  function post(o){ if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  function fail(e){ document.getElementById('msg').textContent='This document could not be opened here.'; post({type:'error',message:String(e&&e.message||e)}); }
  if (!window.pdfjsLib) { fail('pdf.js did not load'); return; }
  pdfjsLib.GlobalWorkerOptions.workerSrc=${js(`${PDFJS}/pdf.worker.min.js`)};
  pdfjsLib.getDocument({url:URL_}).promise.then(function(pdf){
    return pdf.getPage(1).then(function(first){
      var v1=first.getViewport({scale:1}), W=window.innerWidth-16, n=pdf.numPages;
      var holder=document.getElementById('pages'), bar=document.getElementById('bar'), divs=[], live={};
      document.getElementById('msg').remove();
      for (var i=1;i<=n;i++){ var d=document.createElement('div'); d.className='pg'; d.style.height=(W*v1.height/v1.width)+'px'; d.dataset.n=i; holder.appendChild(d); divs.push(d); }
      var dpr=Math.min(window.devicePixelRatio||1,2);
      function prune(center){ Object.keys(live).forEach(function(k){ var c=live[k]; if (c && Math.abs(k-center)>4){ c.width=0; c.height=0; c.remove(); delete live[k]; } }); }
      function draw(k){
        if (k in live) return; live[k]=null;
        pdf.getPage(k).then(function(p){
          var base=p.getViewport({scale:1}), d=divs[k-1];
          d.style.height=(W*base.height/base.width)+'px';
          var v=p.getViewport({scale:W/base.width*dpr}), c=document.createElement('canvas');
          c.width=v.width; c.height=v.height; d.appendChild(c); live[k]=c;
          return p.render({canvasContext:c.getContext('2d'),viewport:v}).promise.then(function(){ prune(k); });
        }).catch(function(){ delete live[k]; });
      }
      var io=new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) draw(+e.target.dataset.n); }); },{rootMargin:'600px 0px'});
      divs.forEach(function(d){ io.observe(d); });
      function count(){ var mid=window.scrollY+window.innerHeight/2, cur=1; for (var i=0;i<divs.length;i++){ if (divs[i].offsetTop<=mid) cur=i+1; else break; } bar.textContent='Page '+cur+' of '+n; }
      window.addEventListener('scroll',count,{passive:true});
      bar.hidden=false;
      var start=Math.min(START,n);
      if (start>1) divs[start-1].scrollIntoView();
      count();
      post({type:'loaded',pages:n});
    });
  }).catch(fail);
})();
</script></body></html>`;
}

/** A picture, fitted to the width, pinch to zoom. */
export function imageViewerHtml(url: string): string {
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=6">
<style>html,body{margin:0;background:#000435;min-height:100%}img{display:block;max-width:100%;margin:0 auto}</style></head>
<body><img alt="" src=${js(url)} onload="window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('{&quot;type&quot;:&quot;loaded&quot;}')" onerror="window.ReactNativeWebView&&window.ReactNativeWebView.postMessage('{&quot;type&quot;:&quot;error&quot;}')"></body></html>`;
}
