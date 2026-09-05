import React, { useState, useRef, useEffect } from 'react';
import { getStreamingAiTutorUrl, getAuthToken } from '../services/api';
import { Send, Bot, User, Loader2, StopCircle } from 'lucide-react';

const AITutor = () => {
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm your StudyPilot AI Tutor. How can I help you today?", type: 'final' }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helper to extract clean text from dirty JSON fragments streaming in
  const extractTextFromAccumulatedJson = (raw) => {
    let display = raw;
    if (display.includes('"response":"')) {
      display = display.split('"response":"')[1];
    } else if (display.includes('"response": "')) {
      display = display.split('"response": "')[1];
    }
    
    if (display) {
      display = display.split('", "suggestions"')[0];
      display = display.split('","suggestions"')[0];
      // Basic unescaping for display
      display = display.replace(/\\n/g, '\n').replace(/\\"/g, '"');
      return display;
    }
    return ''; // Wait for more chunks if we haven't hit response yet
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage, type: 'final' }]);
    
    // Add temporary AI loading message
    setMessages(prev => [...prev, { role: 'ai', text: '', type: 'streaming' }]);
    setIsStreaming(true);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(getStreamingAiTutorUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ prompt: userMessage }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
        if (response.status === 401) throw new Error("Unauthorized. Please log in again.");
        throw new Error("Failed to connect to the AI Tutor.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedJsonString = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunkString = decoder.decode(value, { stream: true });
          const events = chunkString.split('\n\n');
          
          for (const eventStr of events) {
            if (!eventStr.trim()) continue;
            
            if (eventStr.startsWith('event: chunk')) {
              const dataLine = eventStr.split('\n').find(l => l.startsWith('data: '));
              if (dataLine) {
                const dataStr = dataLine.replace('data: ', '');
                try {
                  const dataObj = JSON.parse(dataStr);
                  accumulatedJsonString += dataObj.text;
                  
                  const textToDisplay = extractTextFromAccumulatedJson(accumulatedJsonString);
                  
                  if (textToDisplay) {
                    setMessages(prev => {
                      const newMsgs = [...prev];
                      newMsgs[newMsgs.length - 1].text = textToDisplay;
                      return newMsgs;
                    });
                  }
                } catch(e) {}
              }
            } 
            else if (eventStr.startsWith('event: done')) {
              const dataLine = eventStr.split('\n').find(l => l.startsWith('data: '));
              if (dataLine) {
                const dataStr = dataLine.replace('data: ', '');
                try {
                  const finalObj = JSON.parse(dataStr);
                  setMessages(prev => {
                    const newMsgs = [...prev];
                    // Create a beautiful final output merging response and suggestions
                    newMsgs[newMsgs.length - 1] = {
                      role: 'ai',
                      text: finalObj.response,
                      suggestions: finalObj.suggestions,
                      encouragement: finalObj.encouragement,
                      type: 'final'
                    };
                    return newMsgs;
                  });
                } catch(e) {}
              }
            }
            else if (eventStr.startsWith('event: error')) {
              const dataLine = eventStr.split('\n').find(l => l.startsWith('data: '));
              if (dataLine) {
                const dataObj = JSON.parse(dataLine.replace('data: ', ''));
                throw new Error(dataObj.error || "An error occurred during streaming.");
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].text += " [Stopped]";
          newMsgs[newMsgs.length - 1].type = 'final';
          return newMsgs;
        });
      } else {
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1] = { role: 'ai', text: err.message, type: 'error' };
          return newMsgs;
        });
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const cancelStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Bot className="text-blue-600" size={24} />
          AI Tutor (Streaming)
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
              <div className={`p-2 rounded-full flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`px-4 py-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-800 rounded-bl-none'} shadow-sm`}>
                {msg.type === 'streaming' && !msg.text ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin" /> Thinking...
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                )}
                
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Suggestions:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {msg.suggestions.map((s, i) => <li key={i} className="text-sm text-gray-700">{s}</li>)}
                    </ul>
                  </div>
                )}
                {msg.encouragement && (
                  <p className="mt-3 text-sm italic text-blue-600">{msg.encouragement}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isStreaming}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={cancelStream}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 w-24"
            >
              <StopCircle size={18} /> Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-24"
            >
              <Send size={18} /> Send
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AITutor;
