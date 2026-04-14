/**
 * AI Agent Panel - Multi-Agent Interface
 * Allows switching between different AI agents
 */

import { useState, useRef, useEffect } from 'react';
import { callGroqAI, getAllAIAgents, getAIAgent, isAIConfigured } from '../services/aiService';

export default function AIAgentPanel({ initialAgent = "gameHelper", onClose }) {
  const [selectedAgent, setSelectedAgent] = useState(initialAgent);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [aiConfigured, setAiConfigured] = useState(false);
  const messagesEndRef = useRef(null);

  const agents = getAllAIAgents();
  const currentAgent = getAIAgent(selectedAgent);

  useEffect(() => {
    setAiConfigured(isAIConfigured());
    // Add welcome message
    setMessages([{
      role: "assistant",
      content: `Hi! I'm ${currentAgent.name} ${currentAgent.avatar}! How can I help you today?`,
      timestamp: new Date()
    }]);
  }, [selectedAgent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Prepare conversation history
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await callGroqAI(inputMessage, selectedAgent, history);

      const aiMessage = {
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Oops! I'm having trouble connecting right now. Let me try again! 🔄",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const switchAgent = (agentKey) => {
    setSelectedAgent(agentKey);
    setMessages([]);
  };

  if (!isExpanded) {
    return (
      <button 
        className="ai-companion-minimized"
        onClick={() => setIsExpanded(true)}
        style={{
          position: "fixed",
          bottom: "100px",
          right: "30px",
          width: "60px",
          height: "60px",
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${currentAgent.color}, ${currentAgent.color}dd)`,
          border: "none",
          boxShadow: `0 6px 20px ${currentAgent.color}66`,
          cursor: "pointer",
          fontSize: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          animation: "aiFloat 3s ease-in-out infinite"
        }}
      >
        {currentAgent.avatar}
      </button>
    );
  }

  return (
    <div className="ai-agent-panel" style={{
      position: "fixed",
      bottom: "20px",
      right: "20px",
      width: "380px",
      maxHeight: "600px",
      background: "rgba(255, 255, 255, 0.95)",
      backdropFilter: "blur(20px)",
      borderRadius: "24px",
      boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
      border: "2px solid rgba(255, 255, 255, 0.8)",
      zIndex: 1000,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden"
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${currentAgent.color}, ${currentAgent.color}dd)`,
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "32px" }}>{currentAgent.avatar}</span>
          <div>
            <h3 style={{ 
              margin: 0, 
              color: "white", 
              fontFamily: "var(--font-fun)",
              fontSize: "18px",
              fontWeight: 700
            }}>
              {currentAgent.name}
            </h3>
            <p style={{ 
              margin: 0, 
              color: "rgba(255,255,255,0.9)", 
              fontSize: "12px" 
            }}>
              {aiConfigured ? "AI Powered 🤖" : "Demo Mode ✨"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              color: "white",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            −
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                color: "white",
                fontSize: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Agent Selector */}
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        display: "flex",
        gap: "8px",
        overflowX: "auto"
      }}>
        {agents.map((agent) => (
          <button
            key={agent.key}
            onClick={() => switchAgent(agent.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              borderRadius: "20px",
              border: "none",
              background: selectedAgent === agent.key ? agent.color : "#f0f0f0",
              color: selectedAgent === agent.key ? "white" : "#666",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-fun)",
              whiteSpace: "nowrap",
              transition: "all 0.3s ease"
            }}
          >
            <span>{agent.avatar}</span>
            <span>{agent.name}</span>
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        padding: "16px",
        overflowY: "auto",
        maxHeight: "350px",
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}>
        {!aiConfigured && (
          <div style={{
            background: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: "12px",
            padding: "12px",
            fontSize: "12px",
            color: "#856404"
          }}>
            ⚠️ AI not fully configured. Add your Groq API key to .env file for full AI power!
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              alignSelf: message.role === "user" ? "flex-end" : "flex-start",
              background: message.role === "user" 
                ? `linear-gradient(135deg, ${currentAgent.color}, ${currentAgent.color}dd)`
                : "#f8f9fa",
              color: message.role === "user" ? "white" : "#2c3e50",
              padding: "12px 16px",
              borderRadius: message.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
              maxWidth: "80%",
              fontSize: "14px",
              lineHeight: 1.5,
              fontFamily: "var(--font-fun)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
            }}
          >
            {message.content}
          </div>
        ))}
        
        {isLoading && (
          <div style={{
            alignSelf: "flex-start",
            background: "#f8f9fa",
            padding: "16px 20px",
            borderRadius: "18px 18px 18px 4px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <div className="ai-thinking-dots">
              <span style={{
                width: "8px",
                height: "8px",
                background: currentAgent.color,
                borderRadius: "50%",
                display: "inline-block",
                animation: "thinkingBounce 1.4s ease-in-out infinite"
              }}></span>
              <span style={{
                width: "8px",
                height: "8px",
                background: currentAgent.color,
                borderRadius: "50%",
                display: "inline-block",
                animation: "thinkingBounce 1.4s ease-in-out infinite 0.2s"
              }}></span>
              <span style={{
                width: "8px",
                height: "8px",
                background: currentAgent.color,
                borderRadius: "50%",
                display: "inline-block",
                animation: "thinkingBounce 1.4s ease-in-out infinite 0.4s"
              }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "16px",
        borderTop: "1px solid rgba(0,0,0,0.1)",
        display: "flex",
        gap: "8px"
      }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Ask ${currentAgent.name} anything...`}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: "24px",
            border: "2px solid #e9ecef",
            fontSize: "14px",
            fontFamily: "var(--font-fun)",
            outline: "none"
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={isLoading || !inputMessage.trim()}
          style={{
            padding: "12px 20px",
            borderRadius: "24px",
            border: "none",
            background: `linear-gradient(135deg, ${currentAgent.color}, ${currentAgent.color}dd)`,
            color: "white",
            fontSize: "20px",
            cursor: isLoading ? "not-allowed" : "pointer",
            opacity: isLoading || !inputMessage.trim() ? 0.6 : 1
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

// Simple AI Button for quick access
export function AIAgentButton({ onClick, agentKey = "gameHelper" }) {
  const agent = getAIAgent(agentKey);
  
  return (
    <button
      onClick={onClick}
      className="ai-agent-floating-btn"
      style={{
        position: "fixed",
        bottom: "100px",
        right: "30px",
        width: "65px",
        height: "65px",
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${agent.color}, ${agent.color}dd)`,
        border: "none",
        boxShadow: `0 8px 25px ${agent.color}66, 0 0 20px ${agent.color}33`,
        cursor: "pointer",
        fontSize: "32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999,
        animation: "aiFloat 3s ease-in-out infinite, aiGlow 2s ease-in-out infinite alternate"
      }}
      title={`Chat with ${agent.name}`}
    >
      {agent.avatar}
    </button>
  );
}
