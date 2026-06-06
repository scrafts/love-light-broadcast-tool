import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center mb-8">
      <h1 style={{ color: 'var(--text-primary)', marginBottom: '8px' }} className="text-3xl">사랑의빛교회 방송 자막 생성기</h1>
      <p className="text-secondary text-sm">유튜브 라이브 방송을 위한 제목과 설명란을 생성합니다.</p>
    </header>
  );
};
