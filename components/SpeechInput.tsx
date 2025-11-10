'use client';
import React from 'react';

export function SpeechInput({ onText }: { onText: (t: string) => void }) {
	const [recording, setRecording] = React.useState(false);
	const recognitionRef = React.useRef<any>(null);

	function initWebSpeech(): boolean {
		if (typeof window === 'undefined') return false;
		const w = window as any;
		const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
		if (!Ctor) return false;
		const recog = new Ctor();
		recog.lang = 'zh-CN';
		recog.continuous = false;
		recog.interimResults = false;
		recog.onresult = (e: any) => {
			const transcript = e.results?.[0]?.[0]?.transcript || '';
			if (transcript) onText(transcript);
		};
		recog.onend = () => setRecording(false);
		recognitionRef.current = recog;
		return true;
	}

	function start() {
		if (!initWebSpeech()) {
			alert('本浏览器不支持 Web Speech API，请在设置页配置讯飞语音。');
			return;
		}
		setRecording(true);
		recognitionRef.current.start();
	}
	function stop() {
		recognitionRef.current?.stop?.();
	}
	return (
		<div className="row">
			<button className={recording ? 'ghost' : 'primary'} onClick={recording ? stop : start}>
				{recording ? '停止录音' : '语音输入'}
			</button>
		</div>
	);
}


