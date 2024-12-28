(()=>{"use strict";class e{static instance=null;constructor(){if(e.instance)return e.instance;e.instance=this,this.messages=[],this.isVisible=!1,this.isLoading=!1,this.boundKeydownHandler=this.handleKeydown.bind(this),this.boundOverlayClick=this.hide.bind(this),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",(()=>this.init())):this.init()}init(){this.initialized||(this.initialized=!0,this.createElements(),this.setupEventListeners(),this.addInitialMessage(),setTimeout((()=>{this.overlay&&this.chatbox||(this.createElements(),this.setupEventListeners())}),100))}createElements(){this.overlay=document.createElement("div"),this.overlay.className="overlay",document.body.appendChild(this.overlay),this.chatbox=document.createElement("div"),this.chatbox.className="chat-box";const e=document.createElement("div");e.className="chat-header";const t=document.createElement("div");t.className="welcome-message",t.textContent="Hey, how can I help you?";const s=document.createElement("button");s.className="close-button",s.textContent="×",s.addEventListener("click",(()=>this.hide())),e.appendChild(t),e.appendChild(s),this.chatbox.appendChild(e),this.messagesContainer=document.createElement("div"),this.messagesContainer.className="messages";const n=document.createElement("div");n.className="input-container",this.messageInput=document.createElement("input"),this.messageInput.className="message-input",this.messageInput.placeholder="Type a message...";const i=document.createElement("button");i.className="send-button",i.innerHTML="→",i.addEventListener("click",(()=>this.sendMessage())),n.appendChild(this.messageInput),n.appendChild(i),this.chatbox.appendChild(this.messagesContainer),this.chatbox.appendChild(n),document.body.appendChild(this.chatbox)}handleKeydown(e){"k"===e.key&&(e.metaKey||e.ctrlKey)&&(e.preventDefault(),this.toggle()),this.isVisible&&"Escape"===e.key&&this.hide()}setupEventListeners(){document.removeEventListener("keydown",this.boundKeydownHandler),this.overlay?.removeEventListener("click",this.boundOverlayClick),document.addEventListener("keydown",this.boundKeydownHandler),this.overlay?.addEventListener("click",this.boundOverlayClick),this.messageInput?.addEventListener("keydown",(e=>{"Enter"===e.key&&this.sendMessage()}))}cleanup(){document.removeEventListener("keydown",this.boundKeydownHandler),this.overlay?.removeEventListener("click",this.boundOverlayClick),this.overlay?.remove(),this.chatbox?.remove(),e.instance=null}addInitialMessage(){console.log("ChatBox initialized.")}setLoading(e){if(this.isLoading=e,e){const e={id:"loading",type:"system",content:"Processing your query, please wait...",timestamp:new Date};this.messages.push(e)}else this.messages=this.messages.filter((e=>"loading"!==e.id));this.renderMessages()}fetchChatHistory(e,t){if(console.log("Fetching history for user:",e,"and problem:",t),!e||!t)return this.messages.push({id:Date.now(),type:"system",content:"Error: Unable to fetch chat history.",timestamp:new Date}),void this.renderMessages();fetch(`https://ai-helper-extention.vercel.app/history?user_name=${e}&problem_title=${t}`).then((e=>{if(!e.ok)throw new Error("Failed to fetch chat history");return e.json()})).then((e=>{if("success"!==e.status)throw new Error(e.error||"Unknown error occurred");0===e.conversation.length?(console.log("No conversation found. Starting a new chat."),this.messages=[]):this.messages=e.conversation.map((e=>({id:Date.now(),type:"user"===e.role?"user":"system",content:e.parts,timestamp:new Date}))),this.renderMessages()})).catch((e=>{console.error("Error fetching chat history:",e),this.messages.push({id:Date.now(),type:"system",content:"Something went wrong. Please try again later.",timestamp:new Date}),this.renderMessages()}))}sendMessage(){const e=this.messageInput.value.trim();if(!e)return;const t={id:Date.now(),type:"user",content:e,timestamp:new Date};this.messages.push(t),this.messageInput.value="",this.renderMessages(),this.setLoading(!0);const s=localStorage.getItem("az_user_tracking_id");if(!s)return this.setLoading(!1),this.messages.push({id:Date.now(),type:"system",content:"Error: User name is missing. Please log in or set your user ID.",timestamp:new Date}),void this.renderMessages();chrome.storage.local.get("interceptedContext",(t=>{if(!t||!t.interceptedContext)return this.setLoading(!1),this.messages.push({id:Date.now(),type:"system",content:"Error: Missing problem context. Please reload and try again.",timestamp:new Date}),void this.renderMessages();const{problemTitle:n,context:i}=t.interceptedContext,a={query:e,context:i,db_data:{user_name:s,problem_title:n}};fetch("https://ai-helper-extention.vercel.app/query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(a)}).then((e=>{if(this.setLoading(!1),!e.ok)throw new Error("Server error");return e.json()})).then((e=>{if("success"!==e.status)throw new Error(e.error||"Unknown error occurred");{const t={id:Date.now(),type:"system",content:e.response,timestamp:new Date};this.messages.push(t),this.renderMessages()}})).catch((e=>{this.setLoading(!1),this.messages.push({id:Date.now(),type:"system",content:"Something went wrong. Please try again later.",timestamp:new Date}),this.renderMessages()}))}))}renderMessages(){this.messagesContainer.innerHTML="",this.messages.forEach((e=>{const t=document.createElement("div");t.className=`message ${e.type}`;const s=document.createElement("div");s.className="message-content","system"===e.type?s.innerHTML=e.content:s.textContent=e.content;const n=document.createElement("div");n.className="message-time",n.textContent=e.timestamp.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}),t.appendChild(s),t.appendChild(n),this.messagesContainer.appendChild(t)})),this.messagesContainer.scrollTop=this.messagesContainer.scrollHeight}show(){this.overlay&&this.chatbox||(this.createElements(),this.setupEventListeners()),this.isVisible=!0,this.overlay.classList.add("visible"),this.chatbox.classList.add("visible"),this.messageInput.focus();const e=localStorage.getItem("az_user_tracking_id"),t=()=>{e?chrome.storage.local.get("interceptedContext",(t=>{const{problemTitle:s}=t.interceptedContext||{};s&&this.fetchChatHistory(e,s)})):setTimeout(t,100)};t()}hide(){this.isVisible=!1,this.overlay?.classList.remove("visible"),this.chatbox?.classList.remove("visible")}toggle(){this.isVisible?this.hide():this.show()}}class t{static instance=null;constructor(){if(t.instance)return t.instance;t.instance=this,this.isVisible=!1,this.results=[],this.messages=[],this.isLoading=!1,this.boundKeydownHandler=this.handleKeydown.bind(this),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",(()=>this.init())):this.init()}init(){this.initialized||(this.initialized=!0,this.createElements(),this.setupEventListeners(),this.autoFetchQueryById())}autoFetchQueryById(){chrome.storage.local.get("interceptedContext",(e=>{const{interceptedContext:t}=e||{};t?.context?.id?(console.log("Fetching query by ID from interceptedContext:",t.context.id),this.setLoading(!0),this.fetchQueryById(t.context.id)):(console.log("No query ID found in interceptedContext."),this.addMessage({type:"system",content:"No query ID available to fetch data.",timestamp:new Date}))}))}fetchQueryById(e){e?fetch("https://ai-helper-extention-searchserver.vercel.app/queryById",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:e,topK:5})}).then((e=>{if(!e.ok)throw new Error("Failed to fetch query by ID");return e.json()})).then((t=>{this.setLoading(!1),0===t.results.length?this.addMessage({type:"system",content:`No results found for ID: ${e}`,timestamp:new Date}):(this.results=t.results,t.results.forEach((e=>{this.addMessage({type:"system",content:`Title: ${s(e.metadata)||"Untitled"}<br>\n                        Similarity Score: ${e.score.toFixed(2)}`,timestamp:new Date})})))})).catch((e=>{console.error("Error fetching query by ID:",e),this.setLoading(!1),this.addMessage({type:"system",content:"Something went wrong. Please try again later.",timestamp:new Date})})):this.addMessage({type:"system",content:"Error: Query ID is missing.",timestamp:new Date})}createElements(){this.overlay=document.createElement("div"),this.overlay.className="vector-overlay",document.body.appendChild(this.overlay),this.modal=document.createElement("div"),this.modal.className="vector-modal";const e=document.createElement("div");e.className="vector-header";const t=document.createElement("div");t.className="vector-title",t.textContent="Vector Search (Similar questions in AZ Problemset)";const s=document.createElement("button");s.className="close-button",s.textContent="×",s.addEventListener("click",(()=>this.hide())),e.appendChild(t),e.appendChild(s),this.modal.appendChild(e),this.messagesContainer=document.createElement("div"),this.messagesContainer.className="vector-messages",this.modal.appendChild(this.messagesContainer);const n=document.createElement("div");n.className="vector-input-container",this.searchInput=document.createElement("input"),this.searchInput.className="vector-input",this.searchInput.placeholder="Enter keyworks to find related questions...";const i=document.createElement("button");i.className="vector-send-button",i.innerHTML="→",i.addEventListener("click",(()=>this.handleUserQuery()));const a=document.createElement("button");a.className="vector-search-button",a.textContent="→",a.addEventListener("click",(()=>this.handleUserQuery())),n.appendChild(this.searchInput),n.appendChild(a),this.modal.appendChild(n),document.body.appendChild(this.modal)}setupEventListeners(){document.removeEventListener("keydown",this.boundKeydownHandler),this.overlay?.removeEventListener("click",this.hide.bind(this)),document.addEventListener("keydown",this.boundKeydownHandler),this.overlay?.addEventListener("click",this.hide.bind(this)),this.searchInput?.addEventListener("keydown",(e=>{"Enter"===e.key&&this.handleUserQuery()}))}handleKeydown(e){"d"===e.key&&(e.metaKey||e.ctrlKey)&&(e.preventDefault(),this.toggle()),this.isVisible&&"Escape"===e.key&&this.hide()}handleUserQuery(){const e=this.searchInput.value.trim();e&&(this.clearState(),this.addMessage({type:"user",content:e,timestamp:new Date}),this.searchInput.value="",this.performSearch(e))}performSearch(e){console.log("Performing search for:",e),fetch("https://ai-helper-extention-searchserver.vercel.app/query",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:e,topK:5})}).then((e=>{if(!e.ok)throw new Error("Server error");return e.json()})).then((e=>{this.results=e.results,0===this.results.length?this.addMessage({type:"system",content:"No results found for your query.",timestamp:new Date}):this.results.forEach((e=>{this.addMessage({type:"system",content:`Title: ${s(e.metadata)||"Untitled"}<br>\n                        Similarity Score: ${e.score.toFixed(2)}`,timestamp:new Date})}))})).catch((e=>{console.error("Error performing vector search:",e),this.addMessage({type:"system",content:"Something went wrong. Please try again later.",timestamp:new Date})}))}addMessage(e){this.messages.push(e),this.renderMessages()}setLoading(e){if(this.isLoading=e,e){const e={type:"system",content:'\n          <div class="message-content loading">\n            Searching\n            <div class="loading-dots">\n              <span></span>\n              <span></span>\n              <span></span>\n            </div>\n          </div>\n        ',timestamp:new Date};this.addMessage(e)}else this.messages=this.messages.filter((e=>!e.content.includes("loading-dots"))),this.renderMessages()}renderMessages(){this.messagesContainer.innerHTML="",this.messages.forEach((e=>{const t=document.createElement("div");t.className=`message ${e.type}`;const s=document.createElement("div");s.className="message-content","system"===e.type?s.innerHTML=e.content:s.textContent=e.content,t.appendChild(s),this.messagesContainer.appendChild(t)})),this.messagesContainer.scrollTop=this.messagesContainer.scrollHeight}show(){this.overlay&&this.modal||(this.createElements(),this.setupEventListeners()),this.isVisible=!0,this.overlay.classList.add("visible"),this.modal.classList.add("visible"),this.searchInput.focus()}hide(){this.isVisible=!1,this.overlay?.classList.remove("visible"),this.modal?.classList.remove("visible")}toggle(){this.isVisible?this.hide():this.show()}clearState(){this.messages=[],this.results=[],this.renderMessages()}reset(){console.log("Resetting VectorSearchBox..."),this.clearState(),this.searchInput.value="",setTimeout((()=>{console.log("Attempting to auto-fetch query by ID..."),this.autoFetchQueryById()}),1500),console.log("Reset complete.")}}function s(e){if(!e||!e.text)return null;const t=e.text,s=t.indexOf("\n");return-1===s?t.trim():t.substring(0,s).trim()}const n=new e,i=new t;window.addEventListener("message",(e=>{e.source===window&&e.data&&"apiIntercepted"===e.data.type&&chrome.runtime.sendMessage({type:"apiIntercepted",url:e.data.url,method:e.data.method,response:e.data.response},(e=>{console.log("Response from background script:",e)}))})),chrome.runtime.onMessage.addListener(((e,t,s)=>{if("getUserCode"===e.type){const{id:t}=e,n=new RegExp(`course_\\d+_${t}_\\w+`);let i=null;for(let e=0;e<localStorage.length;e++){const t=localStorage.key(e);if(n.test(t)){i=localStorage.getItem(t);break}}s({userCode:i})}return!0}));const a=document.createElement("script");a.src=chrome.runtime.getURL("injected.js"),a.onload=function(){this.remove()},(document.head||document.documentElement).appendChild(a);const o=()=>{const e=window.location.href,t=document.querySelector(".chat-ai-button-li"),s=document.querySelector(".vector-search-button-li");if(t&&t.remove(),s&&s.remove(),!/^https:\/\/maang\.in\/problems\/[\w-]+(\?.*)?$/.test(e))return void console.log("Not on a problems page, buttons not added.");const a=document.querySelector(".coding_nav_bg__HRkIn ul");if(!a)return void console.warn("Header <ul> element not found. Buttons not added.");const o=(e,t,s,n)=>{const i=document.createElement("li");i.className=`d-flex flex-row rounded-3 dmsans align-items-center ${n}`,i.style.padding="0.36rem 1rem";const a=document.createElement("div");a.style.position="relative",a.style.isolation="isolate";const o=document.createElement("button");o.textContent=e,o.style.cssText="\n      display: flex;\n      align-items: center;\n      padding: 0.5rem 1.2rem;\n      background: linear-gradient(135deg, rgba(37, 38, 89, 0.9), rgba(63, 76, 119, 0.9));\n      color: #fff;\n      font-weight: 600;\n      border: 1px solid rgba(255, 255, 255, 0.1);\n      border-radius: 12px;\n      cursor: pointer;\n      transition: all 0.3s ease;\n      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n      letter-spacing: 0.3px;\n      position: relative;\n      overflow: hidden;\n      backdrop-filter: blur(10px);\n      -webkit-backdrop-filter: blur(10px);\n      box-shadow: \n        0 4px 6px -1px rgba(0, 0, 0, 0.1),\n        0 2px 4px -1px rgba(0, 0, 0, 0.06),\n        inset 0 1px 0 rgba(255, 255, 255, 0.1);\n      white-space: nowrap;\n    ";const r=document.createElement("span");return r.textContent=t,r.style.marginLeft="8px",r.style.fontSize="0.8em",r.style.opacity="0.8",o.addEventListener("click",s),o.appendChild(r),a.appendChild(o),i.appendChild(a),i},r=o("Ask AI","(⌘K/ctrl+K)",(()=>{console.log("AI Button clicked, opening chatbox"),n.show()}),"chat-ai-button-li"),c=o("Vector Search","(⌘D/ctrl+D)",(()=>{console.log("Vector Search Button clicked"),i.show()}),"vector-search-button-li");a.appendChild(r),a.appendChild(c)},r=()=>{let e=window.location.href;new MutationObserver((t=>{const s=window.location.href;s!==e&&(e=s,o(),i.reset()),t.forEach((e=>{(e.target.classList?.contains("coding_nav_bg__HRkIn")||e.target.querySelector?.(".coding_nav_bg__HRkIn"))&&o()}))})).observe(document.body,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class"]}),window.addEventListener("popstate",(()=>{o(),i.reset()}));const t=history.pushState;history.pushState=function(){t.apply(this,arguments),o(),i.reset()};const s=history.replaceState;history.replaceState=function(){s.apply(this,arguments),o(),i.reset()},window.addEventListener("hashchange",(()=>{o(),i.reset()}))},c=()=>{o(),r(),setTimeout(o,1e3)};"loading"===document.readyState?document.addEventListener("DOMContentLoaded",c):c()})();