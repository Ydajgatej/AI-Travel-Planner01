import './globals.css';
import React from 'react';
import { AuthProvider } from '../components/AuthProvider';
import { UserMenu } from '../components/UserMenu';

export const metadata = {
	title: 'AI 旅行规划师',
	description: '基于大模型与地图的个性化旅行规划助手'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="zh-CN">
			<body>
				<AuthProvider>
					<div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
						<header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
							<h1 style={{ fontSize: 20, margin: 0 }}>AI 旅行规划师</h1>
							<nav style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
								<a href="/">首页</a>
								<a href="/plans">我的计划</a>
								<a href="/settings">设置</a>
								<UserMenu />
							</nav>
						</header>
						<main style={{ marginTop: 16 }}>{children}</main>
					</div>
				</AuthProvider>
			</body>
		</html>
	);
}


