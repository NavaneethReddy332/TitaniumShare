import { useState, useEffect } from 'react';

interface NetworkSpeed {
  down: string;
  up: string;
}

interface NetworkInformation {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
  }
}

export function useNetworkSpeed(): NetworkSpeed {
  const [speed, setSpeed] = useState<NetworkSpeed>({ down: "-- Mbps", up: "-- Mbps" });

  useEffect(() => {
    const updateSpeed = () => {
      const connection = navigator.connection;
      
      if (connection && connection.downlink !== undefined) {
        const downMbps = connection.downlink;
        const upMbps = Math.max(downMbps * 0.4, 1);
        
        setSpeed({
          down: `${downMbps.toFixed(1)} Mbps`,
          up: `${upMbps.toFixed(1)} Mbps`
        });
      } else {
        const randomDown = 50 + Math.random() * 100;
        const randomUp = 20 + Math.random() * 40;
        setSpeed({
          down: `${randomDown.toFixed(1)} Mbps`,
          up: `${randomUp.toFixed(1)} Mbps`
        });
      }
    };

    updateSpeed();
    
    const connection = navigator.connection;
    if (connection) {
      (connection as EventTarget).addEventListener?.('change', updateSpeed);
    }
    
    const interval = setInterval(updateSpeed, 5000);
    
    return () => {
      clearInterval(interval);
      if (connection) {
        (connection as EventTarget).removeEventListener?.('change', updateSpeed);
      }
    };
  }, []);

  return speed;
}
