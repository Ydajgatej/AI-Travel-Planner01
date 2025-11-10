import { NextRequest, NextResponse } from 'next/server';

type AnalyzeBody = {
	plan: {
		title: string;
		destination?: string;
		date_range?: string;
		budget?: number;
		num_people?: number;
		preferences?: string;
		content?: string;
	};
	expenses: Array<{
		amount: number;
		category?: string | null;
		note?: string | null;
		currency?: string | null;
		occurred_at?: string | null;
	}>;
};

export async function POST(req: NextRequest) {
	try {
		const body = (await req.json()) as AnalyzeBody;
		const keyFromHeader = req.headers.get('x-llm-api-key') || '';
		const modelFromHeader = req.headers.get('x-llm-model') || '';
		const apiKey = keyFromHeader || process.env.LLM_DASHSCOPE_API_KEY || '';
		const model = modelFromHeader || process.env.LLM_DASHSCOPE_MODEL || 'qwen-plus';
		if (!apiKey) {
			return NextResponse.json({ error: '缺少 LLM API Key' }, { status: 400 });
		}
		const lines: string[] = [];
		lines.push('你是旅行预算分析顾问，请基于以下行程与真实支出进行专业分析与建议。');
		lines.push(`行程：${body.plan.title}`);
		if (body.plan.destination) lines.push(`目的地：${body.plan.destination}`);
		if (body.plan.date_range) lines.push(`日期：${body.plan.date_range}`);
		if (typeof body.plan.budget === 'number') lines.push(`目标预算：${body.plan.budget}`);
		if (typeof body.plan.num_people === 'number') lines.push(`人数：${body.plan.num_people}`);
		if (body.plan.preferences) lines.push(`偏好：${body.plan.preferences}`);
		lines.push('');
		lines.push('支出明细（最近在前）：');
		if (!body.expenses || body.expenses.length === 0) {
			lines.push('- 暂无支出记录');
		} else {
			for (const e of body.expenses) {
				lines.push(`- ${e.amount} ${e.currency || 'CNY'} | ${e.category || '其他'} | ${e.occurred_at || ''} | ${e.note || ''}`);
			}
		}
		lines.push('');
		lines.push('请输出：');
		lines.push('1) 各类支出占比与超支风险；2) 与目标预算的偏差；3) 节省建议（按影响力排序）；4) 未来几日的支出分配建议。');
		const prompt = lines.join('\n');

		const resp = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				temperature: 0.4
			})
		});
		if (!resp.ok) {
			const text = await resp.text();
			return NextResponse.json({ error: text }, { status: 500 });
		}
		const data = await resp.json();
		const analysis: string = data?.choices?.[0]?.message?.content || '';
		return NextResponse.json({ analysis });
	} catch (e: any) {
		return NextResponse.json({ error: e?.message ?? '服务器错误' }, { status: 500 });
	}
}


