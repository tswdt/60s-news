(function () {
  const SUBJECT_MAP = {
    math: '📐 数学', chinese: '📝 语文', english: '🔤 英语',
    physics: '⚡ 物理', chemistry: '🧪 化学', history: '📜 历史',
    biology: '🧬 生物', geography: '🌍 地理', geometry: '📏 几何',
  };

  const TEACHING_MODE_LABELS = {
    socratic_visual: '🧠 引导思考',
    explanation: '📖 讲解',
    practice: '✏️ 练习',
    diagnosis: '🔍 诊断',
  };

  const NEXT_ACTION_LABELS = {
    wait_student_answer: '等待你的回答',
    show_hint: '给你一个提示',
    advance_step: '进入下一步',
    give_summary: '总结',
  };

  let state = {
    subject: 'math',
    grade: '7',
    model: 'deepseek',
    messages: [],
    isStreaming: false,
    currentParsed: null,
  };

  const API_BASE = '/api';

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
        state.currentParsed = null;
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
    let rawContent = '';
    let finalParsed = null;

    try {
      const res = await fetch(`${API_BASE}/tutor`, {
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
              if (parsed.error && !parsed.parsed) {
                throw new Error(parsed.error);
              }
              if (parsed.content) {
                rawContent += parsed.content;
                renderStreamingContent(contentEl, rawContent);
              }
              if (parsed.parsed) {
                finalParsed = parsed.parsed;
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
      rawContent = '';
    }

    state.isStreaming = false;

    if (finalParsed) {
      state.currentParsed = finalParsed;
      state.messages.push({ role: 'assistant', content: finalParsed.reply });
      renderParsedResponse(contentEl, finalParsed);
    } else if (rawContent) {
      state.messages.push({ role: 'assistant', content: rawContent });
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

  function renderStreamingContent(el, rawContent) {
    let html = rawContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>');

    el.innerHTML = html;
    scrollToBottom();
  }

  function renderParsedResponse(el, parsed) {
    let html = '';

    if (parsed.reply) {
      html += '<div class="tutor-reply">';
      html += escapeHtml(parsed.reply).replace(/\n/g, '<br>');
      html += '</div>';
    }

    if (parsed.question_to_student) {
      html += '<div class="tutor-question">';
      html += '💭 <strong>思考：</strong>' + escapeHtml(parsed.question_to_student).replace(/\n/g, '<br>');
      html += '</div>';
    }

    if (parsed.visual && parsed.visual.type !== 'none') {
      html += '<div class="tutor-visual-placeholder" data-visual-type="' + escapeHtml(parsed.visual.type) + '">';
      html += '🎨 可视化: ' + escapeHtml(parsed.visual.type);
      html += '</div>';
    }

    html += '<div class="tutor-meta">';
    if (parsed.teaching_mode) {
      html += '<span class="meta-tag">' + (TEACHING_MODE_LABELS[parsed.teaching_mode] || parsed.teaching_mode) + '</span>';
    }
    if (parsed.next_action) {
      html += '<span class="meta-tag meta-action">' + (NEXT_ACTION_LABELS[parsed.next_action] || parsed.next_action) + '</span>';
    }
    if (parsed.hint_level > 0) {
      html += '<span class="meta-tag meta-hint">💡 提示等级 ' + parsed.hint_level + '/3</span>';
    }
    if (parsed.misconception_check && parsed.misconception_check.length > 0) {
      html += '<span class="meta-tag meta-warning">⚠️ 检查误解</span>';
    }
    html += '</div>';

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

    if (parsed.visual && parsed.visual.type !== 'none') {
      const visualContainer = el.parentElement;
      try {
        VisualEngine.render(visualContainer, parsed.visual.type, parsed.visual.data || {});
      } catch (e) {
        console.error('Visual render error:', e);
      }
    }

    scrollToBottom();
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      chatArea.scrollTop = chatArea.scrollHeight;
    });
  }

  init();
})();
