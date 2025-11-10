'use client';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import { AuthContext } from '../../../../components/AuthProvider';

type TravelPlanRow = {
	id: string;
	title: string;
	content: string;
	destination?: string;
	date_range?: string;
	budget?: number;
	num_people?: number;
	preferences?: string;
};

type TravelExpenseRow = {
	id: string;
	plan_id: string;
	user_id: string;
	amount: number;
	category: string | null;
	note: string | null;
	currency: string | null;
	occurred_at: string | null;
	created_at: string;
};

export default function PlanAnalysisPage() {
	const params = useParams<{ id: string }>();
	const router = useRouter();
	const { user, loading } = React.useContext(AuthContext);
	const [plan, setPlan] = React.useState<TravelPlanRow | null>(null);
	const [expenses, setExpenses] = React.useState<TravelExpenseRow[]>([]);
	const [fetching, setFetching] = React.useState(true);
	const [analysis, setAnalysis] = React.useState<string>('');
	const [analyzing, setAnalyzing] = React.useState(false);
	const planId = (params?.id as string) || '';

	React.useEffect(() => {
		if (!supabase) return;
		if (!loading) {
			if (!user) {
				router.replace('/auth');
			} else {
				loadData();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading, user, params?.id]);

	async function loadData() {
		setFetching(true);
		try {
			const pid = params?.id as string;
			const { data: p, error: e1 } = await supabase
				.from<TravelPlanRow>('travel_plans')
				.select('*')
				.eq('id', pid)
				.eq('user_id', user!.id)
				.single();
			if (e1) throw e1;
			setPlan(p);
			const { data: exps, error: e2 } = await supabase
				.from<TravelExpenseRow>('travel_expenses')
				.select('*')
				.eq('plan_id', pid)
				.eq('user_id', user!.id)
				.order('occurred_at', { ascending: false });
			if (e2) throw e2;
			setExpenses(exps ?? []);
			setAnalysis('');
		} catch (e: any) {
			alert(e.message || '加载失败');
		} finally {
			setFetching(false);
		}
	}

	async function analyze() {
		if (!plan) return;
		setAnalyzing(true);
		setAnalysis('');
		try {
			const res = await fetch('/api/budget/analyze', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-LLM-API-Key': localStorage.getItem('llm_api_key') ?? '',
					'X-LLM-Model': localStorage.getItem('llm_model') ?? ''
				},
				body: JSON.stringify({ plan, expenses })
			});
			if (!res.ok) throw new Error('分析失败');
			const data = await res.json();
			setAnalysis(data.analysis || '');
		} catch (e: any) {
			alert(e.message || '分析失败');
		} finally {
			setAnalyzing(false);
		}
	}

	return (
		<div className="col" style={{ gap: 12 }}>
			<h3 style={{ marginTop: 0 }}>AI 预算分析</h3>
			{fetching ? (
				<small>加载中...</small>
			) : plan ? (
				<>
					<strong>{plan.title}</strong>
					{plan.date_range && <small>日期：{plan.date_range}</small>}
					{plan.destination && <small>目的地：{plan.destination}</small>}
					{typeof plan.budget === 'number' && <small>目标预算：{plan.budget}</small>}
					<small>记录支出条数：{expenses.length}</small>
					<div className="row">
						<button className="primary" onClick={analyze} disabled={analyzing}>
							{analyzing ? '分析中...' : '开始分析'}
						</button>
						<button className="ghost" onClick={loadData}>重新加载数据</button>
						<a className="ghost" href="/plans">返回我的计划</a>
					</div>
					{analysis && (
						<div className="card">
							<h4 style={{ marginTop: 0 }}>分析结果</h4>
							<pre style={{ whiteSpace: 'pre-wrap' }}>{analysis}</pre>
							<div className="row" style={{ gap: 8 }}>
								<button
									className="ghost"
									onClick={() => {
										try {
											localStorage.setItem(`plan_analysis_${planId}`, analysis);
											alert('已保存到本地（浏览器）');
										} catch {
											alert('保存失败');
										}
									}}
								>
									保存分析
								</button>
								<button
									className="ghost"
									onClick={async () => {
										try {
											await navigator.clipboard.writeText(analysis);
											alert('已复制到剪贴板');
										} catch {
											alert('复制失败');
										}
									}}
								>
									复制分析
								</button>
								<button
									className="ghost"
									onClick={() => {
										const content = `# ${plan?.title || '预算分析'}\n\n${analysis}`;
										const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
										const url = URL.createObjectURL(blob);
										const a = document.createElement('a');
										a.href = url;
										a.download = `${plan?.title || 'analysis'}.md`;
										document.body.appendChild(a);
										a.click();
										document.body.removeChild(a);
										URL.revokeObjectURL(url);
									}}
								>
									下载 Markdown
								</button>
								<button
									className="ghost"
									onClick={async () => {
										if (!('share' in navigator)) {
											alert('当前浏览器不支持原生分享，建议使用复制或下载');
											return;
										}
										try {
											await (navigator as any).share({
												title: plan?.title || '预算分析',
												text: analysis
											});
										} catch {}
									}}
								>
									分享
								</button>
							</div>
						</div>
					)}
				</>
			) : (
				<small>未找到该计划或无权限。</small>
			)}
		</div>
	);
}


