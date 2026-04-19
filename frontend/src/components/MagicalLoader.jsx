import React from 'react';
import { motion } from 'framer-motion';
import { AmbientParticles, FloatingOrbs } from './AmbientEffects';

const MagicalLoader = () => {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7ff 0%, #c3cfe2 100%)',
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 20000
    }}>
      <AmbientParticles />
      <FloatingOrbs count={3} />
      
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          fontSize: '80px',
          marginBottom: '30px',
          filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.4))'
        }}
      >
        ✨
      </motion.div>

      <div style={{
        padding: '20px 40px',
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        borderRadius: '30px',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
        textAlign: 'center'
      }}>
        <h2 style={{
          margin: 0,
          fontFamily: "'Nunito', sans-serif",
          color: '#4F46E5',
          fontSize: '24px',
          fontWeight: 800
        }}>
          Preparing Magic...
        </h2>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            height: '4px',
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            borderRadius: '2px',
            marginTop: '15px'
          }}
        />
        <p style={{
          marginTop: '10px',
          color: '#6366f1',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '1px'
        }}>
          APOTHEOSIS ACTIVE
        </p>
      </div>
    </div>
  );
};

export default MagicalLoader;
