import { useEffect } from "react";

export const ChatWidget = () => {
  useEffect(() => {
    // Check if widget already exists
    if (document.getElementById("echo-chat-widget")) return;

    // Create the widget HTML
    const widgetDiv = document.createElement("div");
    widgetDiv.id = "echo-chat-widget";
    widgetDiv.innerHTML = `
      <button id="echo-chat-toggle" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #1a1a2e;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 9998;
        transition: transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="28" height="28" viewBox="0 0 191 143" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M95.5 0C42.7568 0 0 35.8935 0 80.1875C0 102.339 10.7045 122.389 28.1136 136.949C27.1477 138.356 25.9159 139.766 24.4182 141.113C23.4523 141.985 22.4864 142.633 21.9205 142.97C21.6375 143.194 21.4375 143.194 21.3545 143.194C20.9716 143.194 20.6716 142.97 20.5057 142.633C20.3057 142.297 20.2727 141.873 20.4557 141.537C20.4557 141.425 20.5387 141.313 20.5387 141.201C20.6217 141.089 20.7876 140.752 20.9876 140.303C21.4375 139.43 22.0034 138.109 22.4864 136.5C23.4193 133.394 24.1352 129.39 23.0363 126.06C8.80871 113.043 0 95.3998 0 76.183C0.0829659 34.2364 42.7898 0.111832 95.533 0.000976562L95.5 0ZM95.5 6.41705C46.4205 6.41705 6.59091 38.3535 6.59091 77.0538C6.59091 95.1751 15.3011 111.946 30.1443 124.739L33.1733 127.397L32.2074 131.401C31.3074 135.069 30.0756 138.512 28.4119 141.649C32.4733 138.4 36.0687 134.508 38.4318 130.504L40.4972 127.06L44.4756 128.269C60.5835 133.17 78.0256 135.716 95.5 135.716C144.58 135.716 184.409 103.779 184.409 65.0789C184.409 26.3786 144.58 6.41705 95.5 6.41705Z" fill="white"/>
        </svg>
      </button>

      <iframe 
        id="echo-chat-iframe"
        src="https://echo-ai-chat.lovable.app/?theme=dark"
        style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 400px;
          height: 600px;
          max-height: 80vh;
          border: none;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
          z-index: 9999;
          display: none;
          opacity: 0;
          transform: translateY(100%);
          transition: opacity 0.3s ease, transform 0.3s ease;
        "
        allow="clipboard-write"
      ></iframe>

      <style>
        .echo-chat-toggle-dark {
          background: #ffffff !important;
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.3) !important;
        }
        .echo-chat-toggle-dark svg path {
          fill: #1a1a2e !important;
        }
        @media (max-width: 768px) {
          #echo-chat-iframe {
            width: 100vw !important;
            height: 100vh !important;
            border-radius: 0 !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            position: fixed !important;
          }
        }
      </style>
    `;

    document.body.appendChild(widgetDiv);

    // Create and execute the script
    const script = document.createElement("script");
    script.textContent = `
      (function() {
        const chatToggle = document.getElementById('echo-chat-toggle');
        const chatIframe = document.getElementById('echo-chat-iframe');
        
        let isOpen = false;
        let currentTheme = null;

        function detectLanguage() {
          const lng = localStorage.getItem('i18nextLng');
          return lng ? lng.split('-')[0] : (navigator.language || 'en').split('-')[0];
        }

        function updateIframeSrc() {
          const currentLang = detectLanguage();
          const currentSrc = chatIframe.getAttribute('src') || '';
          const baseUrl = currentSrc.split('?')[0];
          const sessionId = localStorage.getItem('echo_chat_session_id') || '';
          chatIframe.setAttribute('src', baseUrl + '?theme=dark&sessionId=' + sessionId + '&lng=' + currentLang);
        }

        function detectHostTheme() {
          if (document.documentElement.classList.contains('dark')) {
            return 'dark';
          }
          return 'light';
        }

        function updateButtonTheme() {
          const theme = detectHostTheme();
          
          if (theme === currentTheme) {
            return;
          }
          
          currentTheme = theme;
          
          if (theme === 'dark') {
            chatToggle.classList.add('echo-chat-toggle-dark');
          } else {
            chatToggle.classList.remove('echo-chat-toggle-dark');
          }
        }

        updateButtonTheme();
        updateIframeSrc();

        window.addEventListener('languageChanged', updateIframeSrc);

        const observer = new MutationObserver(() => {
          updateButtonTheme();
        });
        
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class', 'data-theme', 'style']
        });
        
        observer.observe(document.body, {
          attributes: true,
          attributeFilter: ['class', 'data-theme', 'style']
        });

        if (window.matchMedia) {
          window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateButtonTheme);
        }

        chatToggle.addEventListener('click', () => {
          if (!isOpen) {
            chatToggle.style.display = 'none';
            chatIframe.style.display = 'block';
            setTimeout(() => {
              chatIframe.style.opacity = '1';
              chatIframe.style.transform = 'translateY(0)';
            }, 10);
            isOpen = true;
          }
        });

        document.addEventListener('click', (e) => {
          if (isOpen && !chatIframe.contains(e.target) && !chatToggle.contains(e.target)) {
            chatIframe.style.opacity = '0';
            chatIframe.style.transform = 'translateY(100%)';
            setTimeout(() => {
              chatIframe.style.display = 'none';
              chatToggle.style.display = 'flex';
              isOpen = false;
            }, 300);
          }
        });

        window.addEventListener('message', (event) => {
          if (event.data.type === 'ECHO_CLOSE_CHAT') {
            chatIframe.style.opacity = '0';
            chatIframe.style.transform = 'translateY(100%)';
            setTimeout(() => {
              chatIframe.style.display = 'none';
              chatToggle.style.display = 'flex';
              isOpen = false;
            }, 300);
          }
        });
      })();
    `;
    document.body.appendChild(script);

    // Cleanup on unmount
    return () => {
      const widget = document.getElementById("echo-chat-widget");
      if (widget) widget.remove();
      script.remove();
    };
  }, []);

  return null;
};
