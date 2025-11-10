'use client';
import React from 'react';
import { AuthContext } from './AuthProvider';
import { supabase } from '../lib/supabaseClient';

export function UserMenu() {
	const { user, loading } = React.useContext(AuthContext);

	async function logout() {
		if (!supabase) return alert('Supabase 未配置');
		await supabase.auth.signOut();
	}

	if (loading) return <small>加载中…</small>;
	if (!user) return <a href="/auth">登录/注册</a>;

	return (
		<div className="row" style={{ alignItems: 'center' }}>
			<small>{user.email}</small>
			<button className="ghost" onClick={logout}>退出</button>
		</div>
	);
}


