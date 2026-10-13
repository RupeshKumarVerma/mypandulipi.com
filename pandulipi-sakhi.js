/* Pandulipi Sakhi: embeddable storefront assistant.
   Install with <script src="/pandulipi-sakhi.js" defer></script>
   Provide window.PANDULIPI_CATALOG = [{name,price,offerPrice,description,url}] before loading.
   Optional secure AI endpoint: window.PANDULIPI_SAKHI_API = "/api/sakhi/chat".
   Do not place API keys in browser code. */
(()=>{"use strict";
if(document.getElementById("pandulipi-sakhi-root"))return;
const phone="918982659046",catalog=Array.isArray(window.PANDULIPI_CATALOG)?window.PANDULIPI_CATALOG:[];
const root=document.createElement("div");root.id="pandulipi-sakhi-root";document.body.appendChild(root);
const css=document.createElement("style");css.textContent=`
#pandulipi-sakhi-root{font:14px/1.5 system-ui,sans-serif;color:#603e2b}
#ps-launch{position:fixed;bottom:24px;right:24px;z-index:99999;background:#70452f;color:white;border:0;border-radius:40px;padding:14px 18px;cursor:pointer;box-shadow:0 6px 25px #0003}
#ps-panel{position:fixed;bottom:82px;right:24px;width:min(360px,calc(100vw - 32px));height:min(520px,calc(100dvh - 112px));background:#fffaf2;border:1px solid #dfc9ac;border-radius:18px;box-shadow:0 14px 40px #0003;z-index:99999;display:none;overflow:hidden;flex-direction:column}
#ps-panel.open{display:flex}#ps-head{background:#70452f;color:#fff;padding:15px;display:flex;justify-content:space-between;align-items:center;font-weight:700}#ps-close{border:0;background:transparent;color:white;font-size:23px;cursor:pointer}
#ps-messages{padding:14px;flex:1;overflow:auto;display:flex;flex-direction:column;gap:9px} .ps-bubble{padding:10px 12px;border-radius:12px;max-width:88%;white-space:pre-wrap;overflow-wrap:anywhere}.ps-bot{background:#efe3d0;align-self:flex-start}.ps-user{background:#70452f;color:#fff;align-self:flex-end}
#ps-quick{display:flex;gap:6px;flex-wrap:wrap;padding:8px 12px}#ps-quick button{background:white;border:1px solid #b99571;border-radius:18px;color:#70452f;padding:6px 10px;cursor:pointer}
#ps-form{display:flex;border-top:1px solid #dfc9ac;padding:10px;gap:6px}#ps-input{flex:1;min-width:0;border:1px solid #cbb39a;border-radius:20px;padding:10px}#ps-send{border:0;border-radius:20px;background:#70452f;color:white;padding:8px 13px;cursor:pointer}
`;document.head.appendChild(css);
root.innerHTML='<button id="ps-launch" aria-label="Open Pandulipi Sakhi">🌸 Ask Sakhi</button><section id="ps-panel" role="dialog" aria-label="Pandulipi Sakhi"><div id="ps-head">🌸 पांडुलिपि सखी <button id="ps-close" aria-label="Close">×</button></div><div id="ps-messages" aria-live="polite"></div><div id="ps-quick"></div><form id="ps-form"><input id="ps-input" aria-label="Message" placeholder="Ask Sakhi anything..." required maxlength="500"/><button id="ps-send">Send</button></form></section>';
const $=id=>root.querySelector("#"+id),history=[];let selected=null;
const add=(msg,who="bot")=>{const d=document.createElement("div");d.className="ps-bubble ps-"+who;d.textContent=msg;$("ps-messages").appendChild(d);$("ps-messages").scrollTop=$("ps-messages").scrollHeight;history.push({role:who==="bot"?"assistant":"user",content:msg});};
const whatsapp=(message)=>"https://wa.me/"+phone+"?text="+encodeURIComponent(message);
const quick=()=>{const q=$("ps-quick");q.replaceChildren();["Explore products","Check prices","Bulk order","WhatsApp"].forEach(t=>{const b=document.createElement("button");b.textContent=t;b.onclick=()=>send(t);q.appendChild(b);});};
const money=x=>typeof x==="number"?"₹"+x.toLocaleString("en-IN"):String(x??"Price on request");
function localReply(s){const q=s.toLowerCase();
if(/whatsapp|contact|human|call|order now/.test(q))return "You can contact our team here: "+whatsapp("Radhe Radhe! I need help with MyPandulipi products.");
if(/bulk|wholesale|50|100|quantity|copies|gift/.test(q))return "Radhe Radhe! 🙏 Which Pandulipi would you like, and how many copies? For a bulk quotation, message us: "+whatsapp("Radhe Radhe! Please share bulk pricing for my Pandulipi order.");
const match=catalog.find(p=>String(p.name||"").toLowerCase().split(/\s+/).some(w=>w.length>3&&q.includes(w)));
if(match){selected=match;return match.name+"\nRegular price: "+money(match.price)+"\nOffer price: "+money(match.offerPrice??match.price)+(match.description?"\n"+match.description:"")+(match.url?"\n"+match.url:"")+"\nWould you like one copy or a bulk order?";}
if(/product|catalog|price|chalisa|sundarkand|aarti|pandulipi/.test(q)){if(!catalog.length)return "Radhe Radhe! 🙏 I can help with our Pandulipis. For confirmed current prices, please contact our team: "+whatsapp("Radhe Radhe! Please share the latest product catalogue and prices.");return "Our catalogue includes: "+catalog.slice(0,12).map(p=>p.name).join(", ")+". Which title interests you?";}
if(/hi|hello|radhe|namaste|namaskar/.test(q))return "राधे राधे! 🙏 Welcome to MyPandulipi. Are you shopping for yourself or looking for a devotional gift?";
return "Radhe Radhe! 🙏 I can help with Pandulipi products, pricing, gifting and bulk orders. Which product are you looking for?";
}
async function send(raw){const s=String(raw||"").trim();if(!s)return;add(s,"user");$("ps-input").value="";const api=window.PANDULIPI_SAKHI_API; if(api){try{const res=await fetch(api,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:s,history:history.slice(-12),catalog})});if(!res.ok)throw Error("Service unavailable");const data=await res.json();if(typeof data.reply!=="string")throw Error("Invalid reply");add(data.reply);return;}catch(e){/* Graceful fallback */}}add(localReply(s));}
$("ps-launch").onclick=()=>{$("ps-panel").classList.toggle("open");if($("ps-panel").classList.contains("open"))$("ps-input").focus();};$("ps-close").onclick=()=>$("ps-panel").classList.remove("open");$("ps-form").onsubmit=e=>{e.preventDefault();send($("ps-input").value);};add("राधे राधे! 🙏 Welcome to MyPandulipi. I'm Sakhi, your devotional shopping companion. How may I help you today?");quick();
})();