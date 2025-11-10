'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { MapAmap, MapMarker } from '../../../components/MapAmap';

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
	// 可选：is_public, public_read_id 等
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

export default function SharePage() {
	const params = useParams<{ id: string }>();
	const [plan, setPlan] = React.useState<TravelPlanRow | null>(null);
	const [spots, setSpots] = React.useState<TravelPlanSpotRow[]>([]);
	const [loading, setLoading] = React.useState(true);

	React.useEffect(() => {
		if (!supabase) return;
		const id = params?.id;
		if (!id) return;
		(async () => {
			try {
				// 注意：若开启了严格 RLS，需要为匿名用户放行公开计划的 SELECT 策略
				const { data: p, error: e1 } = await supabase
					.from<TravelPlanRow>('travel_plans')
					.select('*')
					.eq('id', id)
					.single();
				if (e1) throw e1;
				setPlan(p);
				const { data: s, error: e2 } = await supabase
					.from<TravelPlanSpotRow>('travel_plan_spots')
					.select('*')
					.eq('plan_id', id)
					.order('created_at', { ascending: false });
				if (e2) throw e2;
				setSpots(s ?? []);
			} catch (err: any) {
				alert(err.message || '加载失败（可能是未配置公开访问策略）');
			} finally {
				setLoading(false);
			}
		})();
	}, [params?.id]);

	const mapMarkers: MapMarker[] = spots.map(s => ({
		position: [s.longitude, s.latitude],
		title: s.name,
		description: s.description
	}));

	return (
		<div className="col" style={{ gap: 12 }}>
			<h3 style={{ marginTop: 0 }}>公开分享</h3>
			{loading ? (
				<small>加载中...</small>
			) : plan ? (
				<div className="col" style={{ gap: 12 }}>
					<strong>{plan.title}</strong>
					{plan.date_range && <small>日期：{plan.date_range}</small>}
					{plan.destination && <small>目的地：{plan.destination}</small>}
					{typeof plan.budget === 'number' && <small>预算：{plan.budget}</small>}
					<small>人数：{plan.num_people ?? '-'}</small>
					<pre style={{ whiteSpace: 'pre-wrap' }}>{plan.content}</pre>
					<MapAmap markers={mapMarkers} zoom={mapMarkers.length ? 12 : 4} />
				</div>
			) : (
				<small>未找到计划或无访问权限。</small>
			)}
		</div>
	);
}


