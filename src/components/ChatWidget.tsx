import { useEffect, useState, useRef } from "react";

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Detect language
  const detectLanguage = () => {
    const lng = localStorage.getItem("lang");
    return lng ? lng.toLowerCase().substring(0, 2) : (navigator.language || "en").split("-")[0];
  };

  // Get iframe src
  const getIframeSrc = () => {
    const currentLang = detectLanguage();
    const sessionId = localStorage.getItem("echo_chat_session_id") || "";
    return `https://chat.echoai.so/chat/cm4sih8xr0001js04yiff5c0s?theme=dark&sessionId=${sessionId}&lng=${currentLang}`;
  };

  // Detect host site theme
  const detectHostTheme = () => {
    return document.documentElement.classList.contains("dark");
  };

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(detectHostTheme());
    };

    updateTheme();

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", updateTheme);

    // Handle iframe messages for closing
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === "ECHO_CLOSE_CHAT") {
        setIsOpen(false);
      }
    };
    window.addEventListener("message", handleMessage);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", updateTheme);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const iframe = iframeRef.current;
      const toggle = document.getElementById("echo-chat-toggle");
      if (
        iframe &&
        !iframe.contains(e.target as Node) &&
        toggle &&
        !toggle.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isOpen]);

  return (
    <div id="echo-chat-widget">
      {/* Toggle Button */}
      <button
        id="echo-chat-toggle"
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-5 right-5 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer z-[9998] border-0 shadow-lg transition-all duration-300 hover:scale-110 ${
          isDark
            ? "bg-white shadow-[0_4px_20px_rgba(255,255,255,0.3)]"
            : "bg-[#1a1a2e] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
        }`}
        style={{ display: isOpen ? "none" : "flex" }}
        aria-label="Open chat"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 191 143"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M95.5 0C42.7568 0 0 35.8935 0 80.1875C0 102.339 10.7045 122.389 28.1136 136.949C27.1477 138.356 25.9159 139.766 24.4182 141.113C23.4523 141.985 22.4864 142.633 21.9205 142.97C21.6375 143.194 21.4375 143.194 21.3545 143.194C20.9716 143.194 20.6716 142.97 20.5057 142.633C20.3057 142.297 20.2727 141.873 20.4557 141.537C20.4557 141.425 20.5387 141.313 20.5387 141.201C20.6217 141.089 20.7876 140.752 20.9876 140.303C21.4375 139.43 22.0034 138.109 22.4864 136.5C23.4193 133.394 24.1352 129.39 23.0363 126.06C8.80871 113.043 0 95.3998 0 76.183C0.0829659 34.2364 42.7898 0.111832 95.533 0.000976562L95.5 0ZM95.5 6.41705C46.4205 6.41705 6.59091 38.3535 6.59091 77.0538C6.59091 95.1751 15.3011 111.946 30.1443 124.739L33.1733 127.397L32.2074 131.401C31.3074 135.069 30.0756 138.512 28.4119 141.649C32.4733 138.4 36.0687 134.508 38.4318 130.504L40.4972 127.06L44.4756 128.269C60.5835 133.17 78.0256 135.716 95.5 135.716C144.58 135.716 184.409 103.779 184.409 65.0789C184.409 26.3786 144.58 6.41705 95.5 6.41705Z"
            fill={isDark ? "#1a1a2e" : "white"}
          />
        </svg>
      </button>

      {/* Chat Iframe */}
      <iframe
        ref={iframeRef}
        id="echo-chat-iframe"
        src={getIframeSrc()}
        title="Echo AI Chat"
        allow="clipboard-write"
        className={`fixed z-[9999] border-0 transition-all duration-300 ease-out ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-full pointer-events-none"
        } bottom-5 right-5 w-[400px] h-[600px] max-h-[80vh] rounded-2xl shadow-2xl md:w-[400px] md:h-[600px] md:bottom-5 md:right-5 md:rounded-2xl max-md:w-screen max-md:h-screen max-md:rounded-none max-md:top-0 max-md:left-0 max-md:right-0 max-md:bottom-0 max-md:max-h-none`}
        style={{ display: isOpen ? "block" : "none" }}
      />
    </div>
  );
};
