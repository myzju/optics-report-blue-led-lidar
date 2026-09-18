import type { Metadata } from 'next';
import './globals.css';

const siteUrl =
  process.env.SITE_URL ??
  'https://optics-nearby-led-lidar.mickmickmick750161.chatgpt.site';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: '从书桌到车前｜蓝光 LED 与车载激光雷达',
  description: '两件身边的光学仪器：蓝光 LED 台灯与车载激光雷达的历史、现实与未来。',
  openGraph: {
    title: '从书桌到车前｜蓝光 LED 与车载激光雷达',
    description: '一束光让人看见，一束光让机器看见。',
    type: 'website',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: '从书桌到车前——蓝光 LED 与车载激光雷达',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '从书桌到车前｜蓝光 LED 与车载激光雷达',
    description: '一束光让人看见，一束光让机器看见。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
