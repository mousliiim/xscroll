(()=>{var ge="https://x.com",qe="xscroll.search.native",Lt="#xscroll-video-search",Xe="xscroll.timeline.v1",We=new Set(["ImmersiveMedia","TweetDetail","TVHomeMixer","MediaTabVideoMixer","SearchTimeline"]),Qe=new Set(["FavoriteTweet","UnfavoriteTweet","CreateRetweet","DeleteRetweet","CreateBookmark","DeleteBookmark"]);function It(e=location.href){let t=new URL(e);return t.pathname==="/search"?`search:${t.searchParams.get("q")||""}:${t.searchParams.get("f")||""}`:t.pathname}var ut=location.pathname==="/search"&&location.hash===Lt;function Ot(e){let t=chrome.runtime.connect({name:qe}),n,o=!1,i=setInterval(()=>{if(!o)try{t.postMessage({type:"ping"})}catch{r()}},18e3);function a(l){let c=n;n=void 0,c?.(l)}function r(){o||(o=!0,clearInterval(i),a(),t.disconnect())}return t.onDisconnect.addListener(r),t.onMessage.addListener(l=>a(Array.isArray(l?.clips)?l:void 0)),{page(l){return o||n?Promise.resolve(void 0):new Promise(c=>{n=c;try{t.postMessage({type:"page",topic:e,cursor:l})}catch{r()}})},close:r}}function Pt(){window.addEventListener("message",e=>{let t=e.data;e.source!==window||e.origin!==ge||t?.channel!==Xe||t.name!=="SearchTimeline"||!t.context?.startsWith("search:")||Array.isArray(t.clips)&&chrome.runtime.sendMessage({channel:qe,clips:t.clips.slice(0,300),cursor:t.cursor,from:t.from}).catch(()=>{})}),chrome.runtime.onMessage.addListener((e,t,n)=>{if(t.id!==chrome.runtime.id||e?.channel!==qe||e.type!=="next")return;let o=document.querySelectorAll("main article");o[o.length-1]?.scrollIntoView({block:"end",behavior:"instant"}),window.scrollTo({top:document.documentElement.scrollHeight,behavior:"instant"}),n(!0)})}var Lo=new Set(["previous","next","toggle-play","toggle-mute","rewind","forward","slower","faster","reset-speed","replies","replies-auto","replies-up","replies-down"]),Io=["like","bookmark","repost"],Oo=e=>typeof e=="string"&&/^\d{1,25}$/.test(e),Po=e=>typeof e=="string"&&/^[a-f0-9]{16}$/.test(e);function _o(e){return typeof e!="string"||e.length>120?"":e.replace(/[\u0000-\u001f\u007f\s]+/g," ").trim()}function _t(e){if(Lo.has(e))return e;if(e?.command==="speed"){let i=e.rate;return Number.isFinite(i)&&i>=.25&&i<=2?{command:"speed",rate:Math.round(i*100)/100}:null}if(e?.command==="speed-preview")return[.5,2,null].includes(e.rate)?{command:"speed-preview",rate:e.rate}:null;if(!Po(e?.id))return null;if(e.command==="post-action"){let{command:i,id:a,kind:r,enabled:l}=e;return Io.includes(r)&&Oo(e.postId)&&typeof l=="boolean"?{command:i,id:a,kind:r,postId:e.postId,enabled:l}:null}let{command:t,id:n}=e;if(t==="shuffle")return{command:t,id:n};let o=t==="search"?_o(e.topic):"";return o?{command:t,id:n,topic:o}:null}function pt(e){if(typeof e!="string"||e.length>750)return"";try{let t=new URL(e);if(t.origin!=="https://video.twimg.com"||t.username||t.password||!/\.mp4$/i.test(t.pathname))return"";let n=t.searchParams.get("tag");return t.search=/^\d{1,4}$/.test(n||"")?`?tag=${n}`:"",t.hash="",t.href}catch{return""}}var Ht=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-circle-play"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M9 9.003a1 1 0 0 1 1.517-.859l4.997 2.997a1 1 0 0 1 0 1.718l-4.997 2.997A1 1 0 0 1 9 14.996z" />
  <circle cx="12" cy="12" r="10" />
</svg>
`;var Nt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-play"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
</svg>
`;var Ft=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-pause"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="14" y="3" width="5" height="18" rx="1" />
  <rect x="5" y="3" width="5" height="18" rx="1" />
</svg>
`;var Bt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-volume-2"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
  <path d="M16 9a5 5 0 0 1 0 6" />
  <path d="M19.364 18.364a9 9 0 0 0 0-12.728" />
</svg>
`;var Dt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-volume-x"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M11 4.702a.7.7 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.7.7 0 0 0 11 19.298z" />
  <path d="m16.5 14.5 5-5" />
  <path d="m16.5 9.5 5 5" />
</svg>
`;var zt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-download"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M12 15V3" />
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <path d="m7 10 5 5 5-5" />
</svg>
`;var jt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-picture-in-picture-2"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10c0 1.1.9 2 2 2h4" />
  <rect width="10" height="7" x="12" y="13" rx="2" />
</svg>
`;var Ut=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-panel-top"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect width="18" height="18" x="3" y="3" rx="2" />
  <path d="M3 9h18" />
</svg>
`;var Vt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-x"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M18 6 6 18" />
  <path d="m6 6 12 12" />
</svg>
`;var qt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-maximize"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M8 3H5a2 2 0 0 0-2 2v3" />
  <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
  <path d="M3 16v3a2 2 0 0 0 2 2h3" />
  <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
</svg>
`;var Xt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-minimize"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
</svg>
`;var Wt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-message-circle"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719" />
</svg>
`;var Qt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-arrow-up-right"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M7 7h10v10" />
  <path d="M7 17 17 7" />
</svg>
`;var ft=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-chevron-down"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m6 9 6 6 6-6" />
</svg>
`;var Jt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-settings-2"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M14 17H5" />
  <path d="M19 7h-9" />
  <circle cx="17" cy="17" r="3" />
  <circle cx="7" cy="7" r="3" />
</svg>
`;var Gt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-sun"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <circle cx="12" cy="12" r="4" />
  <path d="M12 2v2" />
  <path d="M12 20v2" />
  <path d="m4.93 4.93 1.41 1.41" />
  <path d="m17.66 17.66 1.41 1.41" />
  <path d="M2 12h2" />
  <path d="M20 12h2" />
  <path d="m6.34 17.66-1.41 1.41" />
  <path d="m19.07 4.93-1.41 1.41" />
</svg>
`;var Kt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-moon"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
</svg>
`;var Yt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-monitor"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect width="20" height="14" x="2" y="3" rx="2" />
  <line x1="8" x2="16" y1="21" y2="21" />
  <line x1="12" x2="12" y1="17" y2="21" />
</svg>
`;var Zt=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-crop"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M6 2v14a2 2 0 0 0 2 2h14" />
  <path d="M18 22V8a2 2 0 0 0-2-2H2" />
</svg>
`;var en=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-move-diagonal-2"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M19 13v6h-6" />
  <path d="M5 11V5h6" />
  <path d="m5 5 14 14" />
</svg>
`;var tn=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-check"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M20 6 9 17l-5-5" />
</svg>
`;var nn=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-list-end"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M16 5H3" />
  <path d="M16 12H3" />
  <path d="M9 19H3" />
  <path d="m16 16-3 3 3 3" />
  <path d="M21 5v12a2 2 0 0 1-2 2h-6" />
</svg>
`;var on=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-keyboard"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M10 8h.01" />
  <path d="M12 12h.01" />
  <path d="M14 8h.01" />
  <path d="M16 12h.01" />
  <path d="M18 8h.01" />
  <path d="M6 8h.01" />
  <path d="M7 16h10" />
  <path d="M8 12h.01" />
  <rect width="20" height="16" x="2" y="4" rx="2" />
</svg>
`;var rn=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-rotate-ccw"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
  <path d="M3 3v5h5" />
</svg>
`;var sn=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-chevron-up"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m18 15-6-6-6 6" />
</svg>
`;var an=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-heart"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
</svg>
`;var ln=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-repeat-2"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m2 9 3-3 3 3" />
  <path d="M13 18H7a2 2 0 0 1-2-2V6" />
  <path d="m22 15-3 3-3-3" />
  <path d="M11 6h6a2 2 0 0 1 2 2v10" />
</svg>
`;var cn=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-bookmark"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z" />
</svg>
`;var dn=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-link-2"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M9 17H7A5 5 0 0 1 7 7h2" />
  <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
  <line x1="8" x2="16" y1="12" y2="12" />
</svg>
`;var un=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-turtle"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="m12 10 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a8 8 0 1 0-16 0v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3l2-4h4Z" />
  <path d="M4.82 7.9 8 10" />
  <path d="M15.18 7.9 12 10" />
  <path d="M16.93 10H20a2 2 0 0 1 0 4H2" />
</svg>
`;var pn=`<!-- @license lucide-static v1.81.0 - ISC -->
<svg
  class="lucide lucide-rabbit"
  xmlns="http://www.w3.org/2000/svg"
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M13 16a3 3 0 0 1 2.24 5" />
  <path d="M18 12h.01" />
  <path d="M18 21h-8a4 4 0 0 1-4-4 7 7 0 0 1 7-7h.2L9.6 6.4a1 1 0 1 1 2.8-2.8L15.8 7h.2c3.3 0 6 2.7 6 6v1a2 2 0 0 1-2 2h-1a3 3 0 0 0-3 3" />
  <path d="M20 8.54V4a2 2 0 1 0-4 0v3" />
  <path d="M7.612 12.524a3 3 0 1 0-1.6 4.3" />
</svg>
`;var fn={reels:Ht,play:Nt,pause:Ft,volume:Bt,mute:Dt,download:zt,float:jt,restore:Ut,close:Vt,fullscreen:qt,shrink:Xt,replies:Wt,external:Qt,quality:ft,appearance:Jt,sun:Gt,moon:Kt,system:Yt,size:en,framing:Zt,check:tn,auto:nn,shortcuts:on,reset:rn,up:sn,down:ft,like:an,repost:ln,bookmark:cn,share:dn,turtle:un,rabbit:pn},U=e=>fn[e].slice(fn[e].indexOf("<svg")).replace("<svg",'<svg aria-hidden="true" focusable="false"');var q=(e,t,n="")=>`<button type="button" class="button" data-action="${e}" title="${t}" aria-label="${t}">${U(e)}${n?`<span>${n}</span>`:""}</button>`,Ae=(e,t,n)=>`<button type="button" class="button" data-menu="${e}" aria-controls="menu-${e}" aria-expanded="false" title="${t}" aria-label="${t}">${n}</button>`,oe=(e,t,n,o)=>`<button type="button" class="choice" data-action="${e}" data-value="${t}" aria-pressed="false">${o?U(o):""}<span>${n}</span>${U("check")}</button>`,Re=(e,t,n)=>`<section class="flyout" id="menu-${e}" aria-label="${t}" hidden><p class="flyout-heading">${t}</p>${n}</section>`,Ce=e=>`${e}\xD7`,mn=[["Play / pause","Space"],["Previous / next video","\u2191 / \u2193 \xB7 K / J"],["Seek 5 seconds","\u2190 / \u2192"],["Slower / faster","Shift + \u2190 / \u2192"],["Reset playback speed","0"],["Mute / unmute","M"],["Replies","R"],["Auto-scroll replies","A"],["Mini player / return","P"],["Change mini player size","Z"],["Light / dark mode","T"],["Fullscreen in tab","F"],["Fit / fill the video frame","V"],["Close menu / panel","Esc"]];var Ee=Math.min,se=Math.max,Pe=Math.round,_e=Math.floor,re=e=>({x:e,y:e}),fr={left:"right",right:"left",bottom:"top",top:"bottom"};function wn(e,t,n){return se(e,Ee(t,n))}function He(e,t){return typeof e=="function"?e(t):e}function we(e){return e.split("-")[0]}function Ne(e){return e.split("-")[1]}function mt(e){return e==="x"?"y":"x"}function ht(e){return e==="y"?"height":"width"}function ae(e){let t=e[0];return t==="t"||t==="b"?"y":"x"}function gt(e){return mt(ae(e))}function xn(e,t,n){n===void 0&&(n=!1);let o=Ne(e),i=gt(e),a=ht(i),r=i==="x"?o===(n?"end":"start")?"right":"left":o==="start"?"bottom":"top";return t.reference[a]>t.floating[a]&&(r=Oe(r)),[r,Oe(r)]}function bn(e){let t=Oe(e);return[Je(e),t,Je(t)]}function Je(e){return e.includes("start")?e.replace("start","end"):e.replace("end","start")}var hn=["left","right"],gn=["right","left"],mr=["top","bottom"],hr=["bottom","top"];function gr(e,t,n){switch(e){case"top":case"bottom":return n?t?gn:hn:t?hn:gn;case"left":case"right":return t?mr:hr;default:return[]}}function vn(e,t,n,o){let i=Ne(e),a=gr(we(e),n==="start",o);return i&&(a=a.map(r=>r+"-"+i),t&&(a=a.concat(a.map(Je)))),a}function Oe(e){let t=we(e);return fr[t]+e.slice(t.length)}function wr(e){var t,n,o,i;return{top:(t=e.top)!=null?t:0,right:(n=e.right)!=null?n:0,bottom:(o=e.bottom)!=null?o:0,left:(i=e.left)!=null?i:0}}function yn(e){return typeof e!="number"?wr(e):{top:e,right:e,bottom:e,left:e}}function xe(e){let{x:t,y:n,width:o,height:i}=e;return{width:o,height:i,top:n,left:t,right:t+o,bottom:n+i,x:t,y:n}}function kn(e,t,n){let{reference:o,floating:i}=e,a=ae(t),r=gt(t),l=ht(r),c=we(t),s=a==="y",u=o.x+o.width/2-i.width/2,p=o.y+o.height/2-i.height/2,x=o[l]/2-i[l]/2,h;switch(c){case"top":h={x:u,y:o.y-i.height};break;case"bottom":h={x:u,y:o.y+o.height};break;case"right":h={x:o.x+o.width,y:p};break;case"left":h={x:o.x-i.width,y:p};break;default:h={x:o.x,y:o.y}}let g=Ne(t);return g&&(h[r]+=x*(g==="end"?1:-1)*(n&&s?-1:1)),h}async function Sn(e,t){var n;t===void 0&&(t={});let{x:o,y:i,platform:a,rects:r,elements:l,strategy:c}=e,{boundary:s="clippingAncestors",rootBoundary:u="viewport",elementContext:p="floating",altBoundary:x=!1,padding:h=0}=He(t,e),g=yn(h),M=l[x?p==="floating"?"reference":"floating":p],b=xe(await a.getClippingRect({element:(n=await(a.isElement==null?void 0:a.isElement(M)))==null||n?M:M.contextElement||await(a.getDocumentElement==null?void 0:a.getDocumentElement(l.floating)),boundary:s,rootBoundary:u,strategy:c})),k=p==="floating"?{x:o,y:i,width:r.floating.width,height:r.floating.height}:r.reference,$=await(a.getOffsetParent==null?void 0:a.getOffsetParent(l.floating)),f=await(a.isElement==null?void 0:a.isElement($))&&await(a.getScale==null?void 0:a.getScale($))||{x:1,y:1},E=xe(a.convertOffsetParentRelativeRectToViewportRelativeRect?await a.convertOffsetParentRelativeRectToViewportRelativeRect({elements:l,rect:k,offsetParent:$,strategy:c}):k);return{top:(b.top-E.top+g.top)/f.y,bottom:(E.bottom-b.bottom+g.bottom)/f.y,left:(b.left-E.left+g.left)/f.x,right:(E.right-b.right+g.right)/f.x}}var xr=50,An=async(e,t,n)=>{let{placement:o="bottom",strategy:i="absolute",middleware:a=[],platform:r}=n,l=r.detectOverflow?r:{...r,detectOverflow:Sn},c=await(r.isRTL==null?void 0:r.isRTL(t)),s=await r.getElementRects({reference:e,floating:t,strategy:i}),{x:u,y:p}=kn(s,o,c),x=o,h=0,g={};for(let w=0;w<a.length;w++){let M=a[w];if(!M)continue;let{name:b,fn:k}=M,{x:$,y:f,data:E,reset:A}=await k({x:u,y:p,initialPlacement:o,placement:x,strategy:i,middlewareData:g,rects:s,platform:l,elements:{reference:e,floating:t}});u=$??u,p=f??p,g[b]={...g[b],...E},A&&h<xr&&(h++,typeof A=="object"&&(A.placement&&(x=A.placement),A.rects&&(s=A.rects===!0?await r.getElementRects({reference:e,floating:t,strategy:i}):A.rects),{x:u,y:p}=kn(s,x,c)),w=-1)}return{x:u,y:p,placement:x,strategy:i,middlewareData:g}};var Rn=function(e){return e===void 0&&(e={}),{name:"flip",options:e,async fn(t){var n,o;let{placement:i,middlewareData:a,rects:r,initialPlacement:l,platform:c,elements:s}=t,{mainAxis:u=!0,crossAxis:p=!0,fallbackPlacements:x,fallbackStrategy:h="bestFit",fallbackAxisSideDirection:g="none",flipAlignment:w=!0,...M}=He(e,t);if((n=a.arrow)!=null&&n.alignmentOffset)return{};let b=we(i),k=ae(l),$=we(l)===l,f=await(c.isRTL==null?void 0:c.isRTL(s.floating)),E=x||($||!w?[Oe(l)]:bn(l)),A=g!=="none";!x&&A&&E.push(...vn(l,w,g,f));let I=[l,...E],H=await c.detectOverflow(t,M),F=[],O=((o=a.flip)==null?void 0:o.overflows)||[];if(u&&F.push(H[b]),p){let m=xn(i,r,f);F.push(H[m[0]],H[m[1]])}if(O=[...O,{placement:i,overflows:F}],!F.every(m=>m<=0)){var B,j;let m=(((B=a.flip)==null?void 0:B.index)||0)+1,v=I[m];if(v&&(!(p==="alignment"?k!==ae(v):!1)||O.every(C=>ae(C.placement)===k?C.overflows[0]>0:!0)))return{data:{index:m,overflows:O},reset:{placement:v}};let d=(j=O.filter(y=>y.overflows[0]<=0).sort((y,C)=>y.overflows[1]-C.overflows[1])[0])==null?void 0:j.placement;if(!d)switch(h){case"bestFit":{var V;let y=(V=O.filter(C=>{if(A){let T=ae(C.placement);return T===k||T==="y"}return!0}).map(C=>[C.placement,C.overflows.filter(T=>T>0).reduce((T,N)=>T+N,0)]).sort((C,T)=>C[1]-T[1])[0])==null?void 0:V[0];y&&(d=y);break}case"initialPlacement":d=l;break}if(i!==d)return{reset:{placement:d}}}return{}}}};var br=new Set(["left","top"]);async function vr(e,t){let{placement:n,platform:o,elements:i}=e,a=await(o.isRTL==null?void 0:o.isRTL(i.floating)),r=we(n),l=Ne(n),c=ae(n)==="y",s=br.has(r)?-1:1,u=a&&c?-1:1,p=He(t,e),{mainAxis:x,crossAxis:h,alignmentAxis:g}=typeof p=="number"?{mainAxis:p,crossAxis:0,alignmentAxis:null}:{mainAxis:p.mainAxis||0,crossAxis:p.crossAxis||0,alignmentAxis:p.alignmentAxis};return l&&typeof g=="number"&&(h=l==="end"?g*-1:g),c?{x:h*u,y:x*s}:{x:x*s,y:h*u}}var Cn=function(e){return e===void 0&&(e=0),{name:"offset",options:e,async fn(t){var n,o;let{x:i,y:a,placement:r,middlewareData:l}=t,c=await vr(t,e);return r===((n=l.offset)==null?void 0:n.placement)&&(o=l.arrow)!=null&&o.alignmentOffset?{}:{x:i+c.x,y:a+c.y,data:{...c,placement:r}}}}},En=function(e){return e===void 0&&(e={}),{name:"shift",options:e,async fn(t){let{x:n,y:o,placement:i,platform:a}=t,{mainAxis:r=!0,crossAxis:l=!1,limiter:c={fn:k=>{let{x:$,y:f}=k;return{x:$,y:f}}},...s}=He(e,t),u={x:n,y:o},p=await a.detectOverflow(t,s),x=ae(i),h=mt(x),g=u[h],w=u[x],M=(k,$)=>wn($+p[k==="y"?"top":"left"],$,$-p[k==="y"?"bottom":"right"]);r&&(g=M(h,g)),l&&(w=M(x,w));let b=c.fn({...t,[h]:g,[x]:w});return{...b,data:{x:b.x-n,y:b.y-o,enabled:{[h]:r,[x]:l}}}}}};function Ge(){return typeof window<"u"}function ve(e){return Tn(e)?(e.nodeName||"").toLowerCase():"#document"}function X(e){var t;return(e==null||(t=e.ownerDocument)==null?void 0:t.defaultView)||window}function ie(e){var t;return(t=(Tn(e)?e.ownerDocument:e.document)||window.document)==null?void 0:t.documentElement}function Tn(e){return Ge()?e instanceof Node||e instanceof X(e).Node:!1}function Z(e){return Ge()?e instanceof Element||e instanceof X(e).Element:!1}function le(e){return Ge()?e instanceof HTMLElement||e instanceof X(e).HTMLElement:!1}function Mn(e){return!Ge()||typeof ShadowRoot>"u"?!1:e instanceof ShadowRoot||e instanceof X(e).ShadowRoot}function Fe(e){let{overflow:t,overflowX:n,overflowY:o,display:i}=ee(e);return/auto|scroll|overlay|hidden|clip/.test(t+o+n)&&i!=="inline"&&i!=="contents"}function $n(e){return/^(table|td|th)$/.test(ve(e))}function Be(e){try{if(e.matches(":popover-open"))return!0}catch{}try{return e.matches(":modal")}catch{return!1}}var yr=/transform|translate|scale|rotate|perspective|filter/,kr=/paint|layout|strict|content/,be=e=>!!e&&e!=="none",wt;function Ke(e){let t=Z(e)?ee(e):e;return be(t.transform)||be(t.translate)||be(t.scale)||be(t.rotate)||be(t.perspective)||!Ye()&&(be(t.backdropFilter)||be(t.filter))||yr.test(t.willChange||"")||kr.test(t.contain||"")}function Ln(e){let t=fe(e);for(;le(t)&&!Te(t);){if(Ke(t))return t;if(Be(t))return null;t=fe(t)}return null}function Ye(){return wt==null&&(wt=typeof CSS<"u"&&CSS.supports&&CSS.supports("-webkit-backdrop-filter","none")),wt}function Te(e){return/^(html|body|#document)$/.test(ve(e))}function ee(e){return X(e).getComputedStyle(e)}function De(e){return Z(e)?{scrollLeft:e.scrollLeft,scrollTop:e.scrollTop}:{scrollLeft:e.scrollX,scrollTop:e.scrollY}}function fe(e){if(ve(e)==="html")return e;let t=e.assignedSlot||e.parentNode||Mn(e)&&e.host||ie(e);return Mn(t)?t.host:t}function In(e){let t=fe(e);return Te(t)?(e.ownerDocument||e).body:le(t)&&Fe(t)?t:In(t)}function Me(e,t,n){var o;t===void 0&&(t=[]),n===void 0&&(n=!0);let i=In(e),a=i===((o=e.ownerDocument)==null?void 0:o.body),r=X(i);if(a){let l=Ze(r);return t.concat(r,r.visualViewport||[],Fe(i)?i:[],l&&n?Me(l):[])}else return t.concat(i,Me(i,[],n))}function Ze(e){return e.parent&&Object.getPrototypeOf(e.parent)?e.frameElement:null}function _n(e){let t=ee(e),n=parseFloat(t.width)||0,o=parseFloat(t.height)||0,i=le(e),a=i?e.offsetWidth:n,r=i?e.offsetHeight:o,l=Pe(n)!==a||Pe(o)!==r;return l&&(n=a,o=r),{width:n,height:o,$:l}}function bt(e){return Z(e)?e:e.contextElement}function $e(e){let t=bt(e);if(!le(t))return re(1);let n=t.getBoundingClientRect(),{width:o,height:i,$:a}=_n(t),r=(a?Pe(n.width):n.width)/o,l=(a?Pe(n.height):n.height)/i;return(!r||!Number.isFinite(r))&&(r=1),(!l||!Number.isFinite(l))&&(l=1),{x:r,y:l}}var Sr=re(0);function Hn(e){let t=X(e);return!Ye()||!t.visualViewport?Sr:{x:t.visualViewport.offsetLeft,y:t.visualViewport.offsetTop}}function Ar(e,t,n){return t===void 0&&(t=!1),!!n&&t&&n===X(e)}function ye(e,t,n,o){t===void 0&&(t=!1),n===void 0&&(n=!1);let i=e.getBoundingClientRect(),a=bt(e),r=re(1);t&&(o?Z(o)&&(r=$e(o)):r=$e(e));let l=Ar(a,n,o)?Hn(a):re(0),c=(i.left+l.x)/r.x,s=(i.top+l.y)/r.y,u=i.width/r.x,p=i.height/r.y;if(a&&o){let x=X(a),h=Z(o)?X(o):o,g=x,w=Ze(g);for(;w&&h!==g;){let M=$e(w),b=w.getBoundingClientRect(),k=ee(w),$=b.left+(w.clientLeft+parseFloat(k.paddingLeft))*M.x,f=b.top+(w.clientTop+parseFloat(k.paddingTop))*M.y;c*=M.x,s*=M.y,u*=M.x,p*=M.y,c+=$,s+=f,g=X(w),w=Ze(g)}}return xe({width:u,height:p,x:c,y:s})}function et(e,t){let n=De(e).scrollLeft;return t?t.left+n:ye(ie(e)).left+n}function Nn(e,t){let n=e.getBoundingClientRect(),o=n.left+t.scrollLeft-et(e,n),i=n.top+t.scrollTop;return{x:o,y:i}}function Rr(e){let{elements:t,rect:n,offsetParent:o,strategy:i}=e,a=i==="fixed",r=ie(o),l=t?Be(t.floating):!1;if(o===r||l&&a)return n;let c={scrollLeft:0,scrollTop:0},s=re(1),u=re(0),p=le(o);if((p||!a)&&((ve(o)!=="body"||Fe(r))&&(c=De(o)),p)){let h=ye(o);s=$e(o),u.x=h.x+o.clientLeft,u.y=h.y+o.clientTop}let x=r&&!p&&!a?Nn(r,c):re(0);return{width:n.width*s.x,height:n.height*s.y,x:n.x*s.x-c.scrollLeft*s.x+u.x+x.x,y:n.y*s.y-c.scrollTop*s.y+u.y+x.y}}function Cr(e){return e.getClientRects?Array.from(e.getClientRects()):[]}function Er(e){let t=De(e),n=e.ownerDocument.body,o=se(e.scrollWidth,e.clientWidth,n.scrollWidth,n.clientWidth),i=se(e.scrollHeight,e.clientHeight,n.scrollHeight,n.clientHeight),a=-t.scrollLeft+et(e),r=-t.scrollTop;return ee(n).direction==="rtl"&&(a+=se(e.clientWidth,n.clientWidth)-o),{width:o,height:i,x:a,y:r}}var Mr=25;function Tr(e,t,n){n===void 0&&(n="viewport");let o=n==="layoutViewport",i=X(e),a=ie(e),r=i.visualViewport,l=a.clientWidth,c=a.clientHeight,s=0,u=0;if(r){let x=!Ye()||t==="fixed";o?x||(s=-r.offsetLeft,u=-r.offsetTop):(l=r.width,c=r.height,x&&(s=r.offsetLeft,u=r.offsetTop))}if(et(a)<=0){let x=a.ownerDocument,h=x.body,g=getComputedStyle(h),w=x.compatMode==="CSS1Compat"&&parseFloat(g.marginLeft)+parseFloat(g.marginRight)||0,M=Math.abs(a.clientWidth-h.clientWidth-w),b=getComputedStyle(a).scrollbarGutter==="stable both-edges"?M/2:M;b<=Mr&&(l-=b)}return{width:l,height:c,x:s,y:u}}function $r(e,t){let n=ye(e,!0,t==="fixed"),o=n.top+e.clientTop,i=n.left+e.clientLeft,a=$e(e),r=e.clientWidth*a.x,l=e.clientHeight*a.y,c=i*a.x,s=o*a.y;return{width:r,height:l,x:c,y:s}}function On(e,t,n){let o;if(t==="viewport"||t==="layoutViewport")o=Tr(e,n,t);else if(t==="document")o=Er(ie(e));else if(Z(t))o=$r(t,n);else{let i=Hn(e);o={x:t.x-i.x,y:t.y-i.y,width:t.width,height:t.height}}return xe(o)}function Lr(e,t){let n=t.get(e);if(n)return n;let o=Me(e,[],!1).filter(l=>Z(l)&&ve(l)!=="body"),i=null,a=ee(e).position==="fixed",r=a?fe(e):e;for(;Z(r)&&!Te(r);){let l=ee(r),c=Ke(r),s=i?i.position:a?"fixed":"";!c&&(s==="fixed"||s==="absolute"&&l.position==="static")?o=o.filter(p=>p!==r):i=l,r=fe(r)}return t.set(e,o),o}function Ir(e){let{element:t,boundary:n,rootBoundary:o,strategy:i}=e,r=[...n==="clippingAncestors"?Be(t)?[]:Lr(t,this._c):[].concat(n),o],l=On(t,r[0],i),c=l.top,s=l.right,u=l.bottom,p=l.left;for(let x=1;x<r.length;x++){let h=On(t,r[x],i);c=se(h.top,c),s=Ee(h.right,s),u=Ee(h.bottom,u),p=se(h.left,p)}return{width:s-p,height:u-c,x:p,y:c}}function Or(e){let{width:t,height:n}=_n(e);return{width:t,height:n}}function Pr(e,t,n){let o=le(t),i=ie(t),a=n==="fixed",r=ye(e,!0,a,t),l={scrollLeft:0,scrollTop:0},c=re(0);if((o||!a)&&((ve(t)!=="body"||Fe(i))&&(l=De(t)),o)){let x=ye(t,!0,a,t);c.x=x.x+t.clientLeft,c.y=x.y+t.clientTop}!o&&i&&(c.x=et(i));let s=i&&!o&&!a?Nn(i,l):re(0),u=r.left+l.scrollLeft-c.x-s.x,p=r.top+l.scrollTop-c.y-s.y;return{x:u,y:p,width:r.width,height:r.height}}function xt(e){return ee(e).position==="static"}function Pn(e,t){if(!le(e)||ee(e).position==="fixed")return null;if(t)return t(e);let n=e.offsetParent;return ie(e)===n&&(n=n.ownerDocument.body),n}function Fn(e,t){let n=X(e);if(Be(e))return n;if(!le(e)){let i=fe(e);for(;i&&!Te(i);){if(Z(i)&&!xt(i))return i;i=fe(i)}return n}let o=Pn(e,t);for(;o&&$n(o)&&xt(o);)o=Pn(o,t);return o&&Te(o)&&xt(o)&&!Ke(o)?n:o||Ln(e)||n}var _r=async function(e){let t=this.getOffsetParent||Fn,n=this.getDimensions,o=await n(e.floating);return{reference:Pr(e.reference,await t(e.floating),e.strategy),floating:{x:0,y:0,width:o.width,height:o.height}}};function Hr(e){return ee(e).direction==="rtl"}var Nr={convertOffsetParentRelativeRectToViewportRelativeRect:Rr,getDocumentElement:ie,getClippingRect:Ir,getOffsetParent:Fn,getElementRects:_r,getClientRects:Cr,getDimensions:Or,getScale:$e,isElement:Z,isRTL:Hr};function Bn(e,t){return e.x===t.x&&e.y===t.y&&e.width===t.width&&e.height===t.height}function Fr(e,t,n){let o=null,i,a=ie(e);function r(){var u;clearTimeout(i),(u=o)==null||u.disconnect(),o=null}function l(u,p){u===void 0&&(u=!1),p===void 0&&(p=1),r();let x=e.getBoundingClientRect(),{left:h,top:g,width:w,height:M}=x;if(u||t(),!w||!M)return;let b=_e(g),k=_e(a.clientWidth-(h+w)),$=_e(a.clientHeight-(g+M)),f=_e(h),A={rootMargin:-b+"px "+-k+"px "+-$+"px "+-f+"px",threshold:se(0,Ee(1,p))||1},I=!0;function H(F){let O=F[0].intersectionRatio;if(!Bn(x,e.getBoundingClientRect()))return l();if(O!==p){if(!I)return l();O?l(!1,O):i=setTimeout(()=>{l(!1,1e-7)},1e3)}I=!1}try{o=new IntersectionObserver(H,{...A,root:a.ownerDocument})}catch{o=new IntersectionObserver(H,A)}o.observe(e)}let c=X(e),s=()=>l(n);return c.addEventListener("resize",s),l(!0),()=>{c.removeEventListener("resize",s),r()}}function Dn(e,t,n,o){o===void 0&&(o={});let{ancestorScroll:i=!0,ancestorResize:a=!0,elementResize:r=typeof ResizeObserver=="function",layoutShift:l=typeof IntersectionObserver=="function",animationFrame:c=!1}=o,s=bt(e),u=i||a?[...s?Me(s):[],...t?Me(t):[]]:[];u.forEach(b=>{i&&b.addEventListener("scroll",n),a&&b.addEventListener("resize",n)});let p=s&&l?Fr(s,n,a):null,x=-1,h=null;r&&(h=new ResizeObserver(b=>{let[k]=b;k&&k.target===s&&h&&t&&(h.unobserve(t),cancelAnimationFrame(x),x=requestAnimationFrame(()=>{var $;($=h)==null||$.observe(t)})),n()}),s&&!c&&h.observe(s),t&&h.observe(t));let g,w=c?ye(e):null;c&&M();function M(){let b=ye(e);w&&!Bn(w,b)&&n(),w=b,g=requestAnimationFrame(M)}return n(),()=>{var b;u.forEach(k=>{i&&k.removeEventListener("scroll",n),a&&k.removeEventListener("resize",n)}),p?.(),(b=h)==null||b.disconnect(),h=null,c&&cancelAnimationFrame(g)}}var zn=Cn;var jn=En,Un=Rn;var Vn=(e,t,n)=>{let o=new Map,i=n??{},a={...Nr,...i.platform,_c:o};return An(e,t,{...i,platform:a})};function qn(e,t){let n;function o(r=!1){if(!n)return!1;let{anchor:l,panel:c,dispose:s}=n;return n=void 0,s?.(),l.setAttribute("aria-expanded","false"),c.hidePopover(),c.hidden=!0,delete c.dataset.positioned,r&&l.focus({preventScroll:!0}),!0}function i(r=n){r&&Vn(r.anchor,r.panel,{strategy:"fixed",placement:r.name==="speed"?"top-end":r.name==="profile"?"bottom-start":"bottom-end",middleware:[zn(8),Un({padding:8}),jn({padding:8})]}).then(({x:l,y:c})=>{r===n&&(Object.assign(r.panel.style,{left:`${l}px`,top:`${c}px`}),r.panel.dataset.positioned="")}).catch(()=>{})}function a(r,l=t(r),c=!0){o();let s=e.querySelector(`#menu-${r}`),u={name:r,anchor:l,panel:s};n=u,l.setAttribute("aria-expanded","true"),s.hidden=!1,s.showPopover(),u.dispose=Dn(l,s,()=>i(u)),c&&(s.querySelector("[autofocus]")||s.querySelector('[aria-pressed="true"], input, button, a[href]')||s).focus({preventScroll:!0})}for(let r of e.querySelectorAll(".flyout"))r.tabIndex=-1,r.setAttribute("popover","auto"),r.addEventListener("toggle",l=>{l.newState==="closed"&&n?.panel===r&&!r.matches(":popover-open")&&o()});return e.addEventListener("pointerdown",r=>{n&&!n.panel.contains(r.target)&&!n.anchor.contains(r.target)&&o()}),{show:a,dismiss:o,place:i,current:()=>n,focusables:()=>n&&[...n.panel.querySelectorAll("button, input, a[href]")].filter(r=>!r.disabled)}}var Br=/^\d{1,25}$/,Dr=/^[\w]{1,15}$/,J=e=>typeof e=="string"&&Br.test(e),Xn=e=>typeof e=="string"&&Dr.test(e);function W(e,t){try{let n=new URL(e);return n.protocol==="https:"&&n.hostname===t&&!n.username&&!n.password?n.href:""}catch{return""}}function ke(e){return`https://x.com/i/status/${encodeURIComponent(e)}`}function tt(e){return(typeof e=="string"?e:"").slice(0,18e3).replace(/\s*https:\/\/t\.co\/\w+$/,"").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}function*vt(e){let t=[e],n=new WeakSet;for(;t.length;){let o=t.pop();if(!o||typeof o!="object"||n.has(o))continue;n.add(o),yield o;let i=Object.values(o);for(let a=i.length-1;a>=0;a--)t.push(i[a])}}function yt(e){let t=e.core?.user_results?.result,n=t?.core?.screen_name||t?.legacy?.screen_name,o=t?.core?.name||t?.legacy?.name;return{handle:Xn(n)?n:"",name:typeof o=="string"?o.slice(0,80):"",avatar:W(t?.avatar?.image_url||t?.legacy?.profile_image_url_https,"pbs.twimg.com"),bio:tt(t?.profile_bio?.description||t?.legacy?.description),followers:me(t?.legacy?.followers_count),userId:t?.rest_id,protected:t?.privacy?.protected===!0||t?.legacy?.protected===!0}}function me(e){return Number.isSafeInteger(e)&&e>=0?e:void 0}function ze(e){let t=e.legacy||{},n=o=>typeof o=="boolean"?o:void 0;return{like:n(t.favorited??e.favorited),repost:n(t.retweeted??e.retweeted),bookmark:n(t.bookmarked??e.bookmarked),likeCount:me(t.favorite_count),repostCount:me(t.retweet_count),bookmarkCount:me(t.bookmark_count),replyCount:me(t.reply_count)}}function nt(e,t){for(let n of vt(e))if(n.legacy&&(n.rest_id||n.legacy.id_str)===t)return n}function kt(e){let t=new Map;for(let n of vt(e)){let o=n.legacy,i=n.rest_id||o?.id_str;if(!J(i)||o?.retweeted_status_result||!Array.isArray(o?.extended_entities?.media))continue;let a=yt(n),r=tt(n.note_tweet?.note_tweet_results?.result?.text||o.full_text),l=ze(n),c=a.protected||!!(n.exclusive_tweet_info||n.exclusiveTweetInfo||o.withheld_in_countries?.length);for(let[s,u]of o.extended_entities.media.entries()){let p=u.video_info?.variants;if(!Array.isArray(p))continue;let x=p.filter(g=>g?.content_type==="video/mp4").map(g=>({url:W(g.url,"video.twimg.com"),bitrate:g.bitrate||0})).filter(g=>g.url).sort((g,w)=>w.bitrate-g.bitrate).map(({url:g})=>{let w=g.match(/\/(\d+)x(\d+)\//);return{url:g,label:w?`${Math.min(Number(w[1]),Number(w[2]))}p`:"Original"}});if(!x.length)continue;let h=typeof u.id_str=="string"&&/^[\w-]{1,80}$/.test(u.id_str)?u.id_str:x[0].url;t.set(h,{key:h,tweetId:i,mediaIndex:s,screenRestricted:c,poster:W(u.media_url_https,"pbs.twimg.com"),url:x[0].url,variants:x,user:a.handle,userId:a.userId,name:a.name,avatar:a.avatar,text:r,replyCount:l.replyCount,stats:l})}}return[...t.values()]}function Wn(e){if(!Array.isArray(e))return[];let t=[];for(let n of e.slice(0,300)){if(!J(n?.tweetId)||typeof n.key!="string"||n.key.length>500||!Array.isArray(n.variants))continue;let o=n.variants.slice(0,16).flatMap(a=>{let r=W(a?.url,"video.twimg.com");return r&&/^(?:\d{1,4}p|Original)$/.test(a.label)?[{url:r,label:a.label}]:[]});if(!o.length)continue;let i={};for(let a of["like","repost","bookmark"])typeof n.stats?.[a]=="boolean"&&(i[a]=n.stats[a]);for(let a of["likeCount","repostCount","bookmarkCount","replyCount"])i[a]=me(n.stats?.[a]);t.push({key:n.key,tweetId:n.tweetId,mediaIndex:me(n.mediaIndex),screenRestricted:n.screenRestricted===!0,variants:o,url:o[0].url,user:Xn(n.user)?n.user:"",name:typeof n.name=="string"?n.name.slice(0,80):"",poster:W(n.poster,"pbs.twimg.com"),avatar:W(n.avatar,"pbs.twimg.com"),text:typeof n.text=="string"?n.text.slice(0,18e3):"",replyCount:me(n.replyCount),stats:i})}return t}function Qn(e){for(let t of vt(e))if(t.cursorType==="Bottom"&&typeof t.value=="string")return t.value}function Jn(e,t,n){let o=e.shadowRoot,i=o.querySelector(".thread"),a=o.querySelector(".reply-list"),r=o.querySelector(".thread-scroll"),l=o.querySelector(".profile-card"),c=o.querySelector('[data-action="more"]'),s=v=>o.querySelector(v),u=v=>s(`[data-action="${v}"]`),p=()=>e.ownerDocument.defaultView,x=new Intl.NumberFormat(void 0,{notation:"compact"}),h=new Intl.DateTimeFormat(void 0,{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}),g=new Intl.DateTimeFormat(void 0,{dateStyle:"full",timeStyle:"long"}),w,M,b=!1,k,$,f=0,E,A=0,I=()=>{A=performance.now()+4500,E=void 0},H=()=>{if(!b||k)return;let v=p();k={owner:v,id:v.requestAnimationFrame(F)}},F=v=>{k=null;let d=$===void 0?0:Math.min(v-$,60);if($=v,performance.now()>=A&&!t.current()&&a.childElementCount){let y=r.scrollHeight-r.clientHeight;if(r.scrollTop<y-1){E=void 0,f+=d*.022;let C=Math.floor(f);f-=C,C&&(r.scrollTop+=C)}else c.dataset.nextPage==="true"&&(E??=v,v-E>1200&&(E=void 0,n()))}H()},O=()=>{k&&k.owner.cancelAnimationFrame(k.id),k=null,$=E=void 0,f=0},B=()=>{M&&M.owner.clearTimeout(M.id),M=null},j=(v,d)=>{B();let y=p();M={owner:y,id:y.setTimeout(v,d)}},V=()=>{B(),!w&&t.current()?.name==="profile"&&t.dismiss()},m=(v,d,y=!1)=>{if(!v.isConnected||i.hidden||t.current()&&t.current().name!=="profile"&&!y)return;if(y&&w&&t.current()?.anchor===v){t.dismiss(!0);return}w=y;let C=s(".profile-photo");if(C.textContent=(d.name||d.handle)[0].toUpperCase(),d.avatar){let D=e.ownerDocument.createElement("img");D.alt="",D.addEventListener("error",()=>{D.src=d.avatar},{once:!0}),D.src=d.avatar.replace(/_(?:normal|bigger|mini)(\.[a-z]+)(?=[?#]|$)/i,"_400x400$1"),C.replaceChildren(D)}s(".profile-name").textContent=d.name||`@${d.handle}`,s(".profile-handle").textContent=`@${d.handle}`;let T=s(".profile-bio");T.textContent=d.bio||"",T.hidden=!d.bio;let N=s(".profile-followers");N.textContent=Number.isFinite(d.followers)?`${x.format(d.followers)} followers`:"",N.hidden=!N.textContent,l.querySelector("a").href=`https://x.com/${encodeURIComponent(d.handle)}`,t.show("profile",v,y)};l.addEventListener("pointerenter",B),l.addEventListener("pointerleave",()=>j(V,180));for(let v of["wheel","pointerdown","keydown"])r.addEventListener(v,I,{passive:!0});return r.addEventListener("scroll",()=>{if(t.current()?.name!=="profile")return;let v=t.current().anchor.getBoundingClientRect(),d=r.getBoundingClientRect();v.bottom<=d.top||v.top>=d.bottom?t.dismiss():t.place()},{passive:!0}),{resetWindow(){B(),O()},step(v){I();let d=r.scrollTop>=r.scrollHeight-r.clientHeight-2;v>0&&d&&c.dataset.nextPage==="true"&&n(),r.scrollBy({top:Math.max(80,r.clientHeight*.65)*v,behavior:p().matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"})},autoScroll(v,d){u("auto").setAttribute("aria-pressed",String(v)),b!==d&&(b=d,O()),H()},clearReplies(){B(),t.current()?.name==="profile"&&t.dismiss(),a.replaceChildren(),r.scrollTop=0,A=0,E=void 0,f=0},appendReplies(v){let d=v.map(y=>{let C=document.createElement("li");y.nested&&(C.className="nested");let T=document.createElement(y.avatar?"img":"span");T.className="reply-avatar",y.avatar?(T.src=y.avatar,T.alt="",T.loading="lazy"):(T.textContent=(y.name||y.handle||"X")[0].toUpperCase(),T.setAttribute("aria-hidden","true"));let N=document.createElement("div");N.className="reply-body";let D=document.createElement("a");D.className="reply-author",D.href=ke(y.id),D.target="_blank",D.rel="noopener";let ue=document.createElement("strong");if(ue.textContent=y.name||(y.handle?`@${y.handle}`:"X user"),D.append(ue),y.handle&&y.name){let z=document.createElement("span");z.textContent=`@${y.handle}`,D.append(z)}if(y.date&&Number.isFinite(Date.parse(y.date))){let z=document.createElement("time");z.className="reply-time",z.dateTime=new Date(y.date).toISOString(),z.textContent=h.format(new Date(y.date)),z.title=g.format(new Date(y.date)),N.append(z)}let Y=document.createElement("p");if(Y.textContent=y.text||"View this reply on X",N.prepend(D),N.append(Y),/^[a-z0-9_]{1,15}$/i.test(y.handle)){let z=e.ownerDocument.createElement("button");z.className="avatar-trigger",z.type="button",z.setAttribute("aria-label",`Preview @${y.handle}`),z.setAttribute("aria-controls","menu-profile"),z.setAttribute("aria-expanded","false"),z.append(T),z.addEventListener("pointerenter",()=>j(()=>m(z,y),160)),z.addEventListener("pointerleave",()=>j(V,200)),z.addEventListener("click",()=>{B(),m(z,y,!0)}),C.append(z,N)}else C.append(T,N);return C});a.append(...d)},replyStatus(v,d,y=!1,C=!1){let T=s(".thread-status");T.textContent=v,T.hidden=!v,c.hidden=!d,c.disabled=y,c.textContent=d||"",c.dataset.nextPage=String(C)}}}function he(e){let t=Number(e);return Number.isFinite(t)?Math.max(.25,Math.min(2,Math.round(t*100)/100)):1}function Gn(){let e;function t(){e?.frame!==void 0&&e.owner.cancelAnimationFrame(e.frame),e=void 0}function n(l,c){l.playbackRate!==c&&(l.playbackRate=c)}function o(l,c){l.defaultPlaybackRate!==c&&(l.defaultPlaybackRate=c)}function i(l,c){if(t(),!l)return;let s=he(c);l.preservesPitch=!0,n(l,s),o(l,s)}function a(l,c){l.frame=void 0;let{video:s,target:u,owner:p}=l,x=u-s.playbackRate;if(s.paused||x===0||c-l.sampledAt>=48){let h=s.paused||Math.abs(x)<=.03?u:he(s.playbackRate+x*.55);if(n(s,h),l.sampledAt=c,h===u){o(s,u);return}}l.frame=p.requestAnimationFrame(h=>a(l,h))}function r(l,c){if(!l||l.paused||l.ownerDocument.hidden){i(l,c);return}e?.video!==l&&(t(),l.preservesPitch=!0,e={video:l,owner:l.ownerDocument.defaultView,sampledAt:-1/0});let s=e;s.target=he(c),s.frame??=s.owner.requestAnimationFrame(u=>a(s,u))}return{cancel:t,snap:i,set:r}}var zr=[.25,.5,.75,1,1.5,2],Kn=`
  <div class="speed-header">
    <div class="speed-display">
      <span class="speed-mode">Normal speed</span>
      <span class="speed-value" aria-label="Current playback speed">1\xD7</span>
    </div>
    <button type="button" class="button speed-reset" data-action="speed" data-value="1" aria-label="Reset playback speed" title="Back to 1\xD7">${U("reset")}</button>
  </div>
  <div class="speed-dial">
    <div class="speed-notches" aria-hidden="true"></div>
    <input class="speed-range" type="range" min="${.25}" max="${2}" step=".01" value="1" autofocus aria-label="Playback speed">
  </div>
  <div class="rate-choices" aria-label="Speed presets">
    ${zr.map(e=>`<button type="button" class="button" data-action="speed" data-value="${e}" aria-pressed="${e===1}">${Ce(e)}</button>`).join("")}
  </div>
  <div class="speed-holds" aria-label="Hold to temporarily change speed">
    <button type="button" class="button" data-hold-rate="0.5" aria-label="Hold for half speed">${U("turtle")}<span>Hold \xBD\xD7</span></button>
    <button type="button" class="button" data-hold-rate="2" aria-label="Hold for double speed">${U("rabbit")}<span>Hold 2\xD7</span></button>
  </div>
  <div class="flyout-row loop-heading"><p class="flyout-heading">Loop a section</p>
    <button type="button" class="button" data-action="loop-clear" aria-label="Clear loop" title="Clear loop">${U("reset")}</button>
  </div>
  <div class="loop-choices">
    <button type="button" class="button" data-action="loop-start"><span>A</span><span>Set start</span></button>
    <button type="button" class="button" data-action="loop-end"><span>B</span><span>Set end</span></button>
  </div>
`;function Yn(e,t,n){let o=e.querySelector("#menu-speed"),i=o.querySelector(".speed-range"),a=o.querySelector(".speed-value"),r=o.querySelector(".speed-mode"),l=o.querySelector(".speed-dial"),c=100*(1-.25)/(2-.25);l.style.setProperty("--speed-normal",`${c}%`);let s;function u(g){let w=100*(g-.25)/(2-.25);i.value=g,i.setAttribute("aria-valuetext",Ce(g)),l.style.setProperty("--speed-start",`${Math.min(c,w)}%`),l.style.setProperty("--speed-end",`${Math.max(c,w)}%`),l.dataset.rate=g<1?"slow":g>1?"fast":"normal"}function p(g){let w=Ce(he(g));a.textContent!==w&&(a.textContent=w,r.textContent=g<1?"Slow motion":g>1?"Fast forward":"Normal speed")}function x(){if(!s)return;let{button:g,listeners:w}=s;s=void 0,w.abort(),delete g.dataset.held,n()}function h(g,w){x();let M=new AbortController;s={button:g,input:w,listeners:M},g.dataset.held="",g.ownerDocument.defaultView.addEventListener("blur",x,{once:!0,signal:M.signal}),n(Number(g.dataset.holdRate))}i.addEventListener("input",()=>t(i.valueAsNumber)),o.addEventListener("beforetoggle",g=>{g.newState==="closed"&&x()});for(let g of o.querySelectorAll("[data-hold-rate]"))g.addEventListener("pointerdown",w=>{!w.isPrimary||w.button!==0||(g.setPointerCapture(w.pointerId),h(g,w.pointerId))}),g.addEventListener("lostpointercapture",w=>{s?.button===g&&s.input===w.pointerId&&x()}),g.addEventListener("keydown",w=>{w.key!==" "&&w.key!=="Enter"||(w.preventDefault(),w.repeat||h(g,w.key))}),g.addEventListener("keyup",w=>{s?.button===g&&s.input===w.key&&x()}),g.addEventListener("blur",()=>{s?.button===g&&x()});return u(1),{setTarget:u,setActual:p}}var Zn=`:host {
  all: initial;
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: block;
  color-scheme: dark;
  --ease-ui: cubic-bezier(.22, .61, .36, 1);
  --motion-short: 150ms;
  --page: #0a0a0a;
  --surface: #111111;
  --panel: #161616;
  --border: #2a2a2a;
  --hover: #272727;
  --text: #f3f3f3;
  --body: #e4e4e4;
  --muted: #aaaaaa;
  --accent: #f0f0f0;
  --accent-bg: #262626;
  --accent-hover: #323232;
  --menu-shadow: 0 12px 30px #00000077;
  --video-bar: 59px;
  font: 14px/1.5 system-ui, sans-serif;
  color: var(--text);
  background: var(--page);
}
:host([data-theme="light"]) {
  color-scheme: light;
  --page: #f7f7f7;
  --surface: #ffffff;
  --panel: #ffffff;
  --border: #e3e3e3;
  --hover: #f2f2f2;
  --text: #131313;
  --body: #333333;
  --muted: #616161;
  --accent: #232323;
  --accent-bg: #f0f0f0;
  --accent-hover: #e9e9e9;
  --menu-shadow: 0 12px 30px #35353526;
}
:host([hidden]), [hidden] { display: none !important; }
*, *::before, *::after { box-sizing: border-box; }
a { color: inherit; text-decoration: none; }
button, input { font: inherit; }
svg { display: block; width: 18px; height: 18px; flex: none; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.shell:focus, .stage:focus { outline: none; }
.shell {
  margin: auto;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 16px;
  width: min(100%, 1720px);
  height: 100%;
  padding: 13px 24px 22px;
}
.top, .brand, .tools, .control-row, .sound, .stage-nav, .post-header, .thread-actions, .flyout-row {
  display: flex;
  align-items: center;
}
.top { justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--border); padding: 0 0 11px; }
.brand { gap: 8px; white-space: nowrap; font-size: 18px; letter-spacing: -.045em; }
.mark, .post-avatar, .reply-avatar, .profile-photo {
  display: grid;
  place-items: center;
  flex: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-bg);
  color: var(--accent);
  font-weight: 700;
}
.brand-wordmark { width: 78px; height: 22px; object-fit: contain; }
:host([data-theme="light"]) .brand-wordmark { filter: invert(1); }
.mark { width: 34px; height: 34px; padding: 0; border-radius: 8px; background: transparent; }
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: none;
  min-width: 38px;
  min-height: 38px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--surface);
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--motion-short) var(--ease-ui), border-color var(--motion-short) var(--ease-ui), color var(--motion-short) var(--ease-ui), transform var(--motion-short) var(--ease-ui);
}
.button:hover:not(:disabled) { background: var(--hover); }
.button:active:not(:disabled) { transform: translateY(1px); }
.button:disabled { opacity: .42; cursor: default; }
.button[aria-expanded="true"], .button[aria-pressed="true"] { background: var(--accent-bg); color: var(--accent); }
.tools [data-action="float"] { font-size: 12px; }
.tools [data-action="float"] { background: var(--accent); color: var(--page); padding-inline: 11px; border-color: transparent; }
:host([data-theme="light"]) .tools [data-action="float"] { color: #ffffff; }
.tools [data-action="float"]:hover { background: var(--accent); filter: brightness(1.13); }
.tools [data-action="close"] { background: transparent; border-color: transparent; }
.tools [data-action="close"]:hover { background: var(--hover); }
.viewer-column { display: grid; grid-template-rows: minmax(0, 1fr) auto; gap: 0; min-width: 0; min-height: 0; }
.engagement { display: flex; align-items: center; gap: 5px; min-width: 0; margin-top: 6px; border-top: 1px solid var(--border); padding: 4px 0 0; }
.engagement .button { border: 0; background: transparent; font-size: 12px; padding-inline: 9px; min-width: 34px; min-height: 35px; }
.engagement .button:hover:not(:disabled) { background: var(--hover); }
.engagement [data-action="share"] { margin-left: auto; }
.engagement [data-action="like"][aria-pressed="true"] { color: #f0f0f0; }
.engagement [data-action="like"][aria-pressed="true"] svg, .engagement [data-action="bookmark"][aria-pressed="true"] svg { fill: currentColor; }
.engagement [data-action="repost"][aria-pressed="true"] { color: #ededed; }
:host([data-theme="light"]) .engagement [data-action="repost"][aria-pressed="true"] { color: #242424; }
.engagement [data-action="bookmark"][aria-pressed="true"] { color: var(--accent); }
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(270px, 24vw, 370px);
  gap: 15px;
  min-height: 0;
}
.layout:has(.empty:not([hidden])) { grid-template-columns: minmax(0, 1fr); }
.layout:has(.empty:not([hidden])) .rail { display: none; }
.stage, .rail, .thread { min-width: 0; min-height: 0; border: 1px solid var(--border); border-radius: 16px; }
.stage {
  position: relative;
  overflow: hidden;
  background: #060606;
  --video-accent: #f1f1f1;
  color-scheme: dark;
}
.stage:fullscreen { border: 0; border-radius: 0; }
.track {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  scrollbar-width: none;
  scroll-snap-type: y mandatory;
  overflow-anchor: none;
  overscroll-behavior: contain;
}
.track::-webkit-scrollbar { display: none; }
.track-space { scroll-snap-align: none; pointer-events: none; }
.frame {
  height: 100%;
  margin: 0;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  cursor: pointer;
}
.frame.is-active video { animation: video-appear 170ms var(--ease-ui); }
.frame video { display: block; width: 100%; height: calc(100% - var(--video-bar)); object-fit: contain; }
:host([data-fit="fill"]) .frame video { object-fit: cover; }
.empty {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 12px;
  height: 100%;
  padding: 22px;
  text-align: center;
  color: #b8b8b8;
}
.empty span { max-width: 36ch; overflow-wrap: anywhere; }
.empty svg { width: 28px; height: 28px; color: var(--video-accent); }
.controls {
  position: absolute;
  inset: auto 0 0;
  height: var(--video-bar);
  padding: 4px 12px 5px;
  background: #101010;
  border-top: 1px solid #2d2d2d;
  color: #f3f3f3;
}
.control-row { gap: 2px; }
.control-row .button { min-width: 33px; min-height: 33px; padding-inline: 7px; border: 0; background: transparent; color: inherit; }
.control-row .button:hover { background: #2d2d2d; }
.control-row [data-menu="speed"] { margin-left: 4px; min-width: 45px; color: #ebebeb; font-size: 12px; font-variant-numeric: tabular-nums; }
.control-row [data-menu="speed"][aria-expanded="true"] { background: #292929; }
.stage-nav { margin-left: auto; gap: 2px; }
.control-row [data-action="framing"] { font-size: 12px; }
.control-row [data-action="framing"][aria-pressed="true"] { background: #292929; }
.control-row [data-action="framing"] svg { width: 15px; height: 15px; }
.time { padding-inline: 5px; white-space: nowrap; font-size: 12px; color: #d4d4d4; font-variant-numeric: tabular-nums; }
input[type="range"] { appearance: none; display: block; height: 16px; margin: 0; background: transparent; cursor: pointer; }
.seekbar { position: relative; }
.seek { width: 100%; }
.volume { width: 60px; }
input[type="range"]::-webkit-slider-runnable-track { height: 4px; background: var(--border); border-radius: 8px; }
.controls input[type="range"]::-webkit-slider-runnable-track { background: #5f5f5f; }
.controls .seek::-webkit-slider-runnable-track { background: linear-gradient(to right, var(--video-accent) var(--progress, 0%), #5f5f5f var(--progress, 0%)); }
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  margin-top: -4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--video-accent, var(--accent));
  border: 1px solid #ffffff70;
}
input[type="range"]:disabled { opacity: .4; cursor: default; }
.loop-mark { position: absolute; inset: 3px auto 3px 0; width: 2px; background: #acacac; pointer-events: none; }
.notice {
  position: absolute;
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
  max-width: calc(100% - 24px);
  width: max-content;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 11px;
  color: var(--text);
  background: var(--panel);
  box-shadow: var(--menu-shadow);
  pointer-events: none;
}
.thread { background: var(--surface); }
.rail { grid-column: 2; grid-row: 1; align-self: start; max-height: 100%; overflow: auto; border: 0; }
.post {
  position: relative;
  isolation: isolate;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--panel) 82%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text) 6%, transparent);
  backdrop-filter: blur(13px);
}
.post::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 0 auto auto;
  width: 104px;
  height: 62px;
  border-radius: inherit;
  background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
  background-size: 12px 12px;
  mask-image: linear-gradient(215deg, #000b, transparent 80%);
  pointer-events: none;
}
.post-header { gap: 9px; }
.post-header .external { margin-left: auto; min-width: 32px; min-height: 32px; padding: 0 5px; background: var(--surface); }
.post-header .external svg { width: 15px; height: 15px; }
.post-identity { display: flex; flex-direction: column; min-width: 0; }
.post-handle { color: var(--muted); font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
.post-handle:empty { display: none; }
.post-avatar { overflow: hidden; border: 1px solid var(--border); }
.post-avatar img { height: 100%; width: 100%; object-fit: cover; }
.author { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 15px; font-weight: 700; }
.author[href]:hover, .reply-author:hover strong { text-decoration: underline; }
.caption { margin: 10px 0 0; color: var(--body); overflow-wrap: anywhere; white-space: pre-line; }
.caption:not([hidden]) { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 8; overflow: hidden; }
.split { display: none; }
.thread {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.thread-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}
.thread-header > div { min-width: 0; }
.thread-actions { gap: 5px; }
.thread-actions .button { min-height: 34px; min-width: 34px; padding: 0 7px; font-size: 11px; }
.thread-actions .button svg { width: 16px; height: 16px; }
.thread h2 { margin: 0; font-size: 16px; letter-spacing: -.02em; }
.thread-author { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: 12px; }
.thread-author:empty { display: none; }
.thread-scroll { flex: 1; min-height: 0; overflow: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
.thread-scroll:focus-visible { outline-offset: -2px; }
.reply-list { margin: 0; padding: 0; list-style: none; }
.reply-list li { display: flex; gap: 9px; padding: 12px 13px; border-bottom: 1px solid var(--border); }
.reply-list li.nested { padding-left: 23px; }
.reply-avatar { width: 32px; height: 32px; object-fit: cover; font-size: 12px; }
.avatar-trigger { align-self: start; padding: 0; border: 0; border-radius: 50%; background: transparent; cursor: pointer; }
.avatar-trigger:hover, .avatar-trigger[aria-expanded="true"] { box-shadow: 0 0 0 2px var(--accent); }
.reply-body { min-width: 0; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: baseline; column-gap: 5px; }
.reply-author { display: flex; align-items: baseline; flex-wrap: wrap; column-gap: 6px; color: var(--muted); font-size: 11px; overflow-wrap: anywhere; }
.reply-author strong { color: var(--text); font-size: 13px; }
.reply-time { color: var(--muted); font-size: 11px; white-space: nowrap; }
.reply-body p { grid-column: 1 / -1; margin: 4px 0 0; color: var(--body); font-size: 13px; overflow-wrap: anywhere; white-space: pre-wrap; }
.thread-status { margin: 16px 13px; color: var(--muted); }
.more { display: flex; margin: 10px auto; min-height: 34px; }
.thread-link { justify-content: space-between; margin: 8px 10px 10px; min-height: 34px; font-size: 12px; color: var(--accent); }
.thread-link svg { width: 15px; height: 15px; }
.thread-open { display: none; }
.show-thread .rail { visibility: hidden; }
.show-thread .thread { animation: thread-appear 170ms var(--ease-ui); }

.flyout {
  position: fixed;
  inset: auto;
  z-index: 4;
  margin: 0;
  width: min(210px, calc(100vw - 16px));
  max-height: calc(100vh - 16px);
  padding: 6px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
  color: var(--text);
  background: var(--panel);
  box-shadow: var(--menu-shadow);
  font-size: 13px;
  overscroll-behavior: contain;
}
.flyout:not([data-positioned]) { opacity: 0; pointer-events: none; }
.flyout[data-positioned] { animation: panel-appear 155ms var(--ease-ui); }

@keyframes panel-appear {
  from { opacity: 0; transform: translateY(4px) scale(.99); }
}
@keyframes thread-appear {
  from { opacity: .72; }
}
@keyframes video-appear {
  from { opacity: .9; }
}

.flyout-heading { margin: 0; padding: 5px 7px; font-size: 12px; font-weight: 650; }
.flyout-section { margin-top: 5px; border-top: 1px solid var(--border); padding-top: 8px; }
.choice, #menu-appearance > .button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 0 7px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.choice:hover, #menu-appearance > .button:hover:not(:disabled) { background: var(--hover); }
.choice[aria-pressed="true"] { background: var(--accent-bg); color: var(--accent); font-weight: 650; }
.choice svg, #menu-appearance svg { width: 16px; height: 16px; }
.choice span, #menu-appearance > .button span { flex: 1; }
.choice[aria-pressed="false"] svg:last-child { visibility: hidden; }
#menu-appearance { width: min(234px, calc(100vw - 16px)); }
#menu-appearance [data-menu="help"] { margin-top: 5px; border-top: 1px solid var(--border); }
.quality-label { color: var(--muted); font-size: 10px; white-space: nowrap; }
.flyout { top: 0; left: 0; }
#menu-help { width: min(310px, calc(100vw - 16px)); }
#menu-speed { width: min(328px, calc(100vw - 16px)); color-scheme: inherit; padding: 10px; }
.speed-header, .rate-choices, .speed-holds, .loop-choices { display: flex; align-items: center; gap: 5px; }
.speed-header { justify-content: space-between; padding: 2px 3px 3px; }
.speed-display { display: flex; flex-direction: column; min-width: 0; }
.speed-mode { color: var(--muted); font-size: 11px; font-weight: 600; }
.speed-value { font-size: 27px; font-weight: 730; line-height: 1.12; font-variant-numeric: tabular-nums; }
.speed-reset.button { min-width: 34px; min-height: 34px; padding: 0; border: 1px solid var(--border); }
.speed-reset svg { width: 15px; height: 15px; }
.speed-dial {
  --speed-color: var(--accent);
  position: relative;
  margin: 6px 0 8px;
  padding: 6px 10px 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
}
.speed-dial[data-rate="slow"] { --speed-color: #baa8ed; }
.speed-dial[data-rate="fast"] { --speed-color: #f1ac71; }
:host([data-theme="light"]) .speed-dial[data-rate="slow"] { --speed-color: #6a50b3; }
:host([data-theme="light"]) .speed-dial[data-rate="fast"] { --speed-color: #985023; }
.speed-notches {
  position: absolute;
  inset: auto 20px 7px;
  height: 5px;
  background: repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px calc(100% / 14));
  pointer-events: none;
}
.speed-notches::after {
  content: '';
  position: absolute;
  inset: -2px auto -1px var(--speed-normal);
  width: 2px;
  border-radius: 2px;
  background: var(--muted);
}
.speed-dial .speed-range { width: 100%; height: 30px; margin: 0; touch-action: pan-y; }
.speed-dial .speed-range::-webkit-slider-runnable-track {
  height: 6px;
  margin-inline: 2px;
  background: linear-gradient(to right,
    var(--border) 0 var(--speed-start), var(--speed-color) var(--speed-start) var(--speed-end),
    var(--border) var(--speed-end) 100%);
}
.speed-dial .speed-range::-webkit-slider-thumb {
  width: 19px;
  height: 19px;
  margin-top: -6.5px;
  background: var(--speed-color);
  border: 4px solid var(--surface);
  box-shadow: 0 0 0 1px var(--speed-color);
}
.speed-dial:has(.speed-range:focus-visible) { outline: 2px solid var(--speed-color); outline-offset: 2px; }
.speed-dial .speed-range:focus-visible { outline: none; }
.speed-dial .speed-range:active { cursor: grabbing; }
.rate-choices .button, .speed-holds .button { flex: 1; min-width: 0; min-height: 31px; padding: 0 3px; font-size: 11px; }
.rate-choices .button { font-variant-numeric: tabular-nums; }
.speed-holds { margin-top: 7px; }
.speed-holds .button { gap: 6px; min-height: 34px; border: 1px solid var(--border); touch-action: manipulation; user-select: none; }
.speed-holds svg { width: 16px; height: 16px; }
.speed-holds .button[data-held] { background: var(--accent-bg); border-color: var(--muted); color: var(--accent); }
.loop-heading { justify-content: space-between; border-top: 1px solid var(--border); margin-top: 8px; padding-top: 4px; }
.loop-heading .button { min-width: 29px; min-height: 29px; padding: 0 5px; }
.loop-heading svg { width: 14px; height: 14px; }
.loop-choices { margin-top: 5px; }
.loop-choices .button { flex: 1; justify-content: flex-start; min-height: 32px; padding-left: 7px; font-size: 11px; }
.loop-choices .button span:first-child { padding: 0 4px; border-radius: 4px; background: var(--accent-bg); color: var(--accent); }
.shortcut-list { margin: 0; padding: 2px 7px 5px; }
.shortcut-list div { display: flex; justify-content: space-between; gap: 7px; padding: 4px 0; border-bottom: 1px solid var(--border); }
.shortcut-list div:last-child { border: 0; }
.shortcut-list dd { margin: 0; }
kbd { padding: 2px 4px; border: 1px solid var(--border); border-radius: 4px; font: 11px system-ui, sans-serif; color: var(--muted); white-space: nowrap; }
.profile-card { width: min(276px, calc(100vw - 16px)); padding: 12px; }
.profile-header, .profile-footer { display: flex; align-items: center; gap: 9px; }
.profile-photo { width: 62px; height: 62px; overflow: hidden; font-size: 22px; }
.profile-photo img { width: 100%; height: 100%; object-fit: cover; }
.profile-name, .profile-handle { display: block; overflow-wrap: anywhere; }
.profile-name { font-size: 14px; }
.profile-handle, .profile-followers { color: var(--muted); font-size: 12px; }
.profile-bio { margin: 9px 0 0; color: var(--body); overflow-wrap: anywhere; white-space: pre-line; }
.profile-footer { justify-content: space-between; margin-top: 10px; }
.profile-footer .button { min-height: 31px; font-size: 12px; color: var(--accent); }
.profile-footer svg { width: 14px; height: 14px; }

@media (max-width: 820px), (display-mode: picture-in-picture) {
  :host { --video-bar: 51px; }
  .shell { gap: 7px; padding: 7px; }
  .brand { gap: 6px; font-size: 13px; }
  .mark { width: 29px; height: 29px; border-radius: 8px; }
  .tools { gap: 4px; }
  .tools .button { min-height: 32px; min-width: 32px; padding-inline: 6px; border-radius: 7px; }
  .top { padding-bottom: 5px; }
  :host([data-floating]) .tools [data-action="float"] span { display: none; }
  .engagement { gap: 1px; margin-top: 3px; padding-top: 2px; }
  .engagement .button { min-height: 29px; min-width: 30px; padding-inline: 5px; font-size: 11px; }
  .engagement svg { width: 16px; height: 16px; }
  .engagement [data-action="share"] span { display: none; }
  .layout { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; gap: 7px; }
  .stage, .rail, .thread { border-radius: 11px; }
  .rail { grid-column: 1; grid-row: 2; }
  .post { padding: 8px 9px; border-radius: 12px; }
  .post-header { gap: 6px; }
  .post-avatar { width: 29px; height: 29px; font-size: 12px; }
  .author { font-size: 13px; }
  .caption { margin: 3px 0 0; font-size: 12px; }
  .caption:not([hidden]) { -webkit-line-clamp: 2; }
  .controls { padding: 3px 7px; }
  .control-row .button { min-width: 29px; min-height: 27px; padding-inline: 4px; }
  .control-row .button svg { width: 16px; height: 16px; }
  .volume { width: 42px; }
  .time { padding-inline: 2px; font-size: 11px; }
  .show-thread { gap: 0; grid-template-rows: clamp(149px, var(--video-share, 46%), max(149px, calc(100% - 153px))) 12px minmax(0, 1fr); }
  .show-thread .rail { display: none; }
  .show-thread .split { display: grid; grid-column: 1; grid-row: 2; place-items: center; cursor: row-resize; touch-action: none; }
  .split::before { content: ""; width: 28px; height: 3px; border-radius: 5px; background: var(--muted); }
  .split:hover::before, .split:focus-visible::before { background: var(--accent); }
  .split:focus-visible { outline: 0; }
  .split:focus-visible::before { outline: 1px solid var(--accent); outline-offset: 2px; }
  .thread { grid-column: 1; grid-row: 3; }
  .thread-header { padding: 6px 8px 6px 10px; }
  .thread-actions .button { min-height: 31px; min-width: 31px; }
}
@media (max-width: 360px) {
  .brand-wordmark { width: 66px; height: 18px; }
  :host(:not([data-floating])) .tools [data-action="float"] span { display: none; }
  .volume { width: 27px; }
  .time { font-size: 10px; }
}
@media (max-width: 330px) {
  .control-row [data-action="framing"] svg { display: none; }
  .volume { display: none !important; }
}
@media (max-height: 430px) and (max-width: 820px), (max-height: 430px) and (display-mode: picture-in-picture) {
  .thread-link { display: none; }
  .thread-open { display: inline-flex; }
}
@media (max-height: 370px) and (max-width: 820px), (max-height: 370px) and (display-mode: picture-in-picture) {
  .caption:not([hidden]) { -webkit-line-clamp: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .button { transition: none; }
  .button:active:not(:disabled) { transform: none; }
  .flyout, .show-thread .thread, .frame.is-active video { animation: none; }
}
`;var rt="data:image/png;base64,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";var it="data:image/png;base64,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";function eo(e){let t=document.createElement("div");t.id="xscroll-player",t.hidden=!0;let n=t.attachShadow({mode:"open"});n.innerHTML=`
    <style>${Zn}</style>
    <div class="shell" role="dialog" aria-label="XScroll" tabindex="-1">
      <header class="top">
        <div class="brand"><img class="mark" src="${rt}" alt=""><img class="brand-wordmark" src="${it}" alt="XScroll"></div>
        <div class="tools">
          ${q("float","Open floating player","Mini player")}
          ${Ae("appearance","Player settings",U("appearance"))}
          ${q("close","Close XScroll (Esc)")}
        </div>
      </header>
      <main class="layout">
        <section class="viewer-column" aria-label="Video and post actions">
        <div class="stage" id="video-stage" tabindex="-1">
          <div class="track" aria-label="Video feed">
            <div class="empty">${U("reels")}<span role="status">Looking for unseen videos\u2026</span><button type="button" class="button" data-action="retry" hidden>Find more</button></div>
          </div>
          <div class="controls" hidden>
            <div class="seekbar">
              <input class="seek" type="range" min="0" max="0" step="0.1" value="0" aria-label="Seek video" disabled>
              <i class="loop-mark" hidden></i><i class="loop-mark" hidden></i>
            </div>
            <div class="control-row">
              ${q("play","Play (Space)")}
              <div class="sound">${q("volume","Mute (M)")}<input class="volume" type="range" min="0" max="1" step="0.05" value="1" aria-label="Volume"></div>
              <span class="time">0:00 / 0:00</span>
              ${Ae("speed","Playback speed","<span>1\xD7</span>")}
              <div class="stage-nav" aria-label="Navigate videos">
                ${q("up","Previous video (\u2191)")}
                ${q("down","Next video (\u2193)")}
              </div>
              ${q("framing","Fill video frame (V)","Fit")}
              ${q("fullscreen","Fullscreen")}
            </div>
          </div>
          ${Re("speed","Playback speed",Kn)}
          <div class="notice" role="status" hidden></div>
        </div>
        <div class="engagement" aria-label="Post actions" hidden>
          ${q("like","Like","Like")}
          ${q("repost","Repost","Repost")}
          ${q("bookmark","Bookmark","Save")}
          ${q("replies","Show replies","Replies")}
          ${q("share","Copy post link","Share")}
        </div>
        </section>
        <aside class="rail" aria-label="Current post">
          <div class="post" hidden>
            <div class="post-header">
              <div class="post-avatar" aria-hidden="true"></div>
              <div class="post-identity"><a class="author" target="_blank" rel="noopener"></a><span class="post-handle"></span></div>
              <a class="button external" target="_blank" rel="noopener" title="Open post on X" aria-label="Open post on X">${U("external")}</a>
            </div>
            <p class="caption"></p>
          </div>
        </aside>
        <div class="split" role="separator" aria-label="Video and replies split" aria-controls="video-stage" aria-orientation="horizontal" aria-valuemin="24" aria-valuemax="72" aria-valuenow="40" tabindex="0"></div>
        <section class="thread" id="thread" aria-labelledby="thread-title" hidden>
          <header class="thread-header">
            <div><h2 id="thread-title">Replies</h2><span class="thread-author"></span></div>
            <div class="thread-actions">
              ${q("auto","Auto-scroll replies (A)","Auto-scroll")}
              <a class="button thread-open" target="_blank" rel="noopener" title="Open conversation on X" aria-label="Open conversation on X">${U("external")}</a>
              <button type="button" class="button" data-action="hide-replies" title="Close replies (Esc)" aria-label="Close replies (Esc)">${U("close")}</button>
            </div>
          </header>
          <div class="thread-scroll" role="region" aria-label="Replies list" tabindex="0">
            <ul class="reply-list"></ul>
            <p class="thread-status" role="status" hidden></p>
            <button type="button" class="button more" data-action="more" hidden></button>
          </div>
          <a class="button thread-link" target="_blank" rel="noopener">Open conversation on X${U("external")}</a>
        </section>
      </main>
      ${Re("quality","Video quality",'<div class="quality-options"></div>')}
      ${Re("appearance","Player settings",`
        ${Ae("quality","Video quality",`${U("quality")}<span>Video quality</span><small class="quality-label">Auto</small>`)}
        ${q("download","Download video","Download video")}
        ${Ae("size","Mini player size and framing",`${U("size")}<span>Mini player size</span>`)}
        <p class="flyout-heading flyout-section">Appearance</p>
        ${oe("theme","system","System","system")}
        ${oe("theme","light","Light","sun")}
        ${oe("theme","dark","Dark","appearance")}
        ${Ae("help","Keyboard shortcuts (?)",`${U("shortcuts")}<span>Keyboard shortcuts</span><kbd>?</kbd>`)}
      `)}
      ${Re("size","Window size",`
        ${oe("resize","compact","Compact")}
        ${oe("resize","balanced","Balanced")}
        ${oe("resize","large","Large")}
        <p class="flyout-heading flyout-section">Video framing</p>
        ${oe("fit","contain","Fit")}
        ${oe("fit","fill","Fill")}
      `)}
      ${Re("help","Keyboard shortcuts",`
        <dl class="shortcut-list">${mn.map(([m,v])=>`<div><dt>${m}</dt><dd><kbd>${v}</kbd></dd></div>`).join("")}</dl>
      `)}
      <section class="flyout profile-card" id="menu-profile" aria-label="Profile preview" hidden>
        <div class="profile-header">
          <div class="profile-photo"></div>
          <div><strong class="profile-name"></strong><span class="profile-handle"></span></div>
        </div>
        <p class="profile-bio" hidden></p>
        <div class="profile-footer">
          <span class="profile-followers" hidden></span>
          <a class="button" target="_blank" rel="noopener">View profile${U("external")}</a>
        </div>
      </section>
    </div>`;let o=m=>n.querySelector(m),i=m=>o(`button[data-action="${m}"]`),a=o(".track"),r=o(".seek"),l=o(".volume"),c=o(".layout"),s=o(".split"),u=o(".thread"),p=i("replies"),x=o(".notice"),h=o(".shell"),g=Yn(n,e.speed,e.speedPreview),w=m=>o(`[data-menu="${m}"]`),M=new Intl.NumberFormat(void 0,{notation:"compact"});p.setAttribute("aria-expanded","false"),p.setAttribute("aria-controls","thread");let b,k,$=qn(n,w),f=Jn(t,$,e.more),{show:E,dismiss:A,place:I,current:H}=$,F=(m,v)=>{for(let d of n.querySelectorAll(`[data-action="${m}"][aria-pressed]`))d.setAttribute("aria-pressed",String(d.dataset.value===String(v)))},O=(m,v,d)=>{let y=i(m);y.title!==d&&(y.title=d,y.setAttribute("aria-label",d),y.querySelector("svg").outerHTML=U(v))},B=m=>{if(!Number.isFinite(m))return"0:00";let v=String(Math.floor(m%60)).padStart(2,"0"),d=Math.floor(m/60)%60;return m<3600?`${d}:${v}`:`${Math.floor(m/3600)}:${String(d).padStart(2,"0")}:${v}`},j=m=>{for(let v of[o(".author"),o(".external"),o(".thread-link"),o(".thread-open")])m?v.href=ke(m):v.removeAttribute("href")};for(let m of[i("down"),i("up"),i("download"),p])m.disabled=!0;n.addEventListener("click",m=>{let v=m.target.closest("[data-menu]");if(v){let T=v.dataset.menu;if(H()?.name===T)A(!0);else{let N=T==="appearance"||T==="speed"?v:w("appearance");E(T,N)}return}let d=m.target.closest("[data-action]");if(!d)return;let{action:y,value:C}=d.dataset;["quality","theme","resize","fit","download"].includes(y)&&A(!0),e[y](C)}),r.addEventListener("input",()=>e.seek(Number(r.value))),l.addEventListener("input",()=>e.setVolume(Number(l.value))),a.addEventListener("scrollend",()=>e.scroll(),{passive:!0}),a.addEventListener("wheel",m=>{m.ctrlKey||Math.abs(m.deltaX)<=Math.abs(m.deltaY)||(m.preventDefault(),e.scrub(m.deltaX/20))},{passive:!1});let V=(m,v)=>{let d=Math.min(72,Math.max(24,Math.round(m)));c.style.setProperty("--video-share",`${d}%`),s.setAttribute("aria-valuenow",String(d)),e.split(d,v)};return s.addEventListener("pointerdown",m=>{m.button===0&&s.setPointerCapture(m.pointerId)}),s.addEventListener("pointermove",m=>{if(!s.hasPointerCapture(m.pointerId))return;let v=c.getBoundingClientRect();V((m.clientY-v.top)/v.height*100,!1)}),s.addEventListener("lostpointercapture",()=>e.split(Number(s.getAttribute("aria-valuenow")),!0)),s.addEventListener("keydown",m=>{let v={ArrowUp:-1,ArrowDown:1}[m.key];v&&(m.preventDefault(),V(Number(s.getAttribute("aria-valuenow"))+v*5,!0))}),{host:t,shadow:n,track:a,replies:f,empty(m,v=""){o(".empty span").textContent=m,i("retry").hidden=!v,v&&(i("retry").textContent=v)},stage:o(".stage"),float:i("float"),dismissMenu:A,placeMenu:I,focus:()=>(n.fullscreenElement||h).focus({preventScroll:!0}),help:()=>H()?.name==="help"?A(!0):E("help",w(n.fullscreenElement?"speed":"appearance")),menuFocusables:()=>$.focusables(),appearance(m,v){t.dataset.theme=v,F("theme",m)},quality(m,v,d){let y=o(".quality-options"),C=m.map(([T,N])=>oe("quality",T,N)).join("");k!==C&&(y.innerHTML=C,k=C,I()),F("quality",v),o(".quality-label").textContent=d},speed(m){w("speed").querySelector("span").textContent=Ce(m),F("speed",m),g.setTarget(m)},actualSpeed:g.setActual,loop(m,v){let d=[m?.start,m?.end];for(let[y,C]of["loop-start","loop-end"].entries()){let T=n.querySelectorAll(".loop-mark")[y],N=d[y];T.hidden=N===void 0||!v,T.hidden||(T.style.left=`${N/v*100}%`),i(C).lastElementChild.textContent=N===void 0?y?"Set end":"Set start":`${B(N)}.${Math.floor(N*10)%10}`}i("loop-start").disabled=!v,i("loop-end").disabled=!v||m?.start===void 0,i("loop-clear").disabled=m?.start===void 0},windowSettings(m,v,d){F("resize",m),F("fit",v),t.dataset.fit=v;let y=i("framing"),C=v==="fill";y.setAttribute("aria-pressed",String(C)),y.title=C?"Fill \xB7 Cropped to frame (V)":"Fit \xB7 Whole image (V)",y.querySelector("span").textContent=C?"Fill":"Fit",d!==void 0&&(c.style.setProperty("--video-share",`${d}%`),s.setAttribute("aria-valuenow",String(d)))},post(m){o(".post").hidden=!m,o(".controls").hidden=!m,o(".empty").hidden=!!m,p.disabled=!m?.tweetId,i("download").disabled=!m,o(".engagement").hidden=!m?.tweetId;let v=m?.user?`@${m.user}`:"",d=o(".post-avatar"),y=(m?.name||m?.user||"X").slice(0,1).toUpperCase();if(d.replaceChildren(y),m?.avatar){let T=t.ownerDocument.createElement("img");T.alt="",T.addEventListener("error",()=>{d.firstElementChild===T&&d.replaceChildren(y)},{once:!0}),T.src=m.avatar,d.replaceChildren(T)}o(".author").textContent=m?.name||v||"Post on X",o(".post-handle").textContent=m?.name?v:"",o(".thread-author").textContent=m?.user?v:"",o(".caption").textContent=m?.text||"",o(".caption").hidden=!m?.text;let C=m?.replyCount;p.querySelector("span").textContent=C>0?M.format(C):"Replies",p.setAttribute("aria-label",C>0?`Show ${M.format(C)} replies`:"Show replies"),j(m?.tweetId)},playback(m,v=m?.muted){let d=Number.isFinite(m?.duration)?m.duration:0,y=v||m?.volume===0;r.max=d,r.value=m?.currentTime||0,r.disabled=!d,r.style.setProperty("--progress",`${d?m.currentTime/d*100:0}%`),o(".time").textContent=`${B(m?.currentTime)} / ${B(d)}`,r.setAttribute("aria-valuetext",`${B(m?.currentTime)} of ${B(d)}`),l.value=y?0:m?.volume??1,O("play",m?.paused?"play":"pause",m?.paused?"Play (Space)":"Pause (Space)"),O("volume",y?"mute":"volume",y?"Unmute (M)":"Mute (M)")},floating(m,v){A(),f.resetWindow(),t.toggleAttribute("data-floating",m),h.setAttribute("aria-modal",String(!m)),i("float").hidden=!v,i("fullscreen").hidden=m,w("size").hidden=!m,O("float",m?"restore":"float",m?"Return player to tab":"Open floating player"),i("float").querySelector("span").textContent=m?"Return to tab":"Mini player"},full(m){O("fullscreen",m?"shrink":"fullscreen",m?"Exit fullscreen":"Fullscreen")},navigate(m,v){i("up").disabled=!m,i("down").disabled=!v},downloading(m,v=!0){i("download").disabled=m||!v,i("download").setAttribute("aria-busy",String(m))},message(m){clearTimeout(b),x.textContent=m,x.hidden=!m,m&&(b=setTimeout(()=>{x.hidden=!0},2600))},toggleReplies(m,v){u.hidden=!m,c.classList.toggle("show-thread",m),!m&&H()?.name==="profile"&&A(),p.setAttribute("aria-expanded",String(m)),v&&(m?i("hide-replies"):p).focus()},engagement(m){for(let[v,d,y,C]of[["like","Like","Unlike","Like"],["repost","Repost","Undo repost","Repost"],["bookmark","Bookmark","Remove bookmark","Save"]]){let T=i(v),N=m?.stats[v]===!0,D=m?.stats[`${v}Count`],ue=!!m?.pending.has(v);T.disabled=!m||ue,T.setAttribute("aria-pressed",String(N)),T.setAttribute("aria-busy",String(ue));let Y=N?y:d;T.setAttribute("aria-label",Y),T.title=Y,T.querySelector("span").textContent=D>0&&v!=="bookmark"?M.format(D):C}}}}function G(e,t){try{return localStorage.getItem(`xscroll:${e}`)??localStorage.getItem(`video-drift-x:${e}`)??t}catch{return t}}function K(e,t){try{localStorage.setItem(`xscroll:${e}`,t)}catch{}}var to=2,no=[270,360,480,540,720,1080,1440,2160];function St(e,t,n=720){let o=e.variants,i=r=>Number.parseInt(r.label,10);if(t==="best")return o[0];if(t!=="auto"){let r=o.find(l=>l.label===t);if(r)return r}let a=t==="auto"?n:Number.parseInt(t,10);return o.find(r=>!(i(r)>a))||o.at(-1)}function oo(e,{onSlide:t,onPlayback:n,onSync:o=()=>{}}){let{track:i}=e,a=i.ownerDocument.createElement("div"),r=i.ownerDocument.createElement("div");a.className=r.className="track-space",i.append(a,r);let l=new Map,c=new Map,s=Gn(),u=()=>g[w],p=()=>l.get(w),x=()=>p()?.video,h=S=>St(S,M,H),g=[],w=-1,M=G("quality","auto"),b=1,k,$=!1,f=1,E=!1,A=()=>E?$:x()?.muted??$,I=()=>k??b,H=720,F=0,O=-1/0,B=!1,j=0;function V(S){if(S)return S.play().catch(R=>{if(!(R.name!=="NotAllowedError"||S!==x()||S.muted))return S.muted=!0,S.play().catch(()=>{})})}function m(S){S?.loopFrame!==void 0&&(S.video.cancelVideoFrameCallback(S.loopFrame),S.loopFrame=void 0)}function v(S){let{video:R,loop:L}=S;R!==x()||R.paused||L?.end===void 0||S.loopFrame!==void 0||(S.loopFrame=R.requestVideoFrameCallback((P,_)=>{S.loopFrame=void 0,!(R!==x()||R.paused||S.loop!==L)&&(!R.seeking&&(_.mediaTime>=L.end||R.currentTime<L.start-.08)&&(R.currentTime=L.start),v(S))}))}function d(){let S=x();S&&(e.playback(S,A()),n(S))}function y(){let S=u(),R=[...new Set(S?.variants.map(Q=>Q.label))].map(Q=>[Q,Q]),L=S?`Auto \xB7 ${St(S,"auto",H).label}`:"Auto",P=M==="auto"||M==="best"||!S?M:h(S).label,_=P==="auto"?L:P==="best"?"Best":P;e.quality([["auto",L],["best","Best"],...R],P,_)}function C(S){M=S,K("quality",S);for(let R of l.values()){let L=R.video,P=h(R.clip).url;if(L.src===P)continue;let _=L.currentTime,Q=L===x(),ne=Q&&!L.paused;L.src=P,L.currentTime=_,Q&&s.snap(L,I()),ne&&V(L)}y()}function T(S){let R=S.video,L=performance.now();if(M!=="auto"||R!==x()||R.seeking||R.currentTime<.6||L-S.startedAt<1500||L-O<5e3)return;let P=Number.parseInt(h(S.clip).label,10),_=St(S.clip,"auto",P-1);!(P>no[0])||_.url===R.src||(S.stalled=!0,F=0,O=L,H=P-1,C("auto"))}function N(S,R){let L=i.ownerDocument,P=L.createElement("div");P.className="frame",P.dataset.index=String(R);let _=L.createElement("video");Object.assign(_,{loop:!0,playsInline:!0,preload:"auto",poster:S.poster||"",preservesPitch:!0}),P.append(_);let Q=c.get(S.key),ne={clip:S,frame:P,video:_,startedAt:performance.now(),loop:Q?.loop};Q?.time&&_.addEventListener("loadedmetadata",()=>{_.currentTime===0&&(_.currentTime=Math.min(Q.time,Math.max(0,_.duration-.1)))},{once:!0}),P.addEventListener("click",()=>{_===x()&&Tt()});for(let pe of["play","durationchange","timeupdate","volumechange"])_.addEventListener(pe,()=>{_===x()&&(d(),pe!=="timeupdate"&&o())});for(let pe of["playing","pause","waiting","seeking","seeked","emptied"])_.addEventListener(pe,()=>{_===x()&&(pe==="seeking"&&j++,(pe==="playing"||pe==="seeked")&&(ne.startedAt=performance.now()),_.paused?(s.snap(_,I()),m(ne)):v(ne),pe==="waiting"&&T(ne),d(),o())});return _.addEventListener("ratechange",()=>{_===x()&&(e.actualSpeed(_.playbackRate),o())}),_.addEventListener("loadedmetadata",()=>{_===x()&&e.loop(ne.loop,_.duration)}),_.addEventListener("error",()=>{_===x()&&e.message("This video couldn\u2019t play.")}),_.src=h(S).url,ne}function D(S,R){m(R),(R.video.currentTime>0||R.loop)&&(c.set(R.clip.key,{time:R.video.currentTime,loop:R.loop}),c.size>300&&c.delete(c.keys().next().value)),R.video.pause(),R.frame.remove(),R.video.removeAttribute("src"),R.video.load(),l.delete(S)}function ue(){if(w<0)return;let S=Math.max(0,w-to),R=Math.min(g.length-1,w+to);a.style.height=`${S*100}%`,r.style.height=`${(g.length-R-1)*100}%`;for(let[P,_]of l)(P<S||P>R)&&D(P,_);let L=r;for(let P=R;P>=S;P--){l.has(P)||l.set(P,N(g[P],P));let{frame:_}=l.get(P);_.nextElementSibling!==L&&i.insertBefore(_,L),L=_}e.navigate(w>0,w+1<g.length)}function Y(S=w,R="instant"){i.scrollTo({top:Math.max(0,S)*i.clientHeight,behavior:R})}function z(S){if(!g[S]||w===S)return;let R=p();if(m(R),R&&M==="auto"&&!R.stalled&&R.video.currentTime>3&&++F>=3){let _=i.ownerDocument.defaultView,Q=Math.max(720,_.innerHeight*_.devicePixelRatio);H=Math.min(no.find(ne=>ne>H)||H,Q),F=0}w=S,k=void 0,R&&(R.frame.classList.remove("is-active"),R.video.pause()),ue(),Math.abs(i.scrollTop-w*i.clientHeight)>i.clientHeight&&Y();let L=p(),P=L.video;L.frame.classList.add("is-active"),P.muted=$||E,P.volume=f,s.snap(P,b),e.actualSpeed(P.playbackRate),e.post(L.clip),e.downloading(B),e.playback(P,A()),e.loop(L.loop,P.duration),e.message(""),y(),t(L.clip,w),V(P)}function Tt(){let S=x();S?.paused?V(S):S?.pause()}function $t(S){let R=x();Number.isFinite(R?.duration)&&(R.currentTime=Math.max(0,Math.min(R.duration,S)),d())}return{clip:u,video:x,seekVersion:()=>j,index:()=>Math.max(0,w),update(S){g=S,w<0&&g.length?z(0):ue()},reset(){s.cancel(),w=-1;for(let[S,R]of l)D(S,R);c.clear(),g=[],a.style.height=r.style.height="0px",e.post(),e.loop(void 0,0),e.navigate(!1,!1),b=1,k=void 0,e.speed(b),e.actualSpeed(b),y(),Y(0)},jump:Y,onScroll(){i.clientHeight&&w>=0&&z(Math.round(i.scrollTop/i.clientHeight))},step(S){let R=w+S;g[R]&&(z(R),Y(R))},togglePlay:Tt,seek:$t,setQuality:C,scrub:S=>$t((x()?.currentTime||0)+S),setRate(S){let R=he(S);R===b&&k===void 0||(b=R,k=void 0,s.set(x(),b),e.speed(b))},previewRate(S){S===void 0&&k===void 0||(k=S===void 0?void 0:he(S),s.set(x(),I()))},rate:()=>b,isMuted:A,screenAudio(S){if(E===S)return;$=A(),E=S;let R=x();R&&(R.muted=$||E,d())},toggleMute(){let S=x();S&&(S.volume===0?S.volume=f=1:($=!A(),S.muted=$||E),d())},setVolume(S){let R=x();R&&(R.volume=f=S,$=!1,R.muted=E,d())},loop(S){let R=p(),L=R?.video;if(!(!Number.isFinite(L?.duration)||L.duration<=0)){if(S==="end"&&L.currentTime<(R.loop?.start??1/0)+.25){e.message("Choose an end at least 0.25 s after A.");return}m(R),S==="start"?R.loop={start:L.currentTime}:S==="clear"?R.loop=void 0:(R.loop={...R.loop,end:L.currentTime},L.currentTime=R.loop.start,v(R)),e.loop(R.loop,L.duration)}},move(S){let R=p(),L=R?.video,P=L?.currentTime,_=L&&!L.paused;s.cancel(),m(R),S(),Y(),L&&(s.snap(L,I()),P&&L.currentTime!==P&&(L.currentTime=P),_&&L.paused?V(L):_&&v(R)),n(L)},async download(){let S=u();if(!(!S||B)){B=!0,e.downloading(!0);try{let R=await fetch(h(S).url);if(!R.ok)throw new Error("Download failed");let L=e.host.ownerDocument.createElement("a"),P=URL.createObjectURL(await R.blob());L.href=P,L.download=`${S.user||"x"}-${S.tweetId}.mp4`,L.click(),setTimeout(()=>URL.revokeObjectURL(P),1e4)}catch{e.message("Couldn\u2019t download this video.")}finally{B=!1,e.downloading(!1,!!u())}}}}}function ro(e,t,n){let o=e?.data?.threaded_conversation_with_injections_v2?.instructions;if(!Array.isArray(o))return null;let i=new Map,a;function r(s){let u=s?.tweet_results?.result,p=u?.tweet||u,x=p?.legacy,h=p?.rest_id||x?.id_str,g=x?.in_reply_to_status_id_str;J(h)&&h!==t&&J(g)&&i.set(h,{tweet:p,parent:g})}for(let s of o){for(let u of s.entries||(s.entry?[s.entry]:[])){let p=u.content;p?.cursorType==="Bottom"&&typeof p.value=="string"&&(a=p.value),r(p?.itemContent);for(let{item:x}of p?.items||[])r(x?.itemContent)}for(let{item:u}of s.moduleItems||[])r(u?.itemContent)}function l({tweet:s,parent:u}){if(s.legacy.conversation_id_str===t)return!0;let p=new Set;for(;u&&!p.has(u);){if(u===t||n?.has(u))return!0;p.add(u),u=i.get(u)?.parent}return!1}let c=[];for(let[s,u]of i){if(!l(u))continue;let{tweet:p,parent:x}=u,h=p.legacy;c.push({id:s,nested:x!==t,...yt(p),text:tt(p.note_tweet?.note_tweet_results?.result?.text??h.full_text),date:typeof h.created_at=="string"?h.created_at:""})}return{replies:c,cursor:a}}function io({client:e,view:t,postActions:n,currentVideo:o,align:i}){let a=new Map,r=!1,l,c,s=G("auto-replies","false")==="true",u=s;function p(){let b=o();t.replies.autoScroll(s,!!(r&&s&&b&&!b.paused&&!b.seeking&&b.readyState>=3))}function x(b){b.loading?t.replies.replyStatus("Loading replies\u2026"):b.failed?t.replies.replyStatus("Couldn\u2019t load replies from X.","Try again"):!b.items.size&&!b.cursor?t.replies.replyStatus("No replies to show."):t.replies.replyStatus("",b.cursor?"Load more replies":"",!1,!!b.cursor)}function h(b){return a.has(b)||(a.size>=48&&a.delete(a.keys().next().value),a.set(b,{items:new Map,cursors:new Set})),a.get(b)}async function g(){let b=c;if(!r||!b)return;let k=h(b);if(k.loading||k.loaded&&!k.cursor)return;let $=k.cursor;k.loading=!0,x(k);let f=await e.detail(b,$),E=ro(f,b,k.items),A=nt(f,b);A&&n.merge(b,ze(A));let I=[];if(k.loading=!1,k.failed=!E,E){k.loaded=!0,$&&k.cursors.add($),k.cursor=k.cursors.has(E.cursor)?void 0:E.cursor;for(let H of E.replies)k.items.has(H.id)||(k.items.set(H.id,H),I.push(H))}r&&c===b&&a.get(b)===k&&(t.replies.appendReplies(I),x(k))}function w(){if(!r||!l)return;c=l;let b=h(l);t.replies.clearReplies(),t.replies.appendReplies([...b.items.values()]),b.loaded||b.loading||b.failed?x(b):g()}function M(b,k=!0){b&&!l||(r=b,t.toggleReplies(r,k),i(),r&&w(),p())}return{isOpen:()=>r,isAuto:()=>s,step(b){l&&(r||M(!0,!1),t.replies.step(b))},setOpen:M,more:g,syncScroll:p,setClip(b){l=b,b&&u?(u=!1,M(!0,!1)):b&&r&&b!==c?w():!b&&r&&M(!1,!1),p()},toggleAuto(){s=!s,K("auto-replies",s),s&&!r&&l&&M(!0,!1),p()},reset(){M(!1,!1),a=new Map,l=c=void 0,u=s,t.replies.clearReplies()}}}var so=336*60*60*1e3,ao=1600;function st(e){if(typeof e?.key!="string"||e.key.length>500)return[];let t=[e.key];if(typeof e.url!="string")return t;try{let n=new URL(e.url);if(n.origin!=="https://video.twimg.com")return t;let o=n.pathname.match(/^\/(ext_tw_video|amplify_video|tweet_video)\/([\w-]+)/);o?t.push(`media:${o[1]}:${o[2].replace(/\.mp4$/i,"")}`):t.push(`media:${n.pathname.replace(/\/\d+x\d+\//,"/")}`)}catch{}return t.filter(n=>n.length<=500)}function lo({load:e=i=>G(i,"[]"),save:t=K,now:n=Date.now,storage:o=globalThis.chrome?.storage}={}){let i=new Map,a=new Map,r=h=>`history:${h}`,l;function c(){let h=typeof document>"u"?"":document.cookie.match(/(?:^|;\s*)twid=u(?:%3D|=)(\d+)/i)?.[1];return h?`watched:${h}`:"watched"}function s(h){let g=n()-so;return Array.isArray(h)?h.filter(w=>Array.isArray(w)&&typeof w[0]=="string"&&w[0].length<=500&&Number.isFinite(w[1])&&w[1]>=g).slice(-ao):[]}function u(h){l!==h&&(l=h,o?.local?.get(r(h)).then(g=>{a.set(h,s(g[r(h)]))}).catch(()=>{}))}o?.onChanged?.addListener((h,g)=>{let w=l&&r(l);g==="local"&&w&&h[w]&&a.set(l,s(h[w].newValue))}),u(c());function p(h){try{return s(JSON.parse(e(h)))}catch{return[]}}function x(h){let g=n()-so,w=new Map;for(let[M,b]of[...p(h),...a.get(h)||[],...i.get(h)||[]])b>=g&&b>(w.get(M)||0)&&(w.delete(M),w.set(M,b));return w}return{snapshot(){let h=c();return u(h),new Set(x(h).keys())},mark(h){let g=st(h);if(!g.length)return;let w=c();u(w);let M=x(w);for(let k of g)M.delete(k),M.set(k,n());let b=[...M].slice(-ao);i.set(w,b),o?.local?.set({[r(w)]:b}).catch(()=>{});try{t(w,JSON.stringify(b))}catch{}}}}function Rt(e){let[,t,n,o]=e?.match(/^\/([\w]+)\/status\/(\d{1,25})(?:\/video\/(\d+))?(?:\/|$)/)||[];return n?{tweetId:n,user:t,index:o?Number(o)-1:void 0}:{}}function At(e){let t=W(e,"video.twimg.com")||W(e,"pbs.twimg.com");if(!t)return"";let{pathname:n}=new URL(t),o=n.match(/^\/(ext_tw_video|amplify_video|tweet_video)(?:_thumb)?\/([^/]+)/);return o?`${o[1]}:${o[2].replace(/\.[a-z]+\d*$/i,"")}`:n.replace(/\/\d+x\d+\//,"/")}function co(e,t){let n=[At(e.poster),At(e.source)].filter(Boolean);return[t.poster,t.url,...t.variants.map(o=>o.url)].some(o=>{let i=At(o);return i&&n.includes(i)})}function at(e,t){let n=[...t],o=n.filter(a=>a.tweetId===e.tweetId),i=e.poster||e.source;if(i){let a=o.find(r=>co(e,r))||n.find(r=>co(e,r));if(a)return a}return Number.isInteger(e.index)&&e.index>=0?o.find(a=>a.mediaIndex===e.index):i?void 0:o[0]}function uo(e){let t=W(e.source,"video.twimg.com");if(!(!J(e.tweetId)||!t||!/\.mp4$/i.test(new URL(t).pathname)))return{key:t,url:t,variants:[{url:t,label:"Original"}],tweetId:e.tweetId,user:e.user||"",poster:e.poster||""}}var qr=16,lt=180,Xr=1400,po=5,Wr=5,Qr=["TVHomeMixer","MediaTabVideoMixer"];function fo(e,t,n){return n?.command==="search"?[Ct("SearchTimeline")]:!t&&e==="/home"?Qr.map(Ct):[]}function je(e,t,n,o){e.delete(t),e.set(t,n),e.size>o&&e.delete(e.keys().next().value)}function Jr(e,t){if(t&&!e.seenCursors.has(t)){e.seenCursors.add(t),e.cursor=t;return}e.cursor=void 0,e.done=!0}function Ct(e){return{name:e,cursor:void 0,seenCursors:new Set,done:!1}}function mo({client:e,onClips:t,onPost:n,onStatus:o=()=>{},getContext:i=It,advanceTimeline:a=()=>window.scrollTo(0,document.documentElement.scrollHeight),history:r=lo(),random:l=Math.random,openSearch:c}){let s=new Map,u=new Map,p,x=-1/0;function h(f){let E=[...f];for(let A=E.length-1;A>0;A--){let I=Math.min(A,Math.floor(l()*(A+1)));[E[A],E[I]]=[E[I],E[A]]}return E}function g(f,E,A=!1){let I=0;for(let H of E){let F=st(H);if(!F.some(O=>f.keys.has(O)||!A&&f.seenBefore.has(O))){for(let O of F)f.keys.add(O);f.clips.push(H),I++}}return I}function w(f,E){if(!f.length)return;let A=s.get(E)||new Map;for(let I of f)je(A,I.key,I,lt),je(u,I.key,I,Xr),n(I.tweetId,I.stats);je(s,E,A,qr)}function M(f,E){return!f.awaitingSeed||!E?0:(f.awaitingSeed=!1,f.seed=E,g(f,[E],!0)+g(f,s.get(f.context)?.values()||[]))}function b(f,E=i(),A=p){if(w(f,E),!A||A!==p)return 0;let I=0;return A.awaitingSeed&&(I+=M(A,at(A.seed,f))),!A.awaitingSeed&&A.context===E&&(I+=g(A,A.mix?h(f):f)),I&&t(),I}function k(f,E){if(f.related&&!f.related.done)return f.related;let I=(f.awaitingSeed?[f.seed]:[f.seed,f.clips[E],f.clips.at(-1),...[...f.suggestions.values()].reverse(),...[...s.get(f.context)?.values()||[]].reverse()]).find(H=>H?.tweetId&&!f.usedAnchors.has(H.tweetId));if(I)return f.usedAnchors.add(I.tweetId),f.related={...Ct("ImmersiveMedia"),anchor:I},f.related}async function $(f,E,A,I){f.loading=!0,f.failed=!1;let H=f.clips.length;o({loading:!0});try{if(f.awaitingSeed&&f.seed.tweetId){let F=await e.detail(f.seed.tweetId);if(f!==p)return;if(f.awaitingSeed){let O=at(f.seed,kt(F));O&&b([O],f.context,f)}}!f.seed&&f.discovery?.command!=="search"&&i()===f.context&&(A||performance.now()-x>1e3)&&(x=performance.now(),a());for(let F=0;F<Wr&&f===p&&!(f.clips.length-E>=po&&!(I&&F===0));F++){let O=f.mixers.find(C=>!C.done);if(!O&&(f.seed||f.context==="/home")&&(O=k(f,E)),!O)break;let{name:B,cursor:j,anchor:V}=O,m=j?{cursor:j}:{};B==="SearchTimeline"&&Object.assign(m,{rawQuery:`${f.discovery.topic} filter:native_video`,querySource:"typed_query",product:"Top",count:20}),V&&Object.assign(m,{pinned_tweet_id:V.tweetId,page_name:V.user||"",includePromotedContent:!1});let v=B==="SearchTimeline"&&c;v&&!f.search&&(f.search=c(f.discovery.topic));let d=v?await f.search.page(j):await e.query(B,m);if(f!==p)return;if(B==="SearchTimeline"&&!d){f.failed=!0,O.done=!0,f.search?.close(),f.search=void 0;break}Jr(O,v?d.cursor:Qn(d)),v&&O.done&&(f.search.close(),f.search=void 0);let y=v?d.clips:kt(d);for(let C of y)je(f.suggestions,C.key,C,lt);b(y,f.context,f)}}finally{f.loading=!1,p===f&&(f.scannedAt=f.clips.length===H?E:-1,o({loading:!1,added:f.clips.length>H}))}}return{ingest:b,seedFor(f){let{tweetId:E,poster:A,source:I}=f;return!E&&!A&&!I?null:at(f,u.values())||uo(f)||f},start(f,E){p?.search?.close();let A=E?.command==="shuffle",H=E?.command==="search"?`search:remote:${E.topic}`:A?"/home":f?`immersive:${f.tweetId}`:i();p={context:H,seed:f,discovery:E,awaitingSeed:!!(f&&!f.url),mix:!f&&H==="/home",clips:[],keys:new Set,seenBefore:r.snapshot(),mixers:fo(H,f,E),suggestions:new Map,usedAnchors:new Set,related:void 0,scannedAt:-1},f?.url&&g(p,[f],!0);for(let O of u.values())if(p.seenBefore.has(O.key))for(let B of st(O))p.seenBefore.add(B);let F=s.get(H)?.values()||[];if(A){let O=[...u.values()].slice(-lt),B=new Map([...F,...O].map(j=>[j.key,j]));g(p,h(B.values()));for(let j of O)je(p.suggestions,j.key,j,lt)}else p.awaitingSeed||g(p,p.mix?h(F):F);return p},prime(){let f=p;if(!(!f||f.loading||!f.seed&&!f.discovery&&f.context!=="/home"))return $(f,0,!1,!0)},stop(){p?.search?.close(),p=void 0},mark:f=>r.mark(f),replenish(f,E=!1){let A=p;if(!(!A||A.loading||A.clips.length-f>=po||!E&&A.scannedAt>=f))return E&&A.mixers.every(I=>I.done)&&(!A.related||A.related.done)&&(A.search?.close(),A.search=void 0,A.mixers=fo(A.context,A.seed,A.discovery),A.usedAnchors.clear(),A.related=void 0),$(A,f,E)}}}var ho={compact:{width:360,landscape:370,portrait:475},balanced:{width:460,landscape:430,portrait:590},large:{width:620,landscape:560,portrait:725}},Ue=Object.keys(ho);function go({view:e,deck:t,handleKeys:n,isOpen:o,onMove:i}){let a="documentPictureInPicture"in window,r,l=!1,c=G("pip-size","balanced");Ue.includes(c)||(c="balanced");let s=G("video-fit","contain")==="fill"?"fill":"contain",u=Math.min(72,Math.max(24,Number(G("split","40"))||40));e.floating(!1,a),e.windowSettings(c,s,u);function p(k){let $=t.video(),f=ho[k];return{width:f.width,height:$?.videoWidth>$?.videoHeight?f.landscape:f.portrait}}function x(k,$){e.floating($,a),t.move(()=>k.body.append(e.host)),o()&&e.focus(),i()}function h(){t.jump(),e.placeMenu()}function g(k){if(!r||!Ue.includes(k))return;let{width:$,height:f}=p(k);try{let E=Math.max(0,r.outerWidth-r.innerWidth),A=Math.max(0,r.outerHeight-r.innerHeight);r.resizeTo($+E,f+A),c=k,K("pip-size",c),e.windowSettings(c,s)}catch{e.message("Drag an edge of the window to resize it.")}}async function w(){if(r){r.close();return}if(!(l||!a||e.shadow.fullscreenElement)){l=e.float.disabled=!0;try{let k=await window.documentPictureInPicture.requestWindow(p(c));if(!o()){k.close();return}r=k,k.document.title="XScroll",k.addEventListener("keydown",n,!0),k.addEventListener("resize",h),k.addEventListener("pagehide",()=>{r=void 0,x(document,!1)},{once:!0}),x(k.document,!0)}catch{o()&&e.message("The mini player couldn\u2019t open.")}finally{l=e.float.disabled=!1}}}async function M(){if(!r){e.dismissMenu();try{e.shadow.fullscreenElement?await document.exitFullscreen():await e.stage.requestFullscreen()}catch{o()&&e.message("Fullscreen isn\u2019t available.")}}}window.addEventListener("resize",()=>{o()&&!r&&h()}),document.addEventListener("fullscreenchange",()=>{o()&&(h(),e.full(!!e.shadow.fullscreenElement),e.focus())});function b(k){k!=="contain"&&k!=="fill"||(s=k,K("video-fit",k),e.windowSettings(c,s))}return{toggle:w,resize:g,fullscreen:M,active:()=>!!r,focus:()=>r?.focus(),closeMini:()=>r?.close(),resizeNext:()=>g(Ue[(Ue.indexOf(c)+1)%Ue.length]),fit:b,toggleFit:()=>b(s==="fill"?"contain":"fill"),split(k,$){h(),$&&K("split",k)}}}var Gr=new Set(["ArrowUp","ArrowDown","Home","End","PageUp","PageDown"," "]),Kr=new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","j","k"]),Yr='button, input, a[href], [tabindex="0"]';function wo(e,{view:t,commands:n,floating:o}){if(o&&e.currentTarget===window||e.metaKey||e.ctrlKey||e.altKey)return;let i=e.composedPath()[0];if(e.key==="Escape"&&t.dismissMenu(!0)){e.preventDefault(),e.stopImmediatePropagation();return}let a=t.menuFocusables();if(e.key==="Tab"&&(a||!o&&!t.shadow.fullscreenElement)){let l=a||[...t.shadow.querySelectorAll(Yr)].filter(s=>!s.disabled&&s.checkVisibility({visibilityProperty:!0})),c=e.shiftKey?l[0]:l.at(-1);(!l.includes(i)||i===c)&&(e.preventDefault(),(e.shiftKey?l.at(-1):l[0])?.focus());return}if(e.key!=="Escape"&&i.closest?.(".flyout")||Gr.has(e.key)&&i.closest?.(".thread-scroll, .split")||e.key!=="Escape"&&(i.matches?.("input, textarea, [contenteditable]")||e.key===" "&&i.matches?.("button, a")))return;let r=e.key.length===1?e.key.toLowerCase():e.key;Object.hasOwn(n,r)&&(e.preventDefault(),e.stopImmediatePropagation(),(!e.repeat||Kr.has(r))&&n[r](e))}var Zr=/\/(?:main|runtime|entry-client-[\w-]+|bundle\.(?:ImmersiveMediaViewer|Conversation|TweetDetail|Bookmarks|TweetAction|Search(?:Timeline)?))\.[\w.-]+\.js$/,ei=/(\d+):"(bundle\.(?:ImmersiveMediaViewer|Conversation|TweetDetail|Bookmarks|TweetAction|Search(?:Timeline)?))"/g,ti=/queryId\s*:\s*"([\w-]+)"\s*,\s*operationName\s*:\s*"(\w+)"\s*,\s*operationType\s*:\s*"(query|mutation)"(?:\s*,\s*metadata\s*:\s*\{\s*featureSwitches\s*:\s*(\[[^\]]*\])\s*,\s*fieldToggles\s*:\s*(\[[^\]]*\]))?/g;function xo(e){try{let t=new URL(e);return(t.origin===ge||t.origin==="https://abs.twimg.com")&&(Zr.test(t.pathname)||/\/x-web\/[\w/-]*entry-client-[\w-]+\.js$/.test(t.pathname))}catch{return!1}}function bo(e,t){try{return JSON.stringify(Object.fromEntries(JSON.parse(e).filter(n=>typeof n=="string").map(n=>[n,t])))}catch{return"{}"}}function ni(e){let t=new Map,n;for(let o of e){n||=o.match(/"(Bearer [A-Za-z0-9%._-]+)"/)?.[1];for(let[,i,a,r,l,c]of o.matchAll(ti))(r==="query"?We:Qe).has(a)&&t.set(a,{id:i,features:bo(l,!0),toggles:bo(c,!1)})}return{bearer:n,operations:t}}var vo=e=>fetch(e,{signal:AbortSignal.timeout(8e3)}).then(t=>t.ok?t.text():"").catch(()=>"");async function oi(){let e=[...document.scripts],t=new Set(e.map(i=>i.src).filter(xo));for(let i of performance.getEntriesByType("resource"))xo(i.name)&&t.add(i.name);let n=await Promise.all([...t].slice(0,16).map(vo)),o=new Set;for(let i of[...e.filter(a=>!a.src).map(a=>a.textContent),...n])for(let[,a,r]of i.matchAll(ei)){let l=i.match(new RegExp(`[{,]${a}:"([a-f0-9]{8,20})"`))?.[1];l&&o.add(`https://abs.twimg.com/responsive-web/client-web/${r}.${l}a.js`)}return n.push(...await Promise.all([...o].filter(i=>!t.has(i)).slice(0,8).map(vo))),ni(n)}var ce=class extends Error{constructor(t,n){super(n),this.code=t}};function yo(){let e=new Map,t=new Map,n;async function o(i,a,r){if(!(r==="POST"?Qe:We).has(i))throw new ce("unavailable","Action unavailable in this version of X.");let c=document.cookie.match(/(?:^|;\s*)ct0=([^;]+)/)?.[1];if(!c)throw new ce("session","Sign in to X to continue.");n||=oi().catch(()=>null);let s=await n;s?.bearer||(n=void 0);let u=e.get(i)||s?.operations.get(i);if(!u||!s?.bearer)throw new ce("unavailable","This action is temporarily unavailable.");let p=new URL(`/i/api/graphql/${u.id}/${i}`,ge),x={authorization:s.bearer,"x-csrf-token":c,"x-twitter-auth-type":"OAuth2Session","x-twitter-active-user":"yes"},h={method:r,headers:x,credentials:"same-origin",signal:AbortSignal.timeout(1e4)};r==="POST"?(x["content-type"]="application/json",h.body=JSON.stringify({queryId:u.id,variables:a})):(p.searchParams.set("variables",JSON.stringify(a)),u.features&&p.searchParams.set("features",u.features),u.toggles&&p.searchParams.set("fieldToggles",u.toggles));let g=await fetch(p,h);if(g.status===429)throw new ce("limited","X is rate limiting requests. Try again in a moment.");if(!g.ok){let M=[400,401,403,404].includes(g.status)?"unavailable":"server";throw new ce(M,"X could not complete this request.")}let w=await g.json();if(r==="POST"){let M=w?.data&&Object.values(w.data).some(Boolean);if(!M||w.errors?.length){let b=!M&&w.errors?.length?"unavailable":"server";throw new ce(b,"X did not confirm this action.")}}else if(!w?.data)throw new ce("server","X did not return a result for this request.");return w}return{remember({name:i,id:a,features:r,toggles:l}){!We.has(i)&&!Qe.has(i)||!/^[\w-]{1,80}$/.test(a||"")||e.set(i,{id:a,features:typeof r=="string"&&r.length<18e3?r:"{}",toggles:typeof l=="string"&&l.length<8e3?l:"{}"})},async query(i,a){return o(i,a,"GET").catch(()=>{})},detail(i,a){if(!J(i))return Promise.resolve(void 0);let r=JSON.stringify([i,a||""]);return t.has(r)||t.set(r,o("TweetDetail",{focalTweetId:i,...a&&{cursor:a},includePromotedContent:!1,with_rux_injections:!1,withCommunity:!0,withQuickPromoteEligibilityTweetFields:!1,withBirdwatchNotes:!1,withVoice:!0,rankingMode:"Relevance"},"GET").catch(()=>{}).finally(()=>t.delete(r))),t.get(r)},mutate(i,a){return o(i,a,"POST")}}}var Et={like:{on:"FavoriteTweet",off:"UnfavoriteTweet",native:["like","unlike"]},repost:{on:"CreateRetweet",off:"DeleteRetweet",native:["retweet","unretweet"]},bookmark:{on:"CreateBookmark",off:"DeleteBookmark",native:["bookmark","removeBookmark"]}};function ko(e,t,n){if(!Object.hasOwn(Et,e)||!J(n))return null;let o=Et[e][t?"on":"off"];return{name:o,variables:o==="DeleteRetweet"?{source_tweet_id:n}:o==="CreateRetweet"?{tweet_id:n,dark_request:!1}:{tweet_id:n}}}function Mt(e){for(let t of document.querySelectorAll("article"))if(t.querySelector('a[href*="/status/"] time')?.closest("a")?.pathname?.match(/\/status\/(\d+)/)?.[1]===e)return t;return null}function Ve(e,t,n){return e?.querySelector(`[data-testid="${Et[t].native[Number(n)]}"]`)}function So(e,t){return new Promise(n=>{let o=e();if(o){n(o);return}let i=new MutationObserver(()=>{let l=e();l&&r(l)}),a;function r(l){clearTimeout(a),i.disconnect(),n(l)}i.observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["data-testid"]}),a=setTimeout(()=>r(null),t)})}async function ri(e,t,n){let o=Mt(e);if(!o)return!1;if(Ve(o,t,n))return!0;let i=Ve(o,t,!n);if(!i)return!1;if(i.click(),t==="repost"){let a=n?"retweetConfirm":"unretweetConfirm",r=await So(()=>document.querySelector(`[data-testid="${a}"]`),1300);if(!r)return!1;r.click()}return!!await So(()=>Ve(Mt(e),t,n),2500)}function Ao(e,t){let n=new Map;function o(a){if(!n.has(a)){if(n.size>=1200){for(let[r,l]of n)if(!l.pending.size){n.delete(r);break}}n.set(a,{stats:{},pending:new Set,confirmed:new Set})}return n.get(a)}function i(a,r,l=!1){if(!J(a)||!r)return;let c=o(a),s=!1;for(let[u,p]of Object.entries(r)){let x=u.endsWith("Count")?u.slice(0,-5):u;p===void 0||c.confirmed.has(x)||(l||c.stats[u]===void 0)&&c.stats[u]!==p&&(c.stats[u]=p,s=!0)}s&&t(a)}return{merge:i,read(a){return J(a)?o(a):null},async toggle(a,r,l){if(!ko(r,!0,a))return;let c=o(a);if(!c.pending.has(r)){c.pending.add(r),t(a);try{if(c.stats[r]===void 0){let h=Mt(a);if(Ve(h,r,!0))c.stats[r]=!0;else if(Ve(h,r,!1))c.stats[r]=!1;else{let g=nt(await e.detail(a),a);g&&i(a,ze(g),!0)}}let s=l??!c.stats[r];if(c.stats[r]===s)return s;let{name:u,variables:p}=ko(r,s,a);try{await e.mutate(u,p)}catch(h){if(h.code!=="unavailable"||!await ri(a,r,s))throw h}c.stats[r]=s;let x=`${r}Count`;return Number.isFinite(c.stats[x])&&(c.stats[x]=Math.max(0,c.stats[x]+(s?1:-1))),c.confirmed.add(r),s}finally{c.pending.delete(r),t(a)}}}}}var ii=`
  html:has(#xscroll-player:not([hidden])) { scrollbar-width: none; }
  #xscroll-launcher, .xscroll-on-video {
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    border: 1px solid #404040;
    background: #1a1a1a;
    color: #f7f7f7;
    font: 650 13px/1 system-ui, sans-serif;
    cursor: pointer;
    transition: background-color 150ms ease, border-color 150ms ease;
  }
  #xscroll-launcher {
    position: fixed;
    top: 14px;
    right: 16px;
    z-index: 2147483645;
    height: 42px;
    padding: 0 12px 0 7px;
    border-radius: 12px;
    box-shadow: 0 4px 14px #0f0f0f2c;
  }
  #xscroll-launcher .launcher-icon { width: 27px; height: 27px; }
  #xscroll-launcher .launcher-name { width: 68px; height: 18px; object-fit: contain; }
  #xscroll-launcher:hover, .xscroll-on-video:hover { background: #292929; border-color: #aeaeae; }
  #xscroll-launcher:focus-visible, .xscroll-on-video:focus-visible { outline: 2px solid #b2b2b2; outline-offset: 3px; }
  .xscroll-on-video { position: absolute; z-index: 5; top: 8px; right: 8px; padding: 2px; width: 34px; height: 34px; border-radius: 8px; }
  .xscroll-on-video img { width: 28px; height: 28px; }
  @media (max-width: 1090px) { #xscroll-launcher { width: 40px; padding: 0; } #xscroll-launcher .launcher-name { display: none; } }
  @media (prefers-reduced-motion: reduce) { #xscroll-launcher, .xscroll-on-video { transition: none; } }
  @media (max-width: 650px) { #xscroll-launcher { top: 8px; right: 8px; } }
`;function Ro(e,t=!1){let n=document.createElement("button");n.type="button",n.title=e,n.setAttribute("aria-label",e);let o=document.createElement("img");if(o.src=rt,o.className="launcher-icon",o.alt="",n.append(o),t){let i=document.createElement("img");i.className="launcher-name",i.src=it,i.alt="",n.append(i)}return n}function ct(e){return e.seedFor(Rt(location.pathname))}function Co(e,t){let n=document.createElement("style");n.textContent=ii;let o=Ro("Open XScroll",!0);o.id="xscroll-launcher",o.addEventListener("click",()=>t(ct(e),o)),document.body.append(n,o);let i='[data-testid="videoComponent"]';function a(c){if(c.querySelector(":scope > .xscroll-on-video"))return;let s=Ro("Play this video in XScroll");s.className="xscroll-on-video",s.addEventListener("click",u=>{u.preventDefault(),u.stopPropagation();let p=c.querySelector("video"),x=c.closest('[data-testid="quoteTweet"]'),h=x||c.closest("article"),g=c.closest('a[href*="/status/"]')?.pathname||h?.querySelector('a[href*="/status/"] time')?.closest("a")?.pathname||x&&h?.querySelector('a[href*="/status/"]')?.pathname,w=Rt(g||location.pathname),M=W(p?.poster,"pbs.twimg.com"),b=W(p?.currentSrc,"video.twimg.com")||W(p?.src,"video.twimg.com"),k=e.seedFor({...w,poster:M,source:b});k&&t(k,s)}),c.append(s)}for(let c of document.querySelectorAll(i))a(c);let r=new Set,l;return new MutationObserver(c=>{for(let s of c)for(let u of s.addedNodes)if(!(u.nodeType!==Node.ELEMENT_NODE||u.classList.contains("xscroll-on-video")))if(u.matches(i))r.add(u);else for(let p of u.querySelectorAll(i))r.add(p);r.size&&!l&&(l=requestAnimationFrame(()=>{l=void 0;for(let s of r)s.isConnected&&a(s);r.clear()}))}).observe(document.body,{childList:!0,subtree:!0}),o}function Eo(e,t,n,o){let i,a=!1,r=-1/0,l=(s,u)=>chrome.runtime.sendMessage({channel:"xscroll.remote.poll",type:s,state:u}).catch(()=>({disabled:!0}));async function c(s){s.owner=void 0;let u=await l("poll",t());if(i!==s)return;if(a=u?.screenConnected===!0,o(a,u?.screenAudio===!0),!u||u.disabled){i=void 0;return}for(let x of u.commands||[]){let h=_t(x);h&&n(h)}let p=e.ownerDocument.defaultView;s.owner=p,s.timer=p.setTimeout(()=>c(s),u.offline?2500:80)}return{start(){i||(i={},c(i))},sync(){let s=performance.now();!i||!a||i.owner||s-r<145||(r=s,l("wake"))},stop(){a=!1,o(!1,!1),i&&(i.owner?.clearTimeout(i.timer),i=void 0,l("stop"))},rebind(){if(!i||!i.owner)return;i.owner.clearTimeout(i.timer);let s={};i=s,c(s)}}}var dt=yo(),Mo=matchMedia("(prefers-color-scheme: dark)"),$o=new Set(["system","light","dark"]),Se=G("theme","dark");$o.has(Se)||(Se="system");var de,Ie=Ao(dt,e=>de?.redrawActions(e)),te=mo({client:dt,openSearch:Ot,onClips:()=>de?.refresh(),onPost:Ie.merge,onStatus:e=>de?.feedStatus(e)});window.addEventListener("message",e=>{let t=e.data;ut||e.source!==window||e.origin!==ge||t?.channel!==Xe||typeof t.context!="string"||t.context.length>1e3||!/^(?:\/|search:)/.test(t.context)||(dt.remember(t),te.ingest(Wn(t.clips),t.context))});function To(){let e,t,n,o,i=new Map,a=!1,r=!1,l=!1,c=eo({play:()=>s.togglePlay(),volume:()=>s.toggleMute(),setVolume:d=>s.setVolume(d),seek:d=>s.seek(d),scrub:d=>s.scrub(d),scroll:()=>s.onScroll(),up:()=>s.step(-1),down:()=>s.step(1),quality:d=>s.setQuality(d),download:()=>s.download(),speed:d=>s.setRate(d),speedPreview:d=>s.previewRate(d),"loop-start":()=>s.loop("start"),"loop-end":()=>s.loop("end"),"loop-clear":()=>s.loop("clear"),theme:A,float:()=>p.toggle(),fullscreen:()=>p.fullscreen(),resize:d=>p.resize(d),fit:d=>p.fit(d),framing:()=>p.toggleFit(),split:(d,y)=>p.split(d,y),replies:()=>u.setOpen(!u.isOpen()),"hide-replies":()=>u.setOpen(!1),more:()=>u.more(),auto:()=>u.toggleAuto(),like:()=>F("like"),repost:()=>F("repost"),bookmark:()=>F("bookmark"),share:B,retry:()=>te.replenish(s.index(),!0),close:v}),s=oo(c,{onSlide(d){k.sync(),b(r,l),te.mark(d),H(d.tweetId),u.setClip(d.tweetId),te.replenish(s.index())},onPlayback:()=>u.syncScroll(),onSync:()=>k.sync()}),u=io({client:dt,view:c,postActions:Ie,currentVideo:s.video,align:()=>s.jump()}),p=go({view:c,deck:s,handleKeys:I,isOpen:()=>a,onMove:()=>{u.syncScroll(),k.rebind()}}),x={previous:()=>s.step(-1),next:()=>s.step(1),"toggle-play":()=>s.togglePlay(),"toggle-mute":()=>s.toggleMute(),rewind:()=>s.scrub(-5),forward:()=>s.scrub(5),slower:()=>s.setRate(s.rate()-.1),faster:()=>s.setRate(s.rate()+.1),"reset-speed":()=>s.setRate(1),replies:()=>u.setOpen(!u.isOpen(),!1),"replies-auto":()=>u.toggleAuto(),"replies-up":()=>u.step(-1),"replies-down":()=>u.step(1)};function h(){o&&o.owner.clearTimeout(o.id),o=void 0}function g(d){if(h(),s.previewRate(d??void 0),d===null)return;let y=c.host.ownerDocument.defaultView;o={owner:y,id:y.setTimeout(()=>g(null),3500)}}function w(){return s.clip()?.screenRestricted?"":pt(s.video()?.src)}function M(d,y){let C=d.variants.find(N=>pt(N.url)===y),T=Number.parseInt(C?.label,10)||720;return d.variants.find(N=>{let D=Number.parseInt(N.label,10);return D>0&&D<=480&&D<T})?.url}function b(d,y){r=d,l=y,s.screenAudio(y&&!!w())}let k=Eo(c.host,()=>{let d=s.video(),y=r?w():"",C=s.clip(),T=Ie.read(C?.tweetId);return{ready:a,playable:!!d,paused:d?.paused,muted:s.isMuted(),volume:d?.volume,rate:d?.playbackRate??s.rate(),rateTarget:s.rate(),replies:u.isOpen(),autoReplies:u.isAuto(),discovery:V(),post:T?{id:C.tweetId,author:C.user,...T.stats,pending:[...T.pending]}:null,postResults:[...i.values()],media:y?{url:y,fallback:M(C,y),key:`${C.tweetId}:${C.mediaIndex??0}`,jump:s.seekVersion(),time:d.currentTime,duration:d.duration,fit:c.host.dataset.fit,text:C.text,author:C.user,name:C.name,avatar:C.avatar,stalled:d.readyState<3||d.seeking}:r&&d?{unavailable:!0}:null}},d=>{a&&(typeof d=="string"?x[d]?.():d.command==="speed"?(h(),s.setRate(d.rate)):d.command==="speed-preview"?g(d.rate):d.command==="post-action"?O(d):m(void 0,void 0,d))},b);document.body.append(c.host),t=Co(te,m),E(),Mo.addEventListener("change",E);let $={ArrowUp:()=>s.step(-1),ArrowDown:()=>s.step(1),ArrowLeft:d=>d.shiftKey?s.setRate(s.rate()-.25):s.scrub(-5),ArrowRight:d=>d.shiftKey?s.setRate(s.rate()+.25):s.scrub(5),j:()=>s.step(1),k:()=>s.step(-1),0:()=>s.setRate(1)," ":()=>s.togglePlay(),m:()=>s.toggleMute(),f:()=>p.fullscreen(),p:()=>p.toggle(),z:()=>p.resizeNext(),v:()=>p.toggleFit(),r:()=>u.setOpen(!u.isOpen(),!1),a:()=>u.toggleAuto(),t:()=>A(f()==="light"?"dark":"light"),"?":c.help,Escape:()=>{u.isOpen()?u.setOpen(!1):p.active()?p.closeMini():v()}};window.addEventListener("keydown",I,!0),document.addEventListener("play",d=>{a&&!p.active()&&d.target instanceof HTMLMediaElement&&!d.composedPath().includes(c.host)&&d.target.pause()},!0);function f(){return Se==="system"?Mo.matches?"dark":"light":Se}function E(){c.appearance(Se,f())}function A(d){$o.has(d)&&(Se=d,K("theme",Se),E())}function I(d){a&&wo(d,{view:c,commands:$,floating:p.active()})}function H(d){a&&s.clip()?.tweetId===d&&c.engagement(Ie.read(d))}async function F(d){let y=s.clip()?.tweetId;if(y)try{await Ie.toggle(y,d)}catch(C){a&&s.clip()?.tweetId===y&&c.message(C.code==="session"?"Sign in to X to use post actions.":C.code==="limited"?C.message:"X couldn\u2019t confirm this action. Open the post to try there.")}}async function O({id:d,postId:y,kind:C,enabled:T}){let N="";if(s.clip()?.tweetId!==y)N="changed";else try{await Ie.toggle(y,C,T)===void 0&&(N="busy")}catch(D){N=D.code==="session"?"session":"failed"}i.set(d,{id:d,postId:y,kind:C,ok:!N,error:N}),i.size>8&&i.delete(i.keys().next().value)}async function B(){let d=s.clip()?.tweetId;if(d)try{await navigator.clipboard.writeText(ke(d)),c.message("Post link copied.")}catch{window.open(ke(d),"_blank","noopener")}}function j(){a&&(s.update(e.clips),te.replenish(s.index()))}function V(){let d=e?.discovery;if(!d)return null;let y=e.clips.length?"ready":e.loading||e.scannedAt<0?"loading":e.failed?"error":"empty";return{...d,phase:y}}function m(d,y,C){if(a&&!d&&!C){p.active()?p.focus():c.focus();return}h(),c.dismissMenu(),u.reset(),C||(n=y||t),e=te.start(d,C),a=!0,c.host.hidden=!1,s.reset(),c.empty(C?.command==="search"?`Searching X for \u201C${C.topic}\u201D\u2026`:e.awaitingSeed?"Loading the selected video\u2026":"Looking for unseen videos\u2026"),c.message(""),document.querySelectorAll("video").forEach(T=>T.pause()),j(),te.prime(),k.start(),!C&&(p.active()?p.focus():c.focus())}function v(){a&&(a=!1,k.stop(),h(),c.dismissMenu(),u.reset(),te.stop(),c.host.hidden=!0,s.reset(),c.shadow.fullscreenElement&&document.exitFullscreen().catch(()=>{}),p.active()&&p.closeMini(),n?.focus({preventScroll:!0}))}return{refresh:j,redrawActions:H,feedStatus({loading:d}){if(!(!a||s.clip()))if(e?.discovery?.command==="search"){let y=e.discovery.topic,C=d?`Searching X for \u201C${y}\u201D\u2026`:e.failed?"X couldn\u2019t load this search. Try again in a moment.":`No new videos for \u201C${y}\u201D.`;c.empty(C,d?"":"Retry")}else e?.awaitingSeed?c.empty(d?"Loading the selected video\u2026":"Couldn\u2019t load the selected video.",d?"":"Retry"):c.empty(d?"Looking for unseen videos\u2026":"You\u2019re caught up for now.",d?"":"Find more")},state:()=>({site:!0,open:a,floating:p.active(),theme:f(),post:!!ct(te)}),open:()=>m(ct(te),t),startRemote(){a&&k.start()}}}ut?Pt():document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>{de=To()},{once:!0}):de=To();chrome.runtime.onMessage.addListener((e,t,n)=>{if(!(t.id!==chrome.runtime.id||!e)){if(e.channel==="xscroll.remote"&&e.type==="start"){de?.startRemote(),n({ok:!0});return}e.channel==="xscroll.popup"&&(e.type==="state"?n(de?.state()||{site:!0,ready:!1}):e.type==="open"&&de&&(de.open(),n({opened:!0})))}});})();
