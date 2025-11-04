import React, { useState, useEffect } from 'react';
import { useApp } from '../context/appcontext';

export default function SessionTimer() {
  const { sessionInfo, getRemainingTime, logout } = useApp();
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    if (!sessionInfo) return;

    const updateTimer = () => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);
    };

    // Actualizar inmediatamente
    updateTimer();

    // Actualizar cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [sessionInfo, getRemainingTime]);

  if (!sessionInfo || remainingTime <= 0) {
    return null;
  }

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getWarningLevel = (milliseconds: number): 'normal' | 'warning' | 'critical' => {
    const minutes = milliseconds / (1000 * 60);
    if (minutes <= 5) return 'critical';
    if (minutes <= 15) return 'warning';
    return 'normal';
  };

  const warningLevel = getWarningLevel(remainingTime);

  const getStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: '600',
      border: '1px solid',
      transition: 'all 0.3s ease',
    };

    switch (warningLevel) {
      case 'critical':
        return {
          ...baseStyles,
          backgroundColor: '#fef2f2',
          borderColor: '#fca5a5',
          color: '#dc2626',
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: '#fffbeb',
          borderColor: '#fcd34d',
          color: '#d97706',
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: '#f0f9ff',
          borderColor: '#93c5fd',
          color: '#2563eb',
        };
    }
  };

  const getIcon = () => {
    switch (warningLevel) {
      case 'critical':
        return '⚠️';
      case 'warning':
        return '⏰';
      default:
        return '🕐';
    }
  };

  return (
    <div style={getStyles()}>
      <span>{getIcon()}</span>
      <span>Sesión: {formatTime(remainingTime)}</span>
      {warningLevel === 'critical' && (
        <button
          onClick={logout}
          style={{
            marginLeft: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.75rem',
            cursor: 'pointer',
          }}
        >
          Cerrar Sesión
        </button>
      )}
    </div>
  );
}