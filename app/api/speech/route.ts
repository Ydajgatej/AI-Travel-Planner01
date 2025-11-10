import { NextResponse } from 'next/server';

// 占位：如果需要通过服务端与科大讯飞进行 token 交换或签名，可在此实现。
// 当前前端默认使用 Web Speech API；当浏览器不支持时，引导用户在设置页配置正式的语音方案。

export async function GET() {
	return NextResponse.json({ ok: true, message: '语音服务占位（未启用）' });
}


