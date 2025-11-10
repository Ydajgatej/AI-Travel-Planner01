import { NextRequest, NextResponse } from 'next/server';

type PlanRequest = {
	destination: string;
	startDate: string;
	endDate: string;
	budgetCny: number;
	numPeople: number;
	preferences: string;
};

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as PlanRequest;
		const keyFromHeader = req.headers.get('x-llm-api-key') || '';
		const modelFromHeader = req.headers.get('x-llm-model') || '';
		const apiKey = keyFromHeader || process.env.LLM_DASHSCOPE_API_KEY || '';
		const model = modelFromHeader || process.env.LLM_DASHSCOPE_MODEL || 'qwen-plus';
		if (!apiKey) {
			return NextResponse.json({ error: '缺少 LLM API Key，请在设置页或服务端环境变量中配置' }, { status: 400 });
		}
		const prompt = [
			'根据旅行需求给出费用预算的明细估算（交通/住宿/餐饮/门票/其他），并给出预算区间与节省建议：',
			`目的地：${body.destination}`,
			`日期：${body.startDate} ~ ${body.endDate}`,
			`人数：${body.numPeople} 人`,
			`期望预算：${body.budgetCny} 元`,
			`偏好：${body.preferences}`
		].join('\n');

		const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.3
			})
		});
		if (!resp.ok) {
			const text = await resp.text();
			return NextResponse.json({ error: `LLM 调用失败：${text}` }, { status: 500 });
		}
		const data = await resp.json();
		const budgetText: string =
			data?.choices?.[0]?.message?.content ??
			'抱歉，未能生成预算估计。';
		return NextResponse.json({ budget: budgetText });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? '服务器错误' }, { status: 500 });
	}
}


