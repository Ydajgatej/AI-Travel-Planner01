'use client';
import React from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AuthContext } from '../../components/AuthProvider';

export default function AuthPage() {
	const { user } = React.useContext(AuthContext);
	const [mode, setMode] = React.useState<'login' | 'register'>('login');
	const [email, setEmail] = React.useState('');
	const [password, setPassword] = React.useState('');
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		if (user) {
			window.location.href = '/';
		}
	}, [user]);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!supabase) return alert('Supabase 未配置（请设置 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY）');
		setLoading(true);
		try {
			if (mode === 'login') {
				const { error } = await supabase.auth.signInWithPassword({ email, password });
				if (error) throw error;
			} else {
				const { error } = await supabase.auth.signUp({ email, password });
				if (error) throw error;
				alert('注册成功，请查收验证邮件（如开启邮箱验证）或直接登录。');
				setMode('login');
			}
		} catch (err: any) {
			alert(err.message || '操作失败');
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="card col" style={{ maxWidth: 420, margin: '0 auto' }}>
			<div className="row">
				<button className={mode === 'login' ? 'primary' : 'ghost'} onClick={() => setMode('login')}>登录</button>
				<button className={mode === 'register' ? 'primary' : 'ghost'} onClick={() => setMode('register')}>注册</button>
			</div>
			<form className="col" onSubmit={onSubmit}>
				<div className="col">
					<label>邮箱</label>
					<input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
				</div>
				<div className="col">
					<label>密码</label>
					<input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
					<small>至少 6 位。</small>
				</div>
				<button className="primary" type="submit" disabled={loading}>{loading ? '提交中...' : (mode === 'login' ? '登录' : '注册')}</button>
			</form>
			<small>提示：需要在环境变量中配置 Supabase 公钥与 URL。</small>
		</div>
	);
}


