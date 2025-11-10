'use client';
import React from 'react';

type PieDatum = {
	label: string;
	value: number;
	color?: string;
};

type PieChartProps = {
	data: PieDatum[];
	size?: number;
	innerRadius?: number;
};

export function PieChart({ data, size = 220, innerRadius = 60 }: PieChartProps) {
	const total = data.reduce((s, d) => s + Math.max(0, d.value), 0);
	const radius = size / 2;
	let startAngle = -Math.PI / 2;
	// 预设颜色
	const palette = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#f97316', '#06b6d4'];
	function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
		const x1 = cx + r * Math.cos(start);
		const y1 = cy + r * Math.sin(start);
		const x2 = cx + r * Math.cos(end);
		const y2 = cy + r * Math.sin(end);
		const largeArc = end - start > Math.PI ? 1 : 0;
		return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
	}
	const arcs = data.map((d, i) => {
		const angle = total > 0 ? (d.value / total) * Math.PI * 2 : 0;
		const endAngle = startAngle + angle;
		const path = describeArc(radius, radius, radius, startAngle, endAngle);
		startAngle = endAngle;
		return { path, color: d.color || palette[i % palette.length], datum: d };
	});
	return (
		<div className="row" style={{ gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
			<svg width={size} height={size}>
				<g>
					{arcs.map((a, idx) => (
						<path key={idx} d={a.path} fill={a.color} />
					))}
					{innerRadius > 0 && (
						<circle cx={radius} cy={radius} r={innerRadius} fill="#fff" />
					)}
				</g>
			</svg>
			<div className="col" style={{ gap: 8 }}>
				{data.map((d, i) => {
					const color = d.color || palette[i % palette.length];
					const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
					return (
						<div key={i} className="row" style={{ alignItems: 'center', gap: 8 }}>
							<div style={{ width: 10, height: 10, background: color, borderRadius: 2 }} />
							<small>{d.label}: {d.value}（{pct}%）</small>
						</div>
					);
				})}
				<small>合计：{total}</small>
			</div>
		</div>
	);
}


