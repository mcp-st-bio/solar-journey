import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '태양의 여행 · 에너지 경로 전략 게임',
  description: '6명이 숨겨진 역할로 협력해 자동차까지 에너지 경로를 완성하는 수업용 게임',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
