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
		// 这里示例调用阿里百炼 DashScope 通用对话接口（占位，需根据实际模型与参数完善）
		const prompt = [
			'你是旅行规划专家，请根据用户需求生成详细的日程规划：',
			`目的地：${body.destination}`,
			`日期：${body.startDate} ~ ${body.endDate}`,
			`预算：约 ${body.budgetCny} 元`,
			`人数：${body.numPeople} 人`,
			`偏好：${body.preferences}`,
			'输出结构包含：每日行程、交通方案、住宿建议、景点/餐厅清单（含地址、简述）、注意事项。'
		].join('\n');

		// 官方 SDK 也可使用。此处演示纯 HTTP 请求（需替换为有效 endpoint 和参数）
		const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.7
			})
		});
		if (!resp.ok) {
			const text = await resp.text();
			return NextResponse.json({ error: `LLM 调用失败：${text}` }, { status: 500 });
		}
		const data = await resp.json();
		const planText: string =
			data?.choices?.[0]?.message?.content ??
			'抱歉，未能生成行程。请稍后重试或检查 API Key 与模型名称配置。';
		return NextResponse.json({ plan: planText });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? '服务器错误' }, { status: 500 });
	}
}


