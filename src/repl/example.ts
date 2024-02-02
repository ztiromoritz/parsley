// The entry point for usage examples and experiments

import { _v, _s, _c } from '../main';

import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';

import './plot';
import { plot } from './plot';
import { Coord } from '../coord';
import { Vect } from '../vect';
import { Segment } from '../segment';
import { Circle } from '../circle';

const editor = new EditorView({
	doc: `
let a,s,c;
function _init(){
  a = _v(0,30);
	c = _c(10,10,30);
}

function _update(){
 // a.rotate(Math.PI/32);
  if(btn("w")){ a.add(_v(0,1)) }	
  if(btn("a")){ a.add(_v(-1,0)) }	
  if(btn("s")){ a.add(_v(0,-1)) }	
  if(btn("d")){ a.add(_v(1,0)) }	

  //_v(3,4).rotate(90).normalize()
  _v(3,4).normalize()
}

function _draw(){
  clear();
  print(a);
  print(c);
}
  `,
	extensions: [basicSetup, javascript()],
	parent: document.getElementById('editor')!,
});

/*
editor.on("change", (editor) => {
	localStorage.setItem("garfunkel_editor", editor.getValue());
});
*/
editor.focus();

function createKeyboardHandler() {
	window.addEventListener('blur', () => {
		keys.clear();
	});

	window.addEventListener('keydown', (e) => {
		keys.add(e.key);
	});

	window.addEventListener('keyup', (e) => {
		keys.delete(e.key);
	});

	const keys = new Set<string>();

	return {
		is_key_down(key: string) {
			return keys.has(key);
		},
	};
}

const keyboardHandler = createKeyboardHandler();

const helper = {
	print(o: Vect | Segment | Circle) {
		const type = o?.constructor?.name as String;
		if (!type) return;
		switch (type) {
			case Vect.name:
				plot.addVect(o);
				break;
			case Segment.name:
				plot.addSegment(o);
				break;
			case Circle.name:
				plot.addCircle(o);
				break;
		}
	},

	btn(key: string) {
		return keyboardHandler.is_key_down(key);
	},

	clear() {
		plot.clear();
	},
};

Coord.setSchoolCoords();
Object.assign(window, { _v, _s, _c, ...helper });

let game: {
	_init?: () => void;
	_update?: () => void;
	_draw?: () => void;
} = {};
let running = false;

function parse() {
	const code = editor.state.doc.toString();
	const fnStr = `
	${code}
	const _result = {};
	_result._init = (()=>{ try { return _init; }catch{ return null; } })();
	_result._update = (()=>{ try { return _update; }catch{ return null; } })();
	_result._draw = (()=>{ try { return _draw; }catch{ return null; } })();
	return _result;

  `;
	const fn = new Function(fnStr);
	game = fn();
	(window as any)._game = game;
}

function start() {
	running = true;
	plot.clear();
	game._init?.();
	window.requestAnimationFrame(gameLoop);
}

function stop() {
	running = false;
}

function restart(){
	stop();
	parse();
	start();
}

const in_use_count = document.getElementById('in_use_count');
const free_count = document.getElementById('free_count');
let start_timestamp: DOMHighResTimeStamp;
const fps = 30;
const interval = 1000 / fps;
function gameLoop(timestamp: DOMHighResTimeStamp) {
	start_timestamp = start_timestamp ?? timestamp;

	const delta = timestamp - start_timestamp;
	if (delta > interval) {
		start_timestamp = timestamp - (delta % interval);

		_v(() => game._update?.());
		game._draw?.();
		in_use_count!.innerText = String(_v.pool.in_use_count());
		free_count!.innerText = String(_v.pool.free_count());
/*
		poolsize!.innerText =
			'' +
			Math.round(
				(1000 * (window.performance as any)?.memory?.usedJSHeapSize) /
				(1024 * 1024),
			) /
			1000;
			*/
	}

	if (running) {
		window.requestAnimationFrame(gameLoop);
	}
}
document.getElementById('restart')?.addEventListener('click', () => restart());
document.getElementById('start')?.addEventListener('click', () => start());
document.getElementById('stop')?.addEventListener('click', () => stop());
document.getElementById('parse')?.addEventListener('click', () => parse());

// canvas crisp render experiment
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
if (ctx) {
	ctx.imageSmoothingEnabled = false;
	ctx.scale(1, 1);
	ctx.beginPath(); // Start a new path
	ctx.moveTo(30, 50); // Move the pen to (30, 50)
	ctx.lineTo(150, 100); // Draw a line to (150, 100)
	ctx.stroke(); // Render the path
}
