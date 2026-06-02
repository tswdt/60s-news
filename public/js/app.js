(function () {
  const SUBJECT_MAP = {
    math: '📐 数学', chinese: '📝 语文', english: '🔤 英语',
    physics: '⚡ 物理', chemistry: '🧪 化学', history: '📜 历史',
    biology: '🧬 生物', geography: '🌍 地理', geometry: '📏 几何',
  };

  let state = {
    subject: 'math',
    grade: '7',
    model: 'deepseek',
    messages: [],
    isStreaming: false,
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const chatArea = $('#chatArea');
  const messagesEl = $('#messages');
  const userInput = $('#userInput');
  const sendBtn = $('#sendBtn');
  const welcomeScreen = $('#welcomeScreen');
  const sidebar = $('#sidebar');
  const overlay = $('#overlay');

  function init() {
    bindSubjects();
    bindGrades();
    bindModels();
    bindQuickQuestions();
    bindInput();
    bindSidebar();
    bindClear();
  }

  function bindSubjects() {
    $$('.subject-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.subject-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.subject = btn.dataset.subject;
        updateHeader();
      });
    });
  }

  function bindGrades() {
    $$('.grade-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.grade-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.grade = btn.dataset.grade;
        updateHeader();
      });
    });
  }

  function bindModels() {
    $$('.model-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.model-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.model = btn.dataset.model;
      });
    });
  }

  function bindQuickQuestions() {
    $$('.quick-q').forEach(btn => {
      btn.addEventListener('click', () => {
        userInput.value = btn.dataset.q;
        sendMessage();
        closeSidebar();
      });
    });
  }

  function bindInput() {
    userInput.addEventListener('input', () => {
      userInput.style.height = 'auto';
      userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
      sendBtn.disabled = !userInput.value.trim();
    });

    userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (userInput.value.trim() && !state.isStreaming) {
          sendMessage();
        }
      }
    });

    sendBtn.addEventListener('click', () => {
      if (userInput.value.trim() && !state.isStreaming) {
        sendMessage();
      }
    });
  }

  function bindSidebar() {
    $('#menuBtn').addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });

    $('#sidebarClose').addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
  }

  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  }

  function bindClear() {
    $('#clearBtn').addEventListener('click', () => {
      if (state.messages.length === 0) return;
      if (confirm('确定清空所有对话？')) {
        state.messages = [];
        messagesEl.innerHTML = '';
        welcomeScreen.classList.remove('hidden');
      }
    });
  }

  function updateHeader() {
    $('#headerSubject').textContent = SUBJECT_MAP[state.subject] || '📐 数学';
    const gradeLabels = {
      '1': '小学一年级', '2': '小学二年级', '3': '小学三年级',
      '4': '小学四年级', '5': '小学五年级', '6': '小学六年级',
      '7': '初一', '8': '初二', '9': '初三',
      '10': '高一', '11': '高二', '12': '高三',
    };
    $('#headerGrade').textContent = gradeLabels[state.grade] || '初一';
  }

  async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || state.isStreaming) return;

    welcomeScreen.classList.add('hidden');

    state.messages.push({ role: 'user', content: text });
    appendMessage('user', text);

    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;

    const aiMsgEl = appendMessage('ai', '');
    const contentEl = aiMsgEl.querySelector('.message-text');

    showTyping(contentEl);

    state.isStreaming = true;
    let fullContent = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: state.messages,
          grade: state.grade,
          subject: state.subject,
          model: state.model,
        }),
      });

      if (!res.ok) {
        throw new Error(`服务器错误: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                fullContent += parsed.content;
                renderAIContent(contentEl, fullContent);
              }
            } catch (e) {
              if (e.message && !e.message.includes('JSON')) {
                throw e;
              }
            }
          }
        }
      }
    } catch (error) {
      contentEl.innerHTML = `<div class="error-msg">⚠️ ${error.message}</div>`;
      fullContent = '';
    }

    state.isStreaming = false;

    if (fullContent) {
      state.messages.push({ role: 'assistant', content: fullContent });
    }

    scrollToBottom();
  }

  function appendMessage(role, content) {
    const div = document.createElement('div');
    div.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'ai' ? '🤖' : '👤';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.textContent = content;

    contentDiv.appendChild(textDiv);
    div.appendChild(avatar);
    div.appendChild(contentDiv);
    messagesEl.appendChild(div);

    scrollToBottom();
    return div;
  }

  function showTyping(el) {
    el.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
  }

  function renderAIContent(el, rawContent) {
    const visualBlocks = [];
    let textContent = rawContent;

    const visualRegex = /\[VISUAL:(\w+)\|([^\]]+)\]/g;
    let match;
    while ((match = visualRegex.exec(rawContent)) !== null) {
      const type = match[1];
      const paramStr = match[2];
      const params = {};
      paramStr.split('|').forEach(p => {
        const [key, ...vals] = p.split('=');
        if (key && vals.length) params[key] = vals.join('=');
      });
      visualBlocks.push({ type, params, fullMatch: match[0] });
    }

    textContent = rawContent.replace(visualRegex, '');

    let html = textContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/`(.+?)`/g, '<code style="background:#F1F5F9;padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>');

    html = html.replace(/\n/g, '<br>');

    el.innerHTML = html;

    try {
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
        ],
        throwOnError: false,
      });
    } catch (e) {}

    if (visualBlocks.length > 0) {
      const existingPanels = el.parentElement.querySelectorAll('.visual-panel');
      const existingCount = existingPanels.length;

      if (visualBlocks.length > existingCount) {
        for (let i = existingCount; i < visualBlocks.length; i++) {
          const vb = visualBlocks[i];
          try {
            VisualEngine.render(el.parentElement, vb.type, vb.params);
          } catch (e) {
            console.error('Visual render error:', e);
          }
        }
      }
    }

    scrollToBottom();
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatArea.scrollTop = chatArea.scrollHeight;
    });
  }

  init();
})();
