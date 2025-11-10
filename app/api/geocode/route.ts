import { NextRequest, NextResponse } from 'next/server';

// 代理高德 Web 服务地理编码接口，避免在前端暴露服务端密钥
// 优先使用请求头 X-AMAP-KEY（来自设置页），否则使用环境变量 AMAP_WEB_SERVICE_KEY
export async function GET(req: NextRequest) {
	try {
		const { searchParams } = new URL(req.url);
		const address = searchParams.get('address') || '';
		const city = searchParams.get('city') || '';
		if (!address) {
			return NextResponse.json({ status: 'error', info: 'missing address' }, { status: 400 });
		}
		const keyFromHeader = req.headers.get('x-amap-key') || '';
		const key = keyFromHeader || process.env.AMAP_WEB_SERVICE_KEY || '';
		if (!key) {
			return NextResponse.json({ status: 'error', info: 'missing amap key' }, { status: 400 });
		}
		const url = new URL('https://restapi.amap.com/v3/geocode/geo');
		url.searchParams.set('address', address);
		if (city) url.searchParams.set('city', city);
		url.searchParams.set('key', key);
		const resp = await fetch(url.toString(), { method: 'GET' });
		const data = await resp.json();
		return NextResponse.json(data);
	} catch (e: any) {
		return NextResponse.json({ status: 'error', info: e?.message ?? 'server error' }, { status: 500 });
	}
}


