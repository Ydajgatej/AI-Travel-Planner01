'use client';
import React from 'react';
import { SpeechInput } from '../components/SpeechInput';
import { MapAmap } from '../components/MapAmap';
import { AuthContext } from '../components/AuthProvider';
import { supabase } from '../lib/supabaseClient';

type PlanRequest = {
	destination: string;
	startDate: string;
	endDate: string;
	budgetCny: number;
	numPeople: number;
	preferences: string;
};

export default function Page() {
	const [form, setForm] = React.useState<PlanRequest>({
		destination: '',
		startDate: '',
		endDate: '',
		budgetCny: 10000,
		numPeople: 1,
		preferences: ''
	});
	const [loading, setLoading] = React.useState(false);
	const [plan, setPlan] = React.useState<string>('');
	const [budget, setBudget] = React.useState<string>('');
	const [clickedLng, setClickedLng] = React.useState<string>('');
	const [clickedLat, setClickedLat] = React.useState<string>('');
	const [saving, setSaving] = React.useState(false);
	const { user } = React.useContext(AuthContext);

	async function submit() {
		setLoading(true);
		setPlan('');
		try {
			const res = await fetch('/api/plan', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					// 可在设置页保存到 localStorage: llm_api_key
					'X-LLM-API-Key': localStorage.getItem('llm_api_key') ?? '',
					'X-LLM-Model': localStorage.getItem('llm_model') ?? ''
				},
				body: JSON.stringify(form)
			});
			if (!res.ok) throw new Error('规划请求失败');
			const data = await res.json();
			setPlan(data.plan ?? '');
		} catch (e: any) {
			alert(e.message || '规划失败');
		} finally {
			setLoading(false);
		}
	}

	async function estimateBudget() {
		try {
			const res = await fetch('/api/budget', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-LLM-API-Key': localStorage.getItem('llm_api_key') ?? '',
					'X-LLM-Model': localStorage.getItem('llm_model') ?? ''
				},
				body: JSON.stringify(form)
			});
			if (!res.ok) throw new Error('预算估计失败');
			const data = await res.json();
			setBudget(data.budget ?? '');
		} catch (e: any) {
			alert(e.message || '预算失败');
		}
	}

	async function savePlan() {
		if (!plan) {
			alert('请先生成行程再保存。');
			return;
		}
		if (!supabase) {
			alert('Supabase 未配置，请检查环境变量。');
			return;
		}
		if (!user) {
			alert('请先登录后再保存行程。');
			return;
		}
		const title = window.prompt('请输入行程标题', form.destination || '未命名行程');
		if (!title) return;
		setSaving(true);
		try {
			const { error } = await supabase.from('travel_plans').insert({
				title,
				content: plan,
				user_id: user.id,
				preferences: form.preferences,
				destination: form.destination,
				date_range: `${form.startDate} ~ ${form.endDate}`,
				budget: form.budgetCny,
				num_people: form.numPeople
			});
			if (error) throw error;
			alert('保存成功，可在“我的计划”中查看。');
		} catch (e: any) {
			alert(e.message || '保存失败');
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="col" style={{ gap: 16 }}>
			<div className="card col">
				<div className="row" style={{ flexWrap: 'wrap' }}>
					<div className="col" style={{ minWidth: 240, flex: 1 }}>
						<label>目的地</label>
						<input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="例如：日本东京" />
					</div>
					<div className="col">
						<label>出发日期</label>
						<input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
					</div>
					<div className="col">
						<label>结束日期</label>
						<input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
					</div>
					<div className="col">
						<label>预算（元）</label>
						<input type="number" value={form.budgetCny} onChange={e => setForm({ ...form, budgetCny: Number(e.target.value) })} />
					</div>
					<div className="col">
						<label>人数</label>
						<input type="number" value={form.numPeople} onChange={e => setForm({ ...form, numPeople: Number(e.target.value) })} />
					</div>
				</div>
				<div className="col">
					<label>偏好</label>
					<textarea rows={3} value={form.preferences} onChange={e => setForm({ ...form, preferences: e.target.value })} placeholder="美食、动漫、亲子..." />
					<SpeechInput onText={text => setForm({ ...form, preferences: `${form.preferences} ${text}`.trim() })} />
					<small>支持语音或文字输入。正式接入讯飞语音请前往设置页配置。</small>
				</div>
				<div className="row">
					<button className="primary" onClick={submit} disabled={loading}>{loading ? '生成中...' : '生成行程'}</button>
					<button className="ghost" onClick={estimateBudget}>估算预算</button>
				</div>
			</div>

			<div className="row" style={{ alignItems: 'flex-start' }}>
				<div className="card" style={{ flex: 1 }}>
					<h3 style={{ marginTop: 0 }}>行程结果</h3>
					{plan ? (
						<div className="col">
							<pre style={{ whiteSpace: 'pre-wrap' }}>{plan}</pre>
							<button className="primary" onClick={savePlan} disabled={!user || saving}>
								{user ? (saving ? '保存中...' : '保存到云端') : '登录后可保存'}
							</button>
						</div>
					) : (
						<small>提交后显示行程规划结果。</small>
					)}
				</div>
				<div className="card" style={{ flex: 1 }}>
					<h3 style={{ marginTop: 0 }}>预算估计</h3>
					{budget ? <pre style={{ whiteSpace: 'pre-wrap' }}>{budget}</pre> : <small>点击“估算预算”查看。</small>}
				</div>
			</div>

			<div className="card">
				<h3 style={{ marginTop: 0 }}>地图</h3>
				<MapAmap onMapClick={pos => {
					setClickedLng(pos[0].toFixed(6));
					setClickedLat(pos[1].toFixed(6));
				}} />
				<div className="row" style={{ marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
					<div className="col">
						<label>经度</label>
						<input value={clickedLng} onChange={e => setClickedLng(e.target.value)} placeholder="点击地图自动填入" />
					</div>
					<div className="col">
						<label>纬度</label>
						<input value={clickedLat} onChange={e => setClickedLat(e.target.value)} placeholder="点击地图自动填入" />
					</div>
				</div>
				<small>需在设置页填入高德地图 JS SDK Key（客户端可见）。</small>
			</div>
		</div>
	);
}


