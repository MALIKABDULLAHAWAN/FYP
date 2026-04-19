import React, { useState } from 'react';
import { Sticker3D, SuccessBurst } from './AmbientEffects';
import './StickerAward.css';

/**
 * StickerAward - The final reward of the Therapy Journey.
 * Lets the child choose a 3D sticker to keep in their collection.
 */
export default function StickerAward({ onFinish }) {
  const [selected, setSelected] = useState(null);
  
  const stickers = [
    { id: 'star_gold', emoji: '⭐', name: 'Super Star' },
    { id: 'trophy', emoji: '🏆', name: 'Champion' },
    { id: 'unicorn', emoji: '🦄', name: 'Magic Unicorn' },
    { id: 'rocket', emoji: '🚀', name: 'Space Hero' },
    { id: 'dino', emoji: '🦖', name: 'T-Rex Friend' },
    { id: 'heart', emoji: '💖', name: 'Kindness Heart' }
  ];

  const handleSelect = (sticker) => {
    setSelected(sticker);
    
    // Save to local collection
    const saved = JSON.parse(localStorage.getItem('my_stickers') || '[]');
    if (!saved.some(s => s.id === sticker.id)) {
      saved.push({ ...sticker, gainedAt: new Date().toISOString() });
      localStorage.setItem('my_stickers', JSON.stringify(saved));
    }

    const speak = (text) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.1;
      window.speechSynthesis.speak(u);
    };
    speak(`Yay! You chose the ${sticker.name}! It's so cool. I'll keep it safe in your sticker book!`);

    setTimeout(() => {
      onFinish();
    }, 3000);
  };

  return (
    <div className="sticker-award-overlay">
      <SuccessBurst />
      
      <div className="sticker-award-content">
        <h1 className="award-title">Reward Time! 🎁</h1>
        <p className="award-subtitle">You worked so hard. Pick a sticker for your book!</p>

        <div className="sticker-grid">
          {stickers.map((s) => (
            <div 
              key={s.id} 
              className={`sticker-choice-card ${selected?.id === s.id ? 'selected' : ''}`}
              onClick={() => !selected && handleSelect(s)}
            >
              <div className="sticker-3d-wrapper">
                <Sticker3D emoji={s.emoji} size={100} />
              </div>
              <span className="sticker-name">{s.name}</span>
            </div>
          ))}
        </div>

        {selected && (
          <div className="celebration-text">
            <h2>Added to your collection! ✨</h2>
          </div>
        )}
      </div>
    </div>
  );
}
