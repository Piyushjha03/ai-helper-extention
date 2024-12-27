(()=>{"use strict";class e{static instance=null;constructor(){if(e.instance)return e.instance;e.instance=this,this.messages=[],this.isVisible=!1,this.isLoading=!1,this.boundKeydownHandler=this.handleKeydown.bind(this),this.boundOverlayClick=this.hide.bind(this),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",(()=>this.init())):this.init()}init(){this.initialized||(this.initialized=!0,this.createElements(),this.setupEventListeners(),this.addInitialMessage(),setTimeout((()=>{this.overlay&&this.chatbox||(this.createElements(),this.setupEventListeners())}),100))}createElements(){this.overlay=document.createElement("div"),this.overlay.className="overlay",document.body.appendChild(this.overlay),this.chatbox=document.createElement("div"),this.chatbox.className="chat-box";const e=document.createElement("div");e.className="chat-header";const t=document.createElement("div");t.className="welcome-message",t.textContent="Hey, how can I help you?";const s=document.createElement("button");s.className="close-button",s.textContent="×",s.addEventListener("click",(()=>this.hide())),e.appendChild(t),e.appendChild(s),this.chatbox.appendChild(e),this.messagesContainer=document.createElement("div"),this.messagesContainer.className="messages";const n=document.createElement("div");n.className="input-container",this.messageInput=document.createElement("input"),this.messageInput.className="message-input",this.messageInput.placeholder="Type a message...";const a=document.createElement("button");a.className="send-button",a.innerHTML="→",a.addEventListener("click",(()=>this.sendMessage())),n.appendChild(this.messageInput),n.appendChild(a),this.chatbox.appendChild(this.messagesContainer),this.chatbox.appendChild(n),document.body.appendChild(this.chatbox)}handleKeydown(e){"k"===e.key&&(e.metaKey||e.ctrlKey)&&(e.preventDefault(),this.toggle()),this.isVisible&&"Escape"===e.key&&this.hide()}setupEventListeners(){document.removeEventListener("keydown",this.boundKeydownHandler),this.overlay?.removeEventListener("click",this.boundOverlayClick),document.addEventListener("keydown",this.boundKeydownHandler),this.overlay?.addEventListener("click",this.boundOverlayClick),this.messageInput?.addEventListener("keydown",(e=>{"Enter"===e.key&&this.sendMessage()}))}cleanup(){document.removeEventListener("keydown",this.boundKeydownHandler),this.overlay?.removeEventListener("click",this.boundOverlayClick),this.overlay?.remove(),this.chatbox?.remove(),e.instance=null}addInitialMessage(){console.log("ChatBox initialized.")}setLoading(e){if(this.isLoading=e,e){const e={id:"loading",type:"system",content:"Processing your query, please wait...",timestamp:new Date};this.messages.push(e)}else this.messages=this.messages.filter((e=>"loading"!==e.id));this.renderMessages()}fetchChatHistory(e,t){if(console.log("Fetching history for user:",e,"and problem:",t),!e||!t)return this.messages.push({id:Date.now(),type:"system",content:"Error: Unable to fetch chat history.",timestamp:new Date}),void this.renderMessages();fetch(`http://localhost:3000/history?user_name=${e}&problem_title=${t}`).then((e=>{if(!e.ok)throw new Error("Failed to fetch chat history");return e.json()})).then((e=>{if("success"!==e.status)throw new Error(e.error||"Unknown error occurred");0===e.conversation.length?(console.log("No conversation found. Starting a new chat."),this.messages=[]):this.messages=e.conversation.map((e=>({id:Date.now(),type:"user"===e.role?"user":"system",content:e.parts,timestamp:new Date}))),this.renderMessages()})).catch((e=>{console.error("Error fetching chat history:",e),this.messages.push({id:Date.now(),type:"system",content:"Something went wrong. Please try again later.",timestamp:new Date}),this.renderMessages()}))}sendMessage(){const e=this.messageInput.value.trim();if(!e)return;const t={id:Date.now(),type:"user",content:e,timestamp:new Date};this.messages.push(t),this.messageInput.value="",this.renderMessages(),this.setLoading(!0);const s=localStorage.getItem("az_user_tracking_id");if(!s)return this.setLoading(!1),this.messages.push({id:Date.now(),type:"system",content:"Error: User name is missing. Please log in or set your user ID.",timestamp:new Date}),void this.renderMessages();chrome.storage.local.get("interceptedContext",(t=>{if(!t||!t.interceptedContext)return this.setLoading(!1),this.messages.push({id:Date.now(),type:"system",content:"Error: Missing problem context. Please reload and try again.",timestamp:new Date}),void this.renderMessages();const{problemTitle:n,context:a}=t.interceptedContext,i={query:e,context:a,db_data:{user_name:s,problem_title:n}};fetch("http://localhost:3000/query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(i)}).then((e=>{if(this.setLoading(!1),!e.ok)throw new Error("Server error");return e.json()})).then((e=>{if("success"!==e.status)throw new Error(e.error||"Unknown error occurred");{const t={id:Date.now(),type:"system",content:e.response,timestamp:new Date};this.messages.push(t),this.renderMessages()}})).catch((e=>{this.setLoading(!1),this.messages.push({id:Date.now(),type:"system",content:"Something went wrong. Please try again later.",timestamp:new Date}),this.renderMessages()}))}))}renderMessages(){this.messagesContainer.innerHTML="",this.messages.forEach((e=>{const t=document.createElement("div");t.className=`message ${e.type}`;const s=document.createElement("div");s.className="message-content","system"===e.type?s.innerHTML=e.content:s.textContent=e.content;const n=document.createElement("div");n.className="message-time",n.textContent=e.timestamp.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),t.appendChild(s),t.appendChild(n),this.messagesContainer.appendChild(t)})),this.messagesContainer.scrollTop=this.messagesContainer.scrollHeight}show(){this.overlay&&this.chatbox||(this.createElements(),this.setupEventListeners()),this.isVisible=!0,this.overlay.classList.add("visible"),this.chatbox.classList.add("visible"),this.messageInput.focus();const e=localStorage.getItem("az_user_tracking_id"),t=()=>{e?chrome.storage.local.get("interceptedContext",(t=>{const{problemTitle:s}=t.interceptedContext||{};s&&this.fetchChatHistory(e,s)})):setTimeout(t,100)};t()}hide(){this.isVisible=!1,this.overlay?.classList.remove("visible"),this.chatbox?.classList.remove("visible")}toggle(){this.isVisible?this.hide():this.show()}}const t=new e;window.addEventListener("message",(e=>{e.source===window&&e.data&&"apiIntercepted"===e.data.type&&chrome.runtime.sendMessage({type:"apiIntercepted",url:e.data.url,method:e.data.method,response:e.data.response},(e=>{console.log("Response from background script:",e)}))})),chrome.runtime.onMessage.addListener(((e,t,s)=>{if("getUserCode"===e.type){const{id:t}=e,n=new RegExp(`course_\\d+_${t}_\\w+`);let a=null;for(let e=0;e<localStorage.length;e++){const t=localStorage.key(e);if(n.test(t)){a=localStorage.getItem(t);break}}s({userCode:a})}return!0}));const s=document.createElement("script");s.src=chrome.runtime.getURL("injected.js"),s.onload=function(){this.remove()},(document.head||document.documentElement).appendChild(s);const n=()=>{const e=window.location.href,s=document.querySelector(".chat-ai-button-li");if(s&&s.remove(),!/^https:\/\/maang\.in\/problems\/[\w-]+(\?.*)?$/.test(e))return void console.log("Not on a problems page, button not added.");const n=document.querySelector(".coding_nav_bg__HRkIn ul");if(!n)return void console.warn("Header <ul> element not found. Button not added.");const a=document.createElement("li");a.className="d-flex flex-row rounded-3 dmsans align-items-center chat-ai-button-li",a.style.padding="0.36rem 1rem";const i=document.createElement("div");i.style.position="relative",i.style.isolation="isolate";const o=document.createElement("button");o.textContent="Ask AI",o.style.cssText="\n    display: flex;\n    align-items: center;\n    padding: 0.5rem 1.2rem;\n    background: linear-gradient(135deg, rgba(37, 38, 89, 0.9), rgba(63, 76, 119, 0.9));\n    color: #fff;\n    font-weight: 600;\n    border: 1px solid rgba(255, 255, 255, 0.1);\n    border-radius: 12px;\n    cursor: pointer;\n    transition: all 0.3s ease;\n    font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n    letter-spacing: 0.3px;\n    position: relative;\n    overflow: hidden;\n    backdrop-filter: blur(10px);\n    -webkit-backdrop-filter: blur(10px);\n    box-shadow: \n      0 4px 6px -1px rgba(0, 0, 0, 0.1),\n      0 2px 4px -1px rgba(0, 0, 0, 0.06),\n      inset 0 1px 0 rgba(255, 255, 255, 0.1);\n    white-space: nowrap;\n  ";const r=document.createElement("span");r.textContent="(⌘K/ctrl+K)",r.style.marginLeft="8px",r.style.fontSize="0.8em",r.style.opacity="0.8",o.addEventListener("mouseover",(()=>{o.style.transform="translateY(-1px)",o.style.background="linear-gradient(135deg, rgba(47, 48, 99, 0.95), rgba(73, 86, 129, 0.95))",o.style.boxShadow="\n      0 4px 12px -1px rgba(0, 0, 0, 0.15),\n      0 2px 6px -1px rgba(0, 0, 0, 0.1),\n      inset 0 1px 0 rgba(255, 255, 255, 0.1),\n      0 0 15px rgba(105, 17, 203, 0.3)\n    "})),o.addEventListener("mouseout",(()=>{o.style.transform="translateY(0)",o.style.background="linear-gradient(135deg, rgba(37, 38, 89, 0.9), rgba(63, 76, 119, 0.9))",o.style.boxShadow="\n      0 4px 6px -1px rgba(0, 0, 0, 0.1),\n      0 2px 4px -1px rgba(0, 0, 0, 0.06),\n      inset 0 1px 0 rgba(255, 255, 255, 0.1)\n    "})),o.addEventListener("mousedown",(()=>{o.style.transform="translateY(1px)",o.style.boxShadow="\n      0 2px 4px -1px rgba(0, 0, 0, 0.1),\n      0 1px 2px -1px rgba(0, 0, 0, 0.06),\n      inset 0 1px 0 rgba(255, 255, 255, 0.1)\n    "})),o.addEventListener("mouseup",(()=>{o.style.transform="translateY(-1px)"})),o.addEventListener("click",(()=>{console.log("AI Button clicked, opening chatbox"),t.show()})),o.appendChild(r),i.appendChild(o),a.appendChild(i),n.appendChild(a)},a=()=>{let e=window.location.href;new MutationObserver((t=>{const s=window.location.href;s!==e&&(e=s,n()),t.forEach((e=>{(e.target.classList?.contains("coding_nav_bg__HRkIn")||e.target.querySelector?.(".coding_nav_bg__HRkIn"))&&n()}))})).observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class"]}),window.addEventListener("popstate",n);const t=history.pushState;history.pushState=function(){t.apply(this,arguments),n()};const s=history.replaceState;history.replaceState=function(){s.apply(this,arguments),n()},window.addEventListener("hashchange",n)},i=()=>{n(),a(),setTimeout(n,1e3)};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",i):i()})();