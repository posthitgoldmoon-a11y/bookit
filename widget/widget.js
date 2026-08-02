(function() {
  'use strict';

  const WIDGET_API = 'https://medi.bookit.ai.kr/widget/api/chat';
  const RESET_API  = 'https://medi.bookit.ai.kr/widget/api/reset';

  let sessionId = null;
  let isOpen    = false;

  const style = document.createElement('style');
  style.textContent = `
    #bk-widget-btn {
      position: fixed; bottom: 160px; right: 28px; z-index: 99999;
      width: 70px; height: 70px; border-radius: 50%;
      background: #FEE500;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      border: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 2px; padding: 0;
      transition: transform .2s, box-shadow .2s;
    }
    #bk-widget-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(0,0,0,0.25); }
    #bk-widget-btn svg { width: 26px; height: 26px; fill: #3A1D1D; flex-shrink: 0; }
    #bk-widget-btn-label {
      font-size: 10px; font-weight: 700; color: #3A1D1D;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      white-space: nowrap;
    }
    #bk-badge {
      position: absolute; top: -4px; right: -4px;
      background: #ff4757; color: #fff; font-size: 11px; font-weight: 700;
      border-radius: 10px; padding: 2px 6px; display: none;
    }

    #bk-widget-box {
      position: fixed; bottom: 230px; right: 28px; z-index: 99998;
      width: 360px; height: 560px; max-height: 80vh;
      background: #fff; border-radius: 20px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: none; flex-direction: column; overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      animation: bkSlideUp .25s ease;
    }
    @keyframes bkSlideUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    #bk-header {
      background: #FEE500;
      padding: 16px 18px; display: flex; align-items: center; gap: 12px;
      flex-shrink: 0;
    }
    #bk-header-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(0,0,0,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; flex-shrink: 0;
    }
    #bk-header-info { flex: 1; }
    #bk-header-info .bk-name { color: #3A1D1D; font-size: 15px; font-weight: 700; }
    #bk-header-info .bk-status { color: rgba(0,0,0,0.5); font-size: 12px; margin-top: 2px; }
    #bk-header-close {
      background: none; border: none; cursor: pointer;
      color: rgba(0,0,0,0.4); font-size: 22px; line-height: 1;
      padding: 0; transition: color .15s;
    }
    #bk-header-close:hover { color: #3A1D1D; }

    #bk-messages {
      flex: 1; overflow-y: auto; padding: 16px 14px;
      background: #f7f8fc; display: flex; flex-direction: column; gap: 10px;
    }
    #bk-messages::-webkit-scrollbar { width: 4px; }
    #bk-messages::-webkit-scrollbar-thumb { background: #d0d5e8; border-radius: 2px; }

    .bk-msg { display: flex; align-items: flex-end; gap: 8px; max-width: 85%; }
    .bk-msg.bk-bot { align-self: flex-start; }
    .bk-msg.bk-user { align-self: flex-end; flex-direction: row-reverse; }

    .bk-avatar {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      background: #FEE500;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px;
    }
    .bk-bubble {
      padding: 10px 13px; border-radius: 16px;
      font-size: 13.5px; line-height: 1.55; word-break: break-word;
      white-space: pre-wrap;
    }
    .bk-bot .bk-bubble {
      background: #fff; color: #2d3748;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .bk-user .bk-bubble {
      background: #FEE500;
      color: #3A1D1D; border-bottom-right-radius: 4px;
    }

    .bk-typing {
      display: flex; align-items: center; gap: 5px;
      padding: 10px 14px; background: #fff; border-radius: 16px;
      border-bottom-left-radius: 4px; box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .bk-typing span {
      width: 7px; height: 7px; background: #b0b8d4; border-radius: 50%;
      animation: bkBounce 1.2s infinite;
    }
    .bk-typing span:nth-child(2) { animation-delay: .2s; }
    .bk-typing span:nth-child(3) { animation-delay: .4s; }
    @keyframes bkBounce {
      0%,60%,100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    #bk-quick-btns {
      display: flex; gap: 8px; padding: 10px 14px 4px;
      flex-shrink: 0; background: #f7f8fc;
    }
    .bk-quick-btn {
      flex: 1; padding: 8px 6px; border-radius: 10px; border: none;
      font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s;
    }
    .bk-quick-btn.trial {
      background: #FEE500;
      color: #3A1D1D; box-shadow: 0 2px 8px rgba(254,229,0,0.4);
    }
    .bk-quick-btn.trial:hover { box-shadow: 0 4px 14px rgba(254,229,0,0.55); transform: translateY(-1px); }
    .bk-quick-btn.home {
      background: #fff; color: #3A1D1D;
      border: 1.5px solid #FEE500;
    }
    .bk-quick-btn.home:hover { background: #FFFBE0; }

    #bk-input-row {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px 14px; background: #fff; flex-shrink: 0;
      border-top: 1px solid #eef0f8;
    }
    #bk-input {
      flex: 1; border: 1.5px solid #e2e6f3; border-radius: 22px;
      padding: 9px 14px; font-size: 13.5px; outline: none; resize: none;
      font-family: inherit; line-height: 1.4; max-height: 80px; overflow-y: auto;
      transition: border-color .2s;
    }
    #bk-input:focus { border-color: #FEE500; }
    #bk-send {
      width: 38px; height: 38px; border-radius: 50%; border: none;
      background: #FEE500;
      color: #3A1D1D; cursor: pointer; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; transition: transform .15s;
    }
    #bk-send:hover { transform: scale(1.08); }
    #bk-send svg { width: 17px; height: 17px; fill: #3A1D1D; }

    @media (max-width: 420px) {
      #bk-widget-box { width: calc(100vw - 24px); right: 12px; bottom: 220px; }
      #bk-widget-btn { right: 16px; bottom: 150px; }
    }
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <button id="bk-widget-btn" aria-label="부킷 AI 상담">
      <svg viewBox="0 0 24 24"><path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
      <span id="bk-widget-btn-label">부킷상담</span>
      <span id="bk-badge">1</span>
    </button>

    <div id="bk-widget-box" role="dialog" aria-label="부킷 AI 상담창">
      <div id="bk-header">
        <div id="bk-header-avatar">🤖</div>
        <div id="bk-header-info">
          <div class="bk-name">부킷 AI 상담사</div>
          <div class="bk-status">● 온라인 · 24시간 응답</div>
        </div>
        <button id="bk-header-close" aria-label="닫기">✕</button>
      </div>

      <div id="bk-messages"></div>

      <div id="bk-quick-btns">
        <button class="bk-quick-btn trial" onclick="bkQuickAction('trial')">🎁 14일 무료체험 신청</button>
        <button class="bk-quick-btn home"  onclick="bkQuickAction('home')">🏠 처음으로</button>
      </div>

      <div id="bk-input-row">
        <textarea id="bk-input" rows="1" placeholder="무엇이든 물어보세요..."></textarea>
        <button id="bk-send" aria-label="전송">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `);

  const WELCOME = `안녕하세요! 😊 부킷 AI 상담사입니다.\n\n카카오·라인·네이버톡톡·왓츠앱·인스타를 AI로 자동화해 드려요!\n\n🏥 병원·의원  🍽️ 식당·카페  ✂️ 헤어·뷰티\n🛒 이커머스 CS  🔢 웨이팅  💬 홈페이지 위젯\n\n어떤 업종에서 운영하고 계세요? 😄`;

  const $msgs  = () => document.getElementById('bk-messages');
  const $input = () => document.getElementById('bk-input');

  function scrollBottom() {
    const m = $msgs(); m.scrollTop = m.scrollHeight;
  }

  function addMsg(text, role) {
    const wrap = document.createElement('div');
    wrap.className = `bk-msg bk-${role}`;
    if (role === 'bot') {
      wrap.innerHTML = `<div class="bk-avatar">🤖</div><div class="bk-bubble">${escHtml(text)}</div>`;
    } else {
      wrap.innerHTML = `<div class="bk-bubble">${escHtml(text)}</div>`;
    }
    $msgs().appendChild(wrap);
    scrollBottom();
  }

  function escHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/\n/g,'<br>');
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'bk-msg bk-bot'; div.id = 'bk-typing-wrap';
    div.innerHTML = `<div class="bk-avatar">🤖</div><div class="bk-typing"><span></span><span></span><span></span></div>`;
    $msgs().appendChild(div); scrollBottom(); return div;
  }

  function removeTyping() {
    const el = document.getElementById('bk-typing-wrap');
    if (el) el.remove();
  }

  async function sendToAPI(payload) {
    const res = await fetch(WIDGET_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, ...payload })
    });
    return res.json();
  }

  async function chat(message) {
    addMsg(message, 'user');
    $input().value = '';
    $input().style.height = 'auto';
    const t = showTyping();
    try {
      const data = await sendToAPI({ message });
      if (data.sessionId) sessionId = data.sessionId;
      removeTyping();
      addMsg(data.reply || data.error || '오류가 발생했습니다.', 'bot');
    } catch(e) {
      removeTyping();
      addMsg('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.\n📞 010-5399-7585', 'bot');
    }
  }

  window.bkQuickAction = async function(action) {
    const t = showTyping();
    try {
      const data = await sendToAPI({ action, message: '' });
      if (data.sessionId) sessionId = data.sessionId;
      removeTyping();
      addMsg(data.reply, 'bot');
    } catch(e) {
      removeTyping();
      addMsg('오류가 발생했습니다. 📞 010-5399-7585', 'bot');
    }
  };

  document.getElementById('bk-widget-btn').onclick = function() {
    isOpen = !isOpen;
    const box = document.getElementById('bk-widget-box');
    box.style.display = isOpen ? 'flex' : 'none';
    document.getElementById('bk-badge').style.display = 'none';
    if (isOpen && $msgs().children.length === 0) {
      addMsg(WELCOME, 'bot');
    }
    if (isOpen) setTimeout(() => $input().focus(), 100);
  };

  document.getElementById('bk-header-close').onclick = function() {
    isOpen = false;
    document.getElementById('bk-widget-box').style.display = 'none';
  };

  document.getElementById('bk-send').onclick = function() {
    const msg = $input().value.trim();
    if (msg) chat(msg);
  };

  $input().addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const msg = this.value.trim();
      if (msg) chat(msg);
    }
  });

  $input().addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 80) + 'px';
  });

  setTimeout(() => {
    if (!isOpen) {
      document.getElementById('bk-badge').style.display = 'inline';
    }
  }, 10000);

})();
