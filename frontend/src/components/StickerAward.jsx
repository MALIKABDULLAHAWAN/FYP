import React, { useState, useEffect, useMemo } from 'react';
import { Sticker3D, SuccessBurst } from './AmbientEffects';
import './StickerAward.css';

/**
 * StickerAward - The final reward of the Therapy Journey.
 * Lets the child choose a 3D sticker to keep in their collection.
 */
export default function StickerAward({ onFinish }) {
  const REWARD_POOL = useMemo(() => [
    { id: 'star_gold', emoji: '⭐', name: 'Super Star' },
    { id: 'trophy', emoji: '🏆', name: 'Champion' },
    { id: 'unicorn', emoji: '🦄', name: 'Magic Unicorn' },
    { id: 'rocket', emoji: '🚀', name: 'Space Hero' },
    { id: 'dino', emoji: '🦖', name: 'T-Rex Friend' },
    { id: 'heart', emoji: '💖', name: 'Kindness Heart' },
    { id: 'lion', emoji: '🦁', name: 'Brave Lion' },
    { id: 'cat', emoji: '🐱', name: 'Sweet Kitty' },
    { id: 'dog', emoji: '🐶', name: 'Happy Puppy' },
    { id: 'rabbit', emoji: '🐰', name: 'Jump Rabbit' },
    { id: 'bird', emoji: '🐦', name: 'Blue Bird' },
    { id: 'fish', emoji: '🐠', name: 'Gold Fish' },
    { id: 'bee', emoji: '🐝', name: 'Busy Bee' },
    { id: 'apple', emoji: '🍎', name: 'Red Apple' },
    { id: 'banana', emoji: '🍌', name: 'Yummy Banana' },
    { id: 'strawberry', emoji: '🍓', name: 'Berry Sweet' },
    { id: 'car', emoji: '🚗', name: 'Fast Car' },
    { id: 'boat', emoji: '⛵', name: 'Sail Boat' },
    { id: 'airplane', emoji: '✈️', name: 'High Sky' },
    { id: 'book', emoji: '📚', name: 'Wise Book' },
    { id: 'balloon', emoji: '🎈', name: 'Red Balloon' },
    { id: 'ice_cream', emoji: '🍦', name: 'Cold Cream' },
    { id: 'pizza', emoji: '🍕', name: 'Cheesy Pizza' },
    { id: 'gift', emoji: '🎁', name: 'Surprise Gift' },
  ], []);

  const [selected, setSelected] = useState(null);
  const [stickers, setStickers] = useState([]);

  useEffect(() => {
    // Pick 6 random stickers from the pool
    const shuffled = [...REWARD_POOL].sort(() => 0.5 - Math.random());
    setStickers(shuffled.slice(0, 6));
  }, [REWARD_POOL]);

  const handleSelect = (sticker) => {
    setSelected(sticker);
    
    // Save to local collection (Synced with StickerPack)
    const saved = JSON.parse(localStorage.getItem('dhyan_earned_stickers') || '[]');
    if (!saved.some(s => s.category === 'rewards' && s.key === sticker.id)) {
      saved.push({ 
        category: 'rewards', 
        key: sticker.id, 
        name: sticker.name,
        gainedAt: new Date().toISOString() 
      });
      localStorage.setItem('dhyan_earned_stickers', JSON.stringify(saved));
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
