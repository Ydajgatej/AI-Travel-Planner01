'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { AuthContext } from '../../components/AuthProvider';
import { MapAmap, MapMarker } from '../../components/MapAmap';

type TravelPlanRow = {
	id: string;
	title: string;
	content: string;
	created_at: string;
	destination?: string;
	date_range?: string;
	budget?: number;
	num_people?: number;
	preferences?: string;
};

type TravelPlanSpotRow = {
	id: string;
	plan_id: string;
	name: string;
	description?: string;
	latitude: number;
	longitude: number;
	created_at: string;
};

export default function PlansPage() {
	const router = useRouter();
	const { user, loading } = React.useContext(AuthContext);
	const [plans, setPlans] = React.useState<TravelPlanRow[]>([]);
	const [selected, setSelected] = React.useState<TravelPlanRow | null>(null);
	const [fetching, setFetching] = React.useState(false);
	const [spots, setSpots] = React.useState<TravelPlanSpotRow[]>([]);
	const [spotsLoading, setSpotsLoading] = React.useState(false);
	const [addingSpot, setAddingSpot] = React.useState(false);
	const [newSpot, setNewSpot] = React.useState({ name: '', lat: '', lng: '', note: '' });
	const [mapCenter, setMapCenter] = React.useState<[number, number] | undefined>(undefined);
	const [geoLoading, setGeoLoading] = React.useState(false);
	const [geoCity, setGeoCity] = React.useState('');

	React.useEffect(() => {
		if (!supabase) return;
		if (!loading) {
			if (!user) {
				router.replace('/auth');
			} else {
				loadPlans();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading, user]);

	React.useEffect(() => {
		if (!supabase) return;
		if (selected) {
			loadSpots(selected.id);
		} else {
			setSpots([]);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selected?.id]);

	if (!supabase) {
		return (
			<div className="card col">
				<h3 style={{ marginTop: 0 }}>我的计划</h3>
				<small>尚未配置 Supabase。请设置环境变量 NEXT_PUBLIC_SUPABASE_URL 与 NEXT_PUBLIC_SUPABASE_ANON_KEY。</small>
			</div>
		);
	}

	async function loadPlans() {
		setFetching(true);
		try {
			const { data, error } = await supabase
				.from<TravelPlanRow>('travel_plans')
				.select('*')
				.eq('user_id', user!.id)
				.order('created_at', { ascending: false });
			if (error) throw error;
			setPlans(data ?? []);
			if (data && data.length > 0) setSelected(data[0]);
		} catch (e: any) {
			alert(e.message || '加载失败');
		} finally {
			setFetching(false);
		}
	}

	async function loadSpots(planId: string) {
		setSpotsLoading(true);
		try {
			const { data, error } = await supabase
				.from<TravelPlanSpotRow>('travel_plan_spots')
				.select('*')
				.eq('plan_id', planId)
				.order('created_at', { ascending: false });
			if (error) throw error;
			setSpots(data ?? []);
			if (data && data.length > 0) {
				setMapCenter([data[0].longitude, data[0].latitude]);
			} else {
				setMapCenter(undefined);
			}
		} catch (e: any) {
			alert(e.message || '加载地图标记失败');
		} finally {
			setSpotsLoading(false);
		}
	}

	function handleSelectPlan(plan: TravelPlanRow) {
		setSelected(plan);
	}

	async function deletePlan(id: string) {
		if (!confirm('确认删除该行程吗？')) return;
		try {
			const { error } = await supabase.from('travel_plans').delete().eq('id', id).eq('user_id', user!.id);
			if (error) throw error;
			setPlans(prev => prev.filter(p => p.id !== id));
			if (selected?.id === id) setSelected(null);
			setSpots([]);
		} catch (e: any) {
			alert(e.message || '删除失败');
		}
	}

	async function addSpot(e: React.FormEvent) {
		e.preventDefault();
		if (!selected) {
			alert('请先选择一个行程。');
			return;
		}
		const lat = Number(newSpot.lat);
		const lng = Number(newSpot.lng);
		if (Number.isNaN(lat) || Number.isNaN(lng)) {
			alert('请输入正确的经纬度。');
			return;
		}
		setAddingSpot(true);
		try {
			const payload = {
				plan_id: selected.id,
				name: newSpot.name || '未命名地点',
				description: newSpot.note || '',
				latitude: lat,
				longitude: lng
			};
			const { data, error } = await supabase
				.from<TravelPlanSpotRow>('travel_plan_spots')
				.insert(payload)
				.select()
				.single();
			if (error) throw error;
			if (data) {
				setSpots(prev => [data, ...prev]);
				setMapCenter([data.longitude, data.latitude]);
			}
			setNewSpot({ name: '', lat: '', lng: '', note: '' });
		} catch (e: any) {
			alert(e.message || '新增标记失败');
		} finally {
			setAddingSpot(false);
		}
	}

	async function deleteSpot(id: string) {
		if (!confirm('确认删除该标记吗？')) return;
		try {
			const { error } = await supabase
				.from('travel_plan_spots')
				.delete()
				.eq('id', id)
				.eq('plan_id', selected?.id ?? '');
			if (error) throw error;
			setSpots(prev => prev.filter(s => s.id !== id));
		} catch (e: any) {
			alert(e.message || '删除标记失败');
		}
	}

	async function copyMarkdown() {
		if (!selected) return;
		const lines = [
			`# ${selected.title}`,
			selected.date_range ? `**日期**：${selected.date_range}` : '',
			selected.destination ? `**目的地**：${selected.destination}` : '',
			typeof selected.budget === 'number' ? `**预算**：${selected.budget}` : '',
			typeof selected.num_people === 'number' ? `**人数**：${selected.num_people}` : '',
			selected.preferences ? `**偏好**：${selected.preferences}` : '',
			'',
			'## 行程安排',
			selected.content,
			'',
			spots.length > 0 ? '## 地图标记' : '',
			...spots.map(
				spot =>
					`- ${spot.name} (${spot.latitude.toFixed(5)}, ${spot.longitude.toFixed(5)})${spot.description ? `：${spot.description}` : ''}`
			)
		].filter(Boolean);
		try {
			await navigator.clipboard.writeText(lines.join('\n'));
			alert('已复制为 Markdown');
		} catch {
			alert('复制失败，请手动复制。');
		}
	}

	function downloadJson() {
		if (!selected) return;
		const data = {
			plan: selected,
			spots: spots
		};
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `${selected.title || 'travel-plan'}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	async function shareNative() {
		if (!selected) return;
		if (!('share' in navigator)) {
			alert('当前浏览器不支持原生分享，可以使用复制或导出。');
			return;
		}
		try {
			await navigator.share({
				title: selected.title,
				text: selected.content
			});
		} catch (e: any) {
			if (e?.name !== 'AbortError') {
				alert('分享失败：' + (e?.message ?? '未知错误'));
			}
		}
	}

	const mapMarkers: MapMarker[] = spots.map(spot => ({
		position: [spot.longitude, spot.latitude],
		title: spot.name,
		description: spot.description
	}));

	return (
		<div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
			<div className="card" style={{ flex: 1, minWidth: 280 }}>
				<div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
					<h3 style={{ marginTop: 0 }}>我的计划</h3>
					<button className="ghost" onClick={loadPlans} disabled={fetching}>{fetching ? '刷新中...' : '刷新'}</button>
				</div>
				{plans.length === 0 ? (
					<small>暂无云端行程，返回首页生成并点击“保存到云端”。</small>
				) : (
					<div className="col">
						{plans.map(plan => (
							<div key={plan.id} className="card" style={{ padding: 12, borderColor: selected?.id === plan.id ? '#111827' : undefined }}>
								<div className="row" style={{ justifyContent: 'space-between' }}>
									<strong>{plan.title}</strong>
									<div className="row">
										<button className="ghost" onClick={() => handleSelectPlan(plan)}>查看</button>
										<button className="ghost" onClick={() => deletePlan(plan.id)}>删除</button>
									</div>
								</div>
								<small>{plan.date_range || ''}</small>
								<small>目的地：{plan.destination || '未知'} | 预算：{plan.budget ?? '-'} | 人数：{plan.num_people ?? '-'}</small>
							</div>
						))}
					</div>
				)}
			</div>
			<div className="card" style={{ flex: 2, minHeight: 360 }}>
				<h3 style={{ marginTop: 0 }}>详情</h3>
				{selected ? (
					<div className="col" style={{ gap: 12 }}>
						<strong>{selected.title}</strong>
						<small>偏好：{selected.preferences || '无'}</small>
						<div className="row" style={{ gap: 8 }}>
							<button className="ghost" onClick={copyMarkdown}>复制 Markdown</button>
							<button className="ghost" onClick={downloadJson}>下载 JSON</button>
							<button className="ghost" onClick={shareNative}>分享</button>
							<button
								className="ghost"
								onClick={() => {
									if (!selected) return;
									const url = `${window.location.origin}/share/${selected.id}`;
									navigator.clipboard.writeText(url).then(
										() => alert('已复制分享链接'),
										() => alert(url)
									);
								}}
							>
								复制分享链接
							</button>
						</div>
						{selected.date_range && <small>日期：{selected.date_range}</small>}
						{selected.destination && <small>目的地：{selected.destination}</small>}
						{typeof selected.budget === 'number' && <small>预算：{selected.budget}</small>}
						<small>人数：{selected.num_people ?? '-'}</small>
						<pre style={{ whiteSpace: 'pre-wrap' }}>{selected.content}</pre>
						<div className="col" style={{ gap: 12 }}>
							<h4 style={{ margin: 0 }}>地图标记</h4>
							<MapAmap
								markers={mapMarkers}
								center={mapCenter}
								onMapClick={pos => setNewSpot(prev => ({ ...prev, lng: pos[0].toFixed(6), lat: pos[1].toFixed(6) }))}
								zoom={mapCenter ? 12 : 4}
							/>
							{spotsLoading ? <small>加载标记中...</small> : null}
							<form className="col" onSubmit={addSpot}>
								<div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
									<input
										style={{ flex: 1, minWidth: 180 }}
										placeholder="名称（如：浅草寺）"
										value={newSpot.name}
										onChange={e => setNewSpot({ ...newSpot, name: e.target.value })}
									/>
									<button
										type="button"
										className="ghost"
										disabled={!newSpot.name || geoLoading}
										onClick={async () => {
											setGeoLoading(true);
											try {
												const key = localStorage.getItem('amap_web_key') || '';
												const qs = new URLSearchParams();
												qs.set('address', newSpot.name);
												if (geoCity) qs.set('city', geoCity);
												const resp = await fetch(`/api/geocode?${qs.toString()}`, {
													headers: {
														'X-AMAP-KEY': key
													}
												});
												const data = await resp.json();
												const loc = data?.geocodes?.[0]?.location || '';
												if (!loc) throw new Error(data?.info || '未找到结果');
												const [lngStr, latStr] = String(loc).split(',');
												setNewSpot(prev => ({ ...prev, lng: Number(lngStr).toFixed(6), lat: Number(latStr).toFixed(6) }));
												setMapCenter([Number(lngStr), Number(latStr)]);
											} catch (e: any) {
												alert(e.message || '地理编码失败');
											} finally {
												setGeoLoading(false);
											}
										}}
									>
										{geoLoading ? '查询中...' : '地址转坐标'}
									</button>
									<input
										style={{ width: 140 }}
										placeholder="经度"
										value={newSpot.lng}
										onChange={e => setNewSpot({ ...newSpot, lng: e.target.value })}
									/>
									<input
										style={{ width: 140 }}
										placeholder="纬度"
										value={newSpot.lat}
										onChange={e => setNewSpot({ ...newSpot, lat: e.target.value })}
									/>
								</div>
								<div className="row" style={{ gap: 8 }}>
									<input
										style={{ width: 220 }}
										placeholder="城市（可选，如：东京/北京）"
										value={geoCity}
										onChange={e => setGeoCity(e.target.value)}
									/>
								</div>
								<textarea
									rows={2}
									placeholder="备注（选填，支持点击地图自动填入经纬度）"
									value={newSpot.note}
									onChange={e => setNewSpot({ ...newSpot, note: e.target.value })}
								/>
								<div className="row">
									<button className="primary" type="submit" disabled={addingSpot}>
										{addingSpot ? '保存中...' : '添加标记'}
									</button>
								</div>
							</form>
							<div className="col" style={{ gap: 8 }}>
								{spots.length === 0 ? (
									<small>暂无标记，可在地图上点击或手动输入经纬度后添加。</small>
								) : (
									spots.map(spot => (
										<div key={spot.id} className="card" style={{ padding: 10 }}>
											<div className="row" style={{ justifyContent: 'space-between' }}>
												<strong>{spot.name}</strong>
												<button className="ghost" onClick={() => deleteSpot(spot.id)}>删除</button>
											</div>
											<small>坐标：{spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}</small>
											{spot.description && <small>备注：{spot.description}</small>}
										</div>
									))
								)}
							</div>
						</div>
					</div>
				) : (
					<small>选择左侧的计划查看详情。</small>
				)}
			</div>
		</div>
	);
}


