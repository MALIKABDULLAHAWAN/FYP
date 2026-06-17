import React, { useState, useEffect } from 'react';
import UiIcon from './ui/UiIcon';

const VoiceSettings = ({ isOpen, onClose, compact = false }) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    // Load settings from localStorage
    const savedEnabled = localStorage.getItem('voice_enabled');
    const savedVolume = localStorage.getItem('voice_volume');
    const savedLanguage = localStorage.getItem('voice_language');
    
    if (savedEnabled !== null) setIsEnabled(savedEnabled === 'true');
    if (savedVolume !== null) setVolume(parseFloat(savedVolume));
    if (savedLanguage !== null) setLanguage(savedLanguage);
  }, [isOpen]);

  const handleEnabledChange = (enabled) => {
    setIsEnabled(enabled);
    localStorage.setItem('voice_enabled', enabled.toString());
    if (enabled) {
      speakText('Voice enabled');
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    localStorage.setItem('voice_volume', newVolume.toString());
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('voice_language', newLanguage);
    const testMessage = newLanguage === 'ur' ? 'آواز کی زبان تبدیل ہو گئی' : 'Voice language changed';
    speakText(testMessage);
  };

  const speakText = (text) => {
    if (!isEnabled || typeof window === "undefined") return;
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = volume;
      
      if (language === "ur") {
        utterance.lang = "ur-PK";
      } else {
        utterance.lang = "en-US";
      }

      synth.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  const testVoice = () => {
    const testMessage = language === 'ur' 
      ? 'یہ آواز کا ٹیسٹ ہے۔ آپ مجھے سن سکتے ہیں؟' 
      : 'This is a voice test. Can you hear me?';
    speakText(testMessage);
  };

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <button
          onClick={() => handleEnabledChange(!isEnabled)}
          style={{
            background: isEnabled ? '#10B981' : '#6B7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 8px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          <UiIcon name={isEnabled ? "volume-2" : "volume-x"} size={16} />
        </button>
        
        {isEnabled && (
          <>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              style={{ width: '60px' }}
            />
            
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              style={{
                padding: '4px 6px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                fontSize: '12px',
                background: 'white'
              }}
            >
              <option value="en">EN</option>
              <option value="ur">UR</option>
            </select>
          </>
        )}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: '#1F2937', fontSize: '18px', fontWeight: '700' }}>
            🎙️ Voice Settings
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <UiIcon name="x" size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Enable/Disable Voice */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontWeight: '600', color: '#374151' }}>
              Enable Voice
            </label>
            <button
              onClick={() => handleEnabledChange(!isEnabled)}
              style={{
                background: isEnabled ? '#10B981' : '#6B7280',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UiIcon name={isEnabled ? "volume-2" : "volume-x"} size={16} />
              {isEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          {isEnabled && (
            <>
              {/* Volume Control */}
              <div>
                <label style={{ fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Volume: {Math.round(volume * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#E5E7EB',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              {/* Language Selection */}
              <div>
                <label style={{ fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
                  Language
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `2px solid ${language === 'en' ? '#6366F1' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      background: language === 'en' ? '#EEF2FF' : 'white',
                      color: language === 'en' ? '#6366F1' : '#6B7280',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleLanguageChange('ur')}
                    style={{
                      flex: 1,
                      padding: '10px',
                      border: `2px solid ${language === 'ur' ? '#6366F1' : '#E5E7EB'}`,
                      borderRadius: '8px',
                      background: language === 'ur' ? '#EEF2FF' : 'white',
                      color: language === 'ur' ? '#6366F1' : '#6B7280',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    اردو
                  </button>
                </div>
              </div>

              {/* Test Voice Button */}
              <button
                onClick={testVoice}
                style={{
                  background: '#6366F1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <UiIcon name="play" size={16} />
                Test Voice
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceSettings;