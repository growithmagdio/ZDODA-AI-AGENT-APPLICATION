import { WidgetConfigV1 } from '@zdoda/shared';

export interface MountWidgetOptions {
  mode: 'live' | 'preview';
}

export interface WidgetInstance {
  update: (config: WidgetConfigV1) => void;
  destroy: () => void;
  open: () => void;
  close: () => void;
}

/**
 * Mounts the authentic iPhone-styled Zdoda Chat Widget inside a Shadow DOM.
 * Features clear liquid glass launcher, mobile bottom sheet detents,
 * iMessage-like bubbles, staggered typing indicator, and morphing composer send button.
 */
export function mountWidget(
  container: HTMLElement,
  config: WidgetConfigV1,
  options: MountWidgetOptions = { mode: 'preview' }
): WidgetInstance {
  let currentConfig = { ...config };
  let isOpen = false;
  let isTyping = false;

  // 1. Create or attach Shadow DOM
  const shadow = container.shadowRoot || container.attachShadow({ mode: 'open' });
  shadow.innerHTML = '';

  // 2. Define Shadow DOM styles (Scoped, zero host leak)
  const styleEl = document.createElement('style');
  const primaryColor = currentConfig.theme?.primary || '#6538F5';

  styleEl.textContent = `
    :host {
      --primary: ${primaryColor};
      --surface: #ffffff;
      --surface-2: #f2f2f7;
      --bubble-bot: #e9e9eb;
      --ink: #000000;
      --ink-secondary: #8e8e93;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }

    /* Clear Liquid Glass Launcher */
    .zd-launcher {
      position: fixed;
      bottom: calc(env(safe-area-inset-bottom, 0px) + 20px);
      right: 20px;
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 14px 6px 6px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.45);
      backdrop-filter: blur(20px) saturate(1.5);
      -webkit-backdrop-filter: blur(20px) saturate(1.5);
      border: 1px solid rgba(255, 255, 255, 0.6);
      box-shadow: 0 8px 32px -8px rgba(21, 21, 59, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.2s ease;
      user-select: none;
    }

    .zd-launcher:active {
      transform: scale(0.95);
      filter: brightness(1.08);
    }

    .zd-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: var(--primary);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 17px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .zd-launcher-text {
      font-size: 14px;
      font-weight: 600;
      color: #1c1c1e;
    }

    /* Chat Container / Bottom Sheet */
    .zd-container {
      position: fixed;
      bottom: 0;
      right: 0;
      width: 100%;
      height: 90vh;
      max-height: 720px;
      z-index: 100000;
      display: none;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(28px) saturate(1.6);
      -webkit-backdrop-filter: blur(28px) saturate(1.6);
      border-top-left-radius: 32px;
      border-top-right-radius: 32px;
      border: 1px solid rgba(255, 255, 255, 0.7);
      box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.25s ease;
      transform: translateY(100%);
    }

    @media (min-width: 640px) {
      .zd-container {
        bottom: 80px;
        right: 24px;
        width: 380px;
        height: 600px;
        border-radius: 28px;
        transform: translateY(20px) scale(0.95);
        opacity: 0;
      }
    }

    .zd-container.is-open {
      display: flex;
      transform: translateY(0) scale(1);
      opacity: 1;
    }

    /* Sheet Grabber (Mobile) */
    .zd-grabber {
      width: 36px;
      height: 5px;
      border-radius: 999px;
      background: rgba(60, 60, 67, 0.3);
      margin: 10px auto 4px auto;
    }

    /* Header */
    .zd-header {
      padding: 10px 18px 12px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(60, 60, 67, 0.1);
    }

    .zd-header-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .zd-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 15px;
    }

    .zd-header-title {
      font-size: 15px;
      font-weight: 600;
      color: #1c1c1e;
    }

    .zd-header-status {
      font-size: 11px;
      color: #34c759;
      font-weight: 500;
    }

    .zd-close-btn {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(142, 142, 147, 0.16);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #3c3c43;
      font-size: 15px;
    }

    /* Messages Stream (iMessage Style) */
    .zd-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .zd-msg-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .zd-msg {
      max-width: 80%;
      padding: 9px 14px;
      font-size: 14px;
      line-height: 1.4;
      border-radius: 18px;
      word-break: break-word;
    }

    .zd-msg.bot {
      align-self: flex-start;
      background: var(--bubble-bot);
      color: #000000;
      border-bottom-left-radius: 4px;
    }

    .zd-msg.user {
      align-self: flex-end;
      background: var(--primary);
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }

    /* Staggered Spring Typing Indicator */
    .zd-typing {
      display: none;
      align-self: flex-start;
      background: var(--bubble-bot);
      padding: 10px 14px;
      border-radius: 18px;
      border-bottom-left-radius: 4px;
      gap: 4px;
      align-items: center;
    }

    .zd-typing.active {
      display: flex;
    }

    .zd-typing-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #8e8e93;
      animation: zd-pulse 1.2s infinite ease-in-out;
    }

    .zd-typing-dot:nth-child(2) { animation-delay: 0.2s; }
    .zd-typing-dot:nth-child(3) { animation-delay: 0.4s; }

    @keyframes zd-pulse {
      0%, 100% { transform: scale(0.8); opacity: 0.5; }
      50% { transform: scale(1.2); opacity: 1; }
    }

    /* Quick Replies Carousel */
    .zd-quick-replies {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 8px 16px;
      scrollbar-width: none;
    }

    .zd-quick-replies::-webkit-scrollbar { display: none; }

    .zd-chip {
      white-space: nowrap;
      padding: 7px 14px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(0, 0, 0, 0.08);
      font-size: 13px;
      font-weight: 500;
      color: var(--primary);
      cursor: pointer;
      transition: background 0.15s ease, transform 0.15s ease;
    }

    .zd-chip:active {
      transform: scale(0.96);
      background: rgba(0, 0, 0, 0.05);
    }

    /* Glass Composer */
    .zd-composer {
      padding: 8px 14px calc(env(safe-area-inset-bottom, 0px) + 8px) 14px;
      border-top: 1px solid rgba(60, 60, 67, 0.1);
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .zd-input {
      flex: 1;
      height: 38px;
      padding: 0 14px;
      border-radius: 999px;
      border: 1px solid rgba(60, 60, 67, 0.2);
      background: #ffffff;
      font-size: 16px; /* stops iOS auto-zoom */
      color: #000;
      outline: none;
    }

    .zd-input:focus {
      border-color: var(--primary);
    }

    .zd-send-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--primary);
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .zd-send-btn:active {
      transform: scale(0.9);
    }

    /* Morphing icon inside send button (mic vs arrow) */
    .zd-icon-arrow, .zd-icon-mic {
      width: 18px;
      height: 18px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `;
  shadow.appendChild(styleEl);

  // 3. Construct HTML DOM
  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <!-- Launcher -->
    <div class="zd-launcher" id="zd-launcher" role="button" aria-label="Open chat with ${currentConfig.brand.botName}">
      <div class="zd-avatar">${currentConfig.brand.botName.charAt(0)}</div>
      <span class="zd-launcher-text">Chat with us</span>
    </div>

    <!-- Chat Sheet -->
    <div class="zd-container" id="zd-container" role="dialog" aria-modal="true">
      <div class="zd-grabber"></div>
      
      <!-- Header -->
      <div class="zd-header">
        <div class="zd-header-info">
          <div class="zd-header-avatar">${currentConfig.brand.botName.charAt(0)}</div>
          <div>
            <div class="zd-header-title">${currentConfig.brand.botName}</div>
            <div class="zd-header-status">● Typically replies instantly</div>
          </div>
        </div>
        <button class="zd-close-btn" id="zd-close" aria-label="Close chat">✕</button>
      </div>

      <!-- Messages Stream -->
      <div class="zd-messages" id="zd-messages">
        <div class="zd-msg-group">
          <div class="zd-msg bot">
            ${currentConfig.texts?.welcomeMessage || "Hi! Welcome to Smile Dental Clinic. How can I assist you with your dental care today?"}
          </div>
        </div>
        <div class="zd-typing" id="zd-typing">
          <div class="zd-typing-dot"></div>
          <div class="zd-typing-dot"></div>
          <div class="zd-typing-dot"></div>
        </div>
      </div>

      <!-- Quick Replies -->
      <div class="zd-quick-replies" id="zd-quick-replies">
        <button class="zd-chip" data-text="Book an appointment">Book appointment</button>
        <button class="zd-chip" data-text="Pricing & Services">Pricing & Services</button>
        <button class="zd-chip" data-text="Clinic Hours & Location">Hours & Location</button>
      </div>

      <!-- Composer -->
      <div class="zd-composer">
        <input type="text" class="zd-input" id="zd-input" placeholder="Type a message..." enterkeyhint="send" />
        <button class="zd-send-btn" id="zd-send" aria-label="Send message">
          <svg class="zd-icon-mic" id="zd-icon-mic" viewBox="0 0 24 24">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          <svg class="zd-icon-arrow" id="zd-icon-arrow" style="display: none;" viewBox="0 0 24 24">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
    </div>
  `;
  shadow.appendChild(wrapper);

  // 4. Attach Listeners
  const launcher = shadow.getElementById('zd-launcher')!;
  const containerEl = shadow.getElementById('zd-container')!;
  const closeBtn = shadow.getElementById('zd-close')!;
  const inputEl = shadow.getElementById('zd-input') as HTMLInputElement;
  const sendBtn = shadow.getElementById('zd-send')!;
  const micIcon = shadow.getElementById('zd-icon-mic')!;
  const arrowIcon = shadow.getElementById('zd-icon-arrow')!;
  const messagesEl = shadow.getElementById('zd-messages')!;
  const typingEl = shadow.getElementById('zd-typing')!;
  const chips = shadow.querySelectorAll('.zd-chip');

  const openWidget = () => {
    isOpen = true;
    containerEl.classList.add('is-open');
    launcher.style.display = 'none';
  };

  const closeWidget = () => {
    isOpen = false;
    containerEl.classList.remove('is-open');
    launcher.style.display = 'flex';
  };

  launcher.addEventListener('click', openWidget);
  closeBtn.addEventListener('click', closeWidget);

  // Input text change: morph between mic and arrow
  inputEl.addEventListener('input', () => {
    const hasText = inputEl.value.trim().length > 0;
    micIcon.style.display = hasText ? 'none' : 'block';
    arrowIcon.style.display = hasText ? 'block' : 'none';
  });

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    // Append user message
    const userMsg = document.createElement('div');
    userMsg.className = 'zd-msg user';
    userMsg.textContent = text;
    messagesEl.insertBefore(userMsg, typingEl);

    inputEl.value = '';
    micIcon.style.display = 'block';
    arrowIcon.style.display = 'none';
    messagesEl.scrollTop = messagesEl.scrollHeight;

    // Simulate bot response with typing indicator
    typingEl.classList.add('active');
    setTimeout(() => {
      typingEl.classList.remove('active');
      const botMsg = document.createElement('div');
      botMsg.className = 'zd-msg bot';
      botMsg.textContent = "Thank you for reaching out! A member of our dental team or our assistant will help you right away.";
      messagesEl.insertBefore(botMsg, typingEl);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }, 1200);
  };

  sendBtn.addEventListener('click', () => {
    sendMessage(inputEl.value);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage(inputEl.value);
    }
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const text = chip.getAttribute('data-text') || '';
      sendMessage(text);
    });
  });

  return {
    update: (newConfig: WidgetConfigV1) => {
      currentConfig = { ...newConfig };
    },
    destroy: () => {
      shadow.innerHTML = '';
    },
    open: openWidget,
    close: closeWidget,
  };
}
