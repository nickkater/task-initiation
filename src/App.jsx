import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('home'); // home, loading, step, timer, celebrate
  const [task, setTask] = useState('');
  const [firstStep, setFirstStep] = useState('');
  const [reframe, setReframe] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(120);
  const [estSeconds, setEstSeconds] = useState(120);
  const [crisis, setCrisis] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [points, setPoints] = useState(() => {
    const saved = localStorage.getItem('taskInitiationPoints');
    return saved ? parseInt(saved) : 0;
  });
  

  // 포인트 저장
  useEffect(() => {
    localStorage.setItem('taskInitiationPoints', points.toString());
  }, [points]);

  // 타이머
  useEffect(() => {
    let interval;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleInputChange = (e) => {
    setTask(e.target.value);
  };

  const handleGetStep = async () => {
    if (!task.trim()) return;
    
    setScreen('loading');
    try {
      const response = await fetch('/.netlify/functions/first-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: task,
          mode: 'initial',
        }),
      });

      const data = await response.json();
      
      if (data.crisis) {
        setCrisis(true);
        setReframe(data.reframe);
        setScreen('crisis');
      } else {
        setReframe(data.reframe);
        setFirstStep(data.first_step);
        setEstSeconds(data.est_seconds);
        setTimeLeft(data.est_seconds);
        setScreen('step');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
      setScreen('home');
    }
  };

  const handleStartTimer = () => {
    setIsRunning(true);
    setScreen('timer');
    // 시작 포인트
    setPoints((prev) => prev + 10);
  };

  const handleCompleted = () => {
    // 완료 포인트
    setPoints((prev) => prev + 15);
    setScreen('celebrate');
  };

  const handleBreakDown = async () => {
    setScreen('loading');
    try {
      const response = await fetch('/.netlify/functions/first-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: firstStep,
          mode: 'break-down',
          currentStep: firstStep,
        }),
      });

      const data = await response.json();
      setReframe(data.reframe);
      setFirstStep(data.first_step);
      setEstSeconds(data.est_seconds);
      setTimeLeft(data.est_seconds);
      setScreen('step');
    } catch (error) {
      console.error('Error:', error);
      alert('오류가 발생했습니다.');
      setScreen('step');
    }
  };

  const handleNextStep = async () => {
    setScreen('loading');
    try {
      const response = await fetch('/.netlify/functions/first-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: firstStep,
          mode: 'next-step',
          task: task,
        }),
      });

      const data = await response.json();
      setReframe(data.reframe);
      setFirstStep(data.first_step);
      setEstSeconds(data.est_seconds);
      setTimeLeft(data.est_seconds);
      // 연쇄 보너스
      setPoints((prev) => prev + 5);
      setScreen('step');
    } catch (error) {
      console.error('Error:', error);
      alert('오류가 발생했습니다.');
      setScreen('celebrate');
    }
  };

  const handleReset = () => {
    setTask('');
    setFirstStep('');
    setReframe('');
    setTimeLeft(120);
    setIsRunning(false);
    setCrisis(false);
    setScreen('home');
  };

  return (
    <div className="app">
      <div className="header">
        <h1 className="logo">착수</h1>
        <div className="points">⭐ {points}</div>
      </div>

      {/* 화면 1: 홈 - 입력 */}
      {screen === 'home' && (
        <div className="screen screen-home">
          <p className="label">뭐가 막막해?</p>
          <textarea
            className="input-box"
            placeholder="보고서 써야 하는데 손도 못 대고 있어…"
            value={task}
            onChange={handleInputChange}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleGetStep();
              }
            }}
          />
          <button
            className="btn btn-primary"
            onClick={handleGetStep}
            disabled={!task.trim()}
          >
            첫걸음 받기
          </button>
          <p className="hint">🔓 로그인·설정 없음</p>
        </div>
      )}

      {/* 로딩 */}
      {screen === 'loading' && (
        <div className="screen screen-loading">
          <div className="spinner"></div>
          <p>첫걸음 찾는 중…</p>
        </div>
      )}

      {/* 화면 2: 첫걸음 - 더 잘게 탈출구 */}
      {screen === 'step' && (
        <div className="screen screen-step">
          <p className="reframe">{reframe}</p>
          <div className="step-box">
            <p className="step-label">첫 2분짜리 첫걸음</p>
            <p className="step-text">{firstStep}</p>
          </div>
          <button className="btn btn-primary" onClick={handleStartTimer}>
            지금 시작
          </button>
          <button className="btn btn-secondary" onClick={handleBreakDown}>
            이것도 너무 커? 더 잘게 쪼개줘
          </button>
        </div>
      )}

      {/* 화면 3: 타이머 */}
      {screen === 'timer' && (
        <div className="screen screen-timer">
          <p className="timer-label">{firstStep}</p>
          <div className="timer">{formatTime(timeLeft)}</div>
          <p className="timer-hint">같이 있어 줄게 · 딴 데 안 감</p>
          <div className="timer-buttons">
            <button className="btn btn-success" onClick={handleCompleted}>
              ✓ 했어
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? '⏸ 멈춰' : '▶ 계속'}
            </button>
          </div>
        </div>
      )}

      {/* 화면 4: 축하 & 다음 */}
      {screen === 'celebrate' && (
        <div className="screen screen-celebrate">
          <div className="confetti">🎉</div>
          <p className="celebrate-title">첫걸음 뗐다</p>
          <p className="celebrate-text">제일 어려운 걸 이미 넘었어.</p>
          
          <div className="points-animation">
            <span className="points-badge">+15</span>
          </div>

          <button className="btn btn-primary" onClick={handleNextStep}>
            다음 한 걸음 →
          </button>
          <p className="hint-small">여기서 멈춰도 돼. 그것도 잘한 거야.</p>
          <button className="btn btn-ghost" onClick={handleReset}>
            처음부터 다시
          </button>
        </div>
      )}

      {/* 위기 신호 처리 */}
      {screen === 'crisis' && (
        <div className="screen screen-crisis">
          <p className="crisis-text">{reframe}</p>
          <p className="crisis-info">
            혼자가 아니야. 지금 누군가와 얘기하는 게 도움이 될 것 같아.
          </p>
          <div className="crisis-resources">
            <a href="tel:1393" className="resource-link">
              정신건강위기상담전화 1393
            </a>
            <a href="https://findahelpline.com" className="resource-link" target="_blank" rel="noopener noreferrer">
              해외 자살예방 핫라인
            </a>
          </div>
          <button className="btn btn-secondary" onClick={handleReset}>
            돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
