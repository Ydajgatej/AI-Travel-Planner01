'use client';
import React from 'react';

declare global {
	interface Window {
		AMap?: any;
	}
}

export type MapMarker = {
	position: [number, number];
	title?: string;
	description?: string;
};

type MapProps = {
	markers?: MapMarker[];
	center?: [number, number];
	zoom?: number;
	onMapClick?: (lnglat: [number, number]) => void;
	onMarkerClick?: (marker: MapMarker) => void;
	style?: React.CSSProperties;
};

export function MapAmap({
	markers = [],
	center,
	zoom = 11,
	onMapClick,
	onMarkerClick,
	style
}: MapProps) {
	const containerRef = React.useRef<HTMLDivElement | null>(null);
	const mapRef = React.useRef<any>(null);
	const markerInstancesRef = React.useRef<any[]>([]);
	const [sdkLoaded, setSdkLoaded] = React.useState(false);
	const retriedRef = React.useRef(0);
	const loadingScriptRef = React.useRef(false);

	React.useEffect(() => {
		if (typeof window === 'undefined') return;
		if (window.AMap) {
			setSdkLoaded(true);
			return;
		}
		function tryLoad() {
			if (window.AMap || loadingScriptRef.current) return;
			const key = localStorage.getItem('amap_js_key') || process.env.NEXT_PUBLIC_AMAP_JS_SDK_KEY || '';
			if (!key) return;
			loadingScriptRef.current = true;
			const script = document.createElement('script');
			script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
			script.async = true;
			script.onload = () => {
				setSdkLoaded(true);
			};
			script.onerror = () => {
				loadingScriptRef.current = false;
			};
			document.head.appendChild(script);
		}
		// 立即尝试一次
		tryLoad();
		// 若 key 尚未写入（例如刚登录后第一次进入页面），短时间内重试几次
		const interval = setInterval(() => {
			if (window.AMap) {
				setSdkLoaded(true);
				clearInterval(interval);
				return;
			}
			retriedRef.current += 1;
			if (retriedRef.current > 8) {
				clearInterval(interval);
				return;
			}
			tryLoad();
		}, 500);
		return () => clearInterval(interval);
	}, []);

	React.useEffect(() => {
		if (!sdkLoaded || !containerRef.current || !window.AMap) return;
		const map = new window.AMap.Map(containerRef.current, {
			zoom,
			center: center ?? [116.397428, 39.90923]
		});
		mapRef.current = map;
		let clickListener: any;
		if (onMapClick) {
			clickListener = map.on('click', (e: any) => {
				if (!e?.lnglat) return;
				onMapClick([Number(e.lnglat.lng), Number(e.lnglat.lat)]);
			});
		}
		return () => {
			if (clickListener) map.off('click', clickListener);
			try {
				map?.destroy?.();
			} catch {}
			mapRef.current = null;
		};
	}, [sdkLoaded]);

	React.useEffect(() => {
		if (!mapRef.current || !window.AMap) return;
		if (center) {
			mapRef.current.setZoomAndCenter(zoom, center);
		} else if (markers.length > 0) {
			mapRef.current.setZoomAndCenter(zoom, markers[0].position);
		}
	}, [center, zoom, markers]);

	React.useEffect(() => {
		if (!mapRef.current || !window.AMap) return;
		// 清除旧标记
		markerInstancesRef.current.forEach(marker => marker.setMap(null));
		markerInstancesRef.current = [];
		// 创建新标记
		markers.forEach(marker => {
			const instance = new window.AMap.Marker({
				position: marker.position,
				title: marker.title
			});
			instance.setMap(mapRef.current);
			if (marker.description) {
				const info = new window.AMap.InfoWindow({
					content: `<div><strong>${marker.title ?? ''}</strong><div>${marker.description}</div></div>`
				});
				instance.on('click', () => {
					info.open(mapRef.current, instance.getPosition());
					onMarkerClick?.(marker);
				});
			} else {
				instance.on('click', () => onMarkerClick?.(marker));
			}
			markerInstancesRef.current.push(instance);
		});
	}, [markers]);

	return (
		<div
			ref={containerRef}
			style={{ width: '100%', height: 360, background: '#f3f4f6', borderRadius: 8, ...style }}
		>
			{!sdkLoaded && (
				<div style={{ padding: 12 }}>
					<small>等待高德地图 SDK 加载或请在设置页填写 Key。</small>
				</div>
			)}
		</div>
	);
}
