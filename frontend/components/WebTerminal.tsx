import React, { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css'; // 務必引入 CSS，不然終端機樣式會爛掉

const WebTerminal = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    // 防止 React Strict Mode 重複渲染導致開啟兩個終端機
    if (termInstance.current) return;

    // 1. 初始化 xterm
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"Menlo", "Monaco", "Consolas", "Courier New", monospace',
      theme: {
        background: '#1a1b23', // 配合 Dark Mode 背景色
        foreground: '#ffffff',
      },
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    // 掛載到 DOM
    if (terminalRef.current) {
      term.open(terminalRef.current);
      // 延遲 fit 確保 DOM 完全渲染
      setTimeout(() => {
        fitAddon.fit();
      }, 50);
    }
    
    termInstance.current = term;

    // 2. 建立 WebSocket 連線到後端 (使用相對路徑，透過 Vite proxy)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/terminal`);
    wsRef.current = ws;

    ws.onopen = () => {
      term.writeln('\x1b[1;32mConnected to Hashi Backend Terminal...\x1b[0m');
      term.writeln('---------------------------------------------');
      
      // 連線後立即發送終端機大小
      setTimeout(() => {
        if (fitAddonRef.current) {
          fitAddonRef.current.fit();
        }
        if (term.cols && term.rows) {
          ws.send(JSON.stringify({ 
            type: 'resize', 
            cols: term.cols, 
            rows: term.rows 
          }));
        }
      }, 100);
    };

    ws.onmessage = (event) => {
      // 收到後端傳來的 Bash 輸出 -> 寫入終端機
      term.write(event.data);
    };

    ws.onclose = () => {
      term.writeln('\r\n\x1b[1;31mConnection Closed.\x1b[0m');
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
      term.writeln('\r\n\x1b[1;31mConnection Error.\x1b[0m');
    };

    // 3. 綁定輸入事件 (前端打字 -> 送給後端)
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });

    // 4. 發送終端機大小到後端的函數
    const sendResize = () => {
      if (ws.readyState === WebSocket.OPEN && term.cols && term.rows) {
        // 發送 resize 指令給後端，格式: \x1b[8;{rows};{cols}t 或自定義 JSON
        // 這裡使用 JSON 格式，後端需要解析
        ws.send(JSON.stringify({ 
          type: 'resize', 
          cols: term.cols, 
          rows: term.rows 
        }));
      }
    };

    // 5. 處理視窗大小調整
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        sendResize();
      }
    };
    window.addEventListener('resize', handleResize);

    // 監聽終端機大小變化事件
    term.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    });

    // 使用 ResizeObserver 監聽容器大小變化
    const resizeObserver = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
        // onResize 事件會自動觸發，不需要在這裡再次 sendResize
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      term.dispose();
      termInstance.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="w-full h-full bg-[#1a1b23] rounded-lg border border-gray-800 overflow-hidden"
      style={{ minHeight: '500px', height: 'calc(100vh - 250px)' }}
    >
      <div 
        ref={terminalRef} 
        className="w-full h-full [&_.xterm]:h-full [&_.xterm-viewport]:h-full [&_.xterm-screen]:h-full"
      />
    </div>
  );
};

export default WebTerminal;