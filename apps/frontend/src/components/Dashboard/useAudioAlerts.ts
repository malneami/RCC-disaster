import { useCallback, useRef } from 'react';

export const useAudioAlerts = () => {
  const lastAlertTime = useRef<number>(0);
  const alertCooldown = 60 * 1000; // 1 minute cooldown

  const playAlert = useCallback((pathway: 'GENERAL' | 'STEMI' | 'STROKE' | 'TRAUMA') => {
    console.log(`🎵 Audio alert triggered for ${pathway}`);
    const now = Date.now();
    
    // Check if enough time has passed since last alert
    if (now - lastAlertTime.current < alertCooldown) {
      console.log(`⏰ Alert on cooldown, ${alertCooldown - (now - lastAlertTime.current)}ms remaining`);
      return;
    }

    lastAlertTime.current = now;
    console.log(`🔊 Playing audio alert for ${pathway}`);

    try {
      // Create audio context for sound generation
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log(`🎛️ Audio context created:`, audioContext);
      
      // Generate warning sound (beep pattern)
      const generateBeep = (frequency: number, duration: number, delay: number = 0) => {
        console.log(`🔔 Generating beep: ${frequency}Hz, ${duration}s, delay: ${delay}s`);
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + delay);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + delay);
        gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + delay + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + delay + duration);
        
        oscillator.start(audioContext.currentTime + delay);
        oscillator.stop(audioContext.currentTime + delay + duration);
      };

      // Play warning beep pattern
      console.log(`🔊 Starting beep sequence`);
      generateBeep(800, 0.2, 0);    // First beep
      generateBeep(800, 0.2, 0.3);  // Second beep
      generateBeep(800, 0.2, 0.6);  // Third beep

      // Use Web Speech API for voice alerts
      if ('speechSynthesis' in window) {
        console.log(`🗣️ Speech synthesis available`);
        const utterance = new SpeechSynthesisUtterance();
        
        if (pathway === 'STEMI') {
          utterance.text = 'STEMI Emergency! Critical time limit approaching!';
        } else if (pathway === 'STROKE') {
          utterance.text = 'Stroke Emergency! Critical time limit approaching!';
        } else if (pathway === 'TRAUMA') {
          utterance.text = 'Trauma Emergency! Critical time limit approaching!';
        } else {
          utterance.text = 'Critical Emergency! Immediate attention required!';
        }
        
        utterance.volume = 0.8;
        utterance.rate = 0.9;
        utterance.pitch = 1.2;
        
        console.log(`🗣️ Speaking: "${utterance.text}"`);
        
        // Delay voice alert slightly after beeps
        setTimeout(() => {
          speechSynthesis.speak(utterance);
        }, 1000);
      } else {
        console.log(`❌ Speech synthesis not available`);
      }

      // Fallback: Use browser notification if available
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(
          `${pathway} Emergency Alert`,
          {
            body: 'Critical time limit approaching! Immediate attention required.',
            icon: '/favicon.ico',
            tag: 'critical-alert',
            requireInteraction: true,
          }
        );
      }

    } catch (error) {
      console.warn('Audio alert failed:', error);
      
      // Fallback: Use browser alert
      setTimeout(() => {
        alert(`${pathway} Emergency! Critical time limit approaching!`);
      }, 1000);
    }
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    playAlert,
    requestNotificationPermission,
  };
};
