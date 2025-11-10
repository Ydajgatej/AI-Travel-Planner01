'use client';
import React from 'react';

export default function SettingsPage() {
	const [amapKey, setAmapKey] = React.useState<string>('');
	const [llmKey, setLlmKey] = React.useState<string>('');
	const [llmModel, setLlmModel] = React.useState<string>('qwen-plus');
	const [amapWebKey, setAmapWebKey] = React.useState<string>('');
	const [msg, setMsg] = React.useState<string>('');

	React.useEffect(() => {
		setAmapKey(localStorage.getItem('amap_js_key') ?? '');
		setLlmKey(localStorage.getItem('llm_api_key') ?? '');
		setLlmModel(localStorage.getItem('llm_model') ?? 'qwen-plus');
		setAmapWebKey(localStorage.getItem('amap_web_key') ?? '');
	}, []);

	function save() {
		localStorage.setItem('amap_js_key', amapKey);
		localStorage.setItem('llm_api_key', llmKey);
		localStorage.setItem('llm_model', llmModel);
		localStorage.setItem('amap_web_key', amapWebKey);
		setMsg('已保存（仅保存在本机浏览器）');
	}

	return (
		<div className="card col">
			<h3 style={{ marginTop: 0 }}>设置</h3>
			<div className="col">
				<label>高德地图 JS SDK Key</label>
				<input value={amapKey} onChange={e => setAmapKey(e.target.value)} placeholder="仅本地保存到浏览器，不上传服务器" />
				<small>填写后刷新首页以加载地图。也可使用服务端环境变量 NEXT_PUBLIC_AMAP_JS_SDK_KEY。</small>
			</div>
			<div className="col">
				<label>阿里百炼 LLM API Key</label>
				<input value={llmKey} onChange={e => setLlmKey(e.target.value)} placeholder="仅本地保存到浏览器，不上传服务器" />
				<small>用于调用 /api/plan 与 /api/budget。也可在服务端使用环境变量 LLM_DASHSCOPE_API_KEY。</small>
			</div>
			<div className="col">
				<label>阿里百炼大模型名称</label>
				<input value={llmModel} onChange={e => setLlmModel(e.target.value)} placeholder="例如：qwen-plus 或 qwen-max 等" />
				<small>前端会把该模型名通过请求头传给服务器；服务器亦可通过环境变量 LLM_DASHSCOPE_MODEL 覆盖。</small>
			</div>
			<div className="col">
				<label>高德 Web 服务密钥（地理编码）</label>
				<input value={amapWebKey} onChange={e => setAmapWebKey(e.target.value)} placeholder="可只在本机保存或使用服务器环境变量 AMAP_WEB_SERVICE_KEY" />
				<small>用于 /api/geocode 代理调用地理编码（更安全，不在前端暴露）。</small>
			</div>
			<div className="row">
				<button className="primary" onClick={save}>保存</button>
				{msg && <small>{msg}</small>}
			</div>
		</div>
	);
}


