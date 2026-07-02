"use strict";var CxSupportWidget=(()=>{var g=Object.defineProperty;var m=Object.getOwnPropertyDescriptor;var f=Object.getOwnPropertyNames;var y=Object.prototype.hasOwnProperty;var v=(i,e,t,s)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of f(e))!y.call(i,n)&&n!==t&&g(i,n,{get:()=>e[n],enumerable:!(s=m(e,n))||s.enumerable});return i};var w=i=>v(g({},"__esModule",{value:!0}),i);var E={},d=class{config;sessionId=null;root=null;messagesEl=null;open=!1;constructor(e){this.config=e,this.sessionId=localStorage.getItem("cx_session_id"),this.render()}render(){let e=document.createElement("div");e.id="cx-support-widget",e.innerHTML=`
      <style>
        #cx-support-widget { position: fixed; right: 20px; bottom: 20px; z-index: 99999; font-family: Inter, system-ui, sans-serif; }
        #cx-support-widget .launcher { width: 56px; height: 56px; border-radius: 999px; border: none; background: #6366f1; color: white; cursor: pointer; box-shadow: 0 10px 30px rgba(99,102,241,.45); }
        #cx-support-widget .panel { display: none; width: 360px; max-height: 520px; background: #0f172a; color: #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,.35); border: 1px solid rgba(148,163,184,.2); margin-bottom: 12px; }
        #cx-support-widget .panel.open { display: flex; flex-direction: column; }
        #cx-support-widget .header { padding: 14px 16px; background: #111827; font-weight: 600; }
        #cx-support-widget .messages { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 10px; min-height: 280px; }
        #cx-support-widget .bubble { max-width: 85%; padding: 10px 12px; border-radius: 14px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; }
        #cx-support-widget .bubble.user { align-self: flex-end; background: #6366f1; }
        #cx-support-widget .bubble.bot { align-self: flex-start; background: rgba(255,255,255,.08); }
        #cx-support-widget .composer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(148,163,184,.15); }
        #cx-support-widget input { flex: 1; border-radius: 10px; border: 1px solid rgba(148,163,184,.25); background: rgba(15,23,42,.8); color: white; padding: 10px 12px; }
        #cx-support-widget button.send { border: none; border-radius: 10px; background: #6366f1; color: white; padding: 0 14px; cursor: pointer; }
        #cx-support-widget .typing { font-size: 12px; color: #94a3b8; padding: 0 12px 8px; }
      </style>
      <div class="panel" id="cx-panel">
        <div class="header">Support Assistant</div>
        <div class="messages" id="cx-messages"></div>
        <div class="typing" id="cx-typing" hidden>Assistant is typing...</div>
        <div class="composer">
          <input id="cx-input" placeholder="Ask about billing, shipping, orders..." />
          <button class="send" id="cx-send">Send</button>
        </div>
      </div>
      <button class="launcher" id="cx-launcher">\u{1F4AC}</button>
    `,document.body.appendChild(e),this.root=e,this.messagesEl=e.querySelector("#cx-messages"),e.querySelector("#cx-launcher")?.addEventListener("click",()=>this.toggle()),e.querySelector("#cx-send")?.addEventListener("click",()=>void this.send()),e.querySelector("#cx-input")?.addEventListener("keydown",t=>{t.key==="Enter"&&this.send()}),this.addBotMessage("Hi! I can help with refunds, shipping, billing, and order status.")}toggle(){this.open=!this.open,this.root?.querySelector("#cx-panel")?.classList.toggle("open",this.open)}addMessage(e,t){let s=document.createElement("div");s.className=`bubble ${t}`,s.textContent=e,this.messagesEl?.appendChild(s),this.messagesEl?.scrollTo({top:this.messagesEl.scrollHeight,behavior:"smooth"})}addBotMessage(e){this.addMessage(e,"bot")}async ensureSession(){if(this.sessionId)return;let t=await(await fetch(`${this.config.apiUrl}/chat/sessions`,{method:"POST",headers:{"x-api-key":this.config.apiKey}})).json();this.sessionId=t.sessionId,localStorage.setItem("cx_session_id",this.sessionId)}async send(){let e=this.root?.querySelector("#cx-input"),t=this.root?.querySelector("#cx-typing");if(!e?.value.trim())return;let s=e.value.trim();e.value="",this.addMessage(s,"user"),t?.removeAttribute("hidden"),await this.ensureSession();let p=(await fetch(`${this.config.apiUrl}/chat/message`,{method:"POST",headers:{"Content-Type":"application/json","x-api-key":this.config.apiKey},body:JSON.stringify({message:s,sessionId:this.sessionId})})).body?.getReader(),u=new TextDecoder,r="",o=null;if(p)for(;;){let{done:h,value:x}=await p.read();if(h)break;let b=u.decode(x);for(let l of b.split(`
`)){if(!l.startsWith("data: "))continue;let c=l.slice(6).trim();if(c!=="[DONE]")try{let a=JSON.parse(c);a.type==="token"&&a.content&&(r+=a.content,o||(o=document.createElement("div"),o.className="bubble bot",this.messagesEl?.appendChild(o)),o.textContent=r,this.messagesEl?.scrollTo({top:this.messagesEl.scrollHeight,behavior:"smooth"}))}catch{}}}t?.setAttribute("hidden","true"),r||this.addBotMessage("Sorry, I couldn't respond right now.")}};(function(){let e=document.currentScript,t=e?.dataset.apiUrl??"http://localhost:3001",s=e?.dataset.apiKey??"";new d({apiUrl:t,apiKey:s})})();return w(E);})();
