/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Creation } from '../components/CreationHistory';

export const fallbackExamples: Creation[] = [
  {
    id: 'chess-example-id',
    name: 'Chess.json (Bobby\'s Board)',
    timestamp: new Date('2026-07-08T10:00:00Z'),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bobby's Chess Sandbox</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background: radial-gradient(circle at center, #1e1b4b, #030712);
            font-family: 'Courier New', Courier, monospace;
        }
        .board {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            grid-template-rows: repeat(8, 1fr);
            aspect-ratio: 1;
            border: 12px solid #312e81;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .square {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3rem;
            cursor: pointer;
            transition: all 0.2s;
            user-select: none;
        }
        .light { background-color: #e0e7ff; color: #1e1b4b; }
        .dark { background-color: #4f46e5; color: #faf5ff; }
        .square:hover {
            filter: brightness(1.1);
        }
        .selected {
            background-color: #fbbf24 !important;
        }
    </style>
</head>
<body class="min-h-screen text-zinc-100 p-8 flex flex-col items-center justify-center">
    <div class="max-w-2xl w-full flex flex-col items-center">
        <h1 class="text-3xl font-extrabold text-indigo-400 mb-2 tracking-wider uppercase text-center">Bobby's Chess Match</h1>
        <p class="text-xs text-zinc-400 mb-6 text-center tracking-wide">Interactive sandbox board. Click a piece, then click a target square to move.</p>
        
        <div class="board w-full max-w-md rounded-lg overflow-hidden" id="board"></div>
        
        <div class="mt-6 p-4 bg-indigo-950/40 rounded-xl border border-indigo-900/50 w-full max-w-md text-center">
            <p id="status" class="text-xs font-semibold text-indigo-300">White's Turn to Move</p>
        </div>
    </div>

    <script>
        const initialBoard = [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', ''],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];

        let selected = null;
        let isWhiteTurn = true;
        const boardEl = document.getElementById('board');
        const statusEl = document.getElementById('status');

        function render() {
            boardEl.innerHTML = '';
            for (let r = 0; r < 8; r++) {
                for (let c = 0; c < 8; c++) {
                    const square = document.createElement('div');
                    const isDark = (r + c) % 2 === 1;
                    square.className = 'square ' + (isDark ? 'dark' : 'light');
                    if (selected && selected.r === r && selected.c === c) {
                        square.classList.add('selected');
                    }
                    square.innerText = initialBoard[r][c];
                    
                    square.addEventListener('click', () => handleSquareClick(r, c));
                    boardEl.appendChild(square);
                }
            }
        }

        function handleSquareClick(r, c) {
            const piece = initialBoard[r][c];
            
            if (selected) {
                if (selected.r === r && selected.c === c) {
                    selected = null;
                } else {
                    initialBoard[r][c] = initialBoard[selected.r][selected.c];
                    initialBoard[selected.r][selected.c] = '';
                    selected = null;
                    isWhiteTurn = !isWhiteTurn;
                    statusEl.innerText = isWhiteTurn ? "White's Turn to Move" : "Black's Turn to Move";
                }
                render();
            } else if (piece !== '') {
                selected = { r, c };
                render();
            }
        }

        render();
    </script>
</body>
</html>`
  },
  {
    id: 'cassette-example-id',
    name: 'Cassette.json (Retro Mixtape)',
    timestamp: new Date('2026-07-08T09:30:00Z'),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Retro Cassette Player</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .spinning {
            animation: spin 3s linear infinite;
        }
        body {
            background-color: #0c0a09;
            background-image: radial-gradient(#1c1917 1px, transparent 1px);
            background-size: 24px 24px;
        }
    </style>
</head>
<body class="min-h-screen text-stone-100 flex flex-col items-center justify-center p-6">
    <div class="max-w-md w-full bg-stone-900 border-4 border-stone-800 p-6 rounded-2xl shadow-2xl relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
        
        <h1 class="text-2xl font-black tracking-widest text-pink-500 uppercase text-center mb-1">Retro Cassette DJ</h1>
        <p class="text-[10px] text-stone-500 font-mono tracking-widest uppercase text-center mb-6">Stereo Dolby Sound / CrO2</p>

        <!-- Cassette Shell -->
        <div class="w-full aspect-[1.6] bg-stone-950 border-4 border-stone-800 rounded-xl p-4 flex flex-col justify-between relative shadow-inner">
            <!-- Label -->
            <div class="bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-500 p-0.5 rounded-lg flex-1 flex flex-col justify-between">
                <div class="bg-stone-900/95 rounded-md h-full w-full p-2.5 flex flex-col justify-between">
                    <input type="text" id="tape-label" value="AWESOME RETRO MIX '88" class="bg-transparent border-b border-stone-800 focus:border-pink-500 text-xs font-mono font-bold tracking-wider text-center text-zinc-100 focus:outline-none w-full">
                    
                    <!-- Spindles View -->
                    <div class="flex justify-around items-center my-2">
                        <div class="w-12 h-12 rounded-full bg-stone-950 border-2 border-stone-800 flex items-center justify-center relative">
                            <div id="spindle-left" class="w-8 h-8 rounded-full border-4 border-dashed border-stone-700 flex items-center justify-center">
                                <div class="w-3 h-3 bg-stone-900 rounded-full"></div>
                            </div>
                        </div>
                        <div class="w-20 h-6 bg-stone-950/80 rounded border border-stone-800 flex items-center justify-center">
                            <span class="text-[9px] font-mono text-cyan-400 font-bold tracking-widest" id="time-display">0:00</span>
                        </div>
                        <div class="w-12 h-12 rounded-full bg-stone-950 border-2 border-stone-800 flex items-center justify-center relative">
                            <div id="spindle-right" class="w-8 h-8 rounded-full border-4 border-dashed border-stone-700 flex items-center justify-center">
                                <div class="w-3 h-3 bg-stone-900 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tape Deck Controls -->
        <div class="mt-6 grid grid-cols-4 gap-2 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
            <button id="btn-play" class="py-2 rounded bg-stone-800 hover:bg-stone-700 active:bg-pink-600 active:text-white text-xs font-bold tracking-widest font-mono text-stone-300">PLAY</button>
            <button id="btn-pause" class="py-2 rounded bg-stone-800 hover:bg-stone-700 active:bg-purple-600 active:text-white text-xs font-bold tracking-widest font-mono text-stone-300">PAUSE</button>
            <button id="btn-rew" class="py-2 rounded bg-stone-800 hover:bg-stone-700 active:bg-cyan-600 active:text-white text-xs font-bold tracking-widest font-mono text-stone-300">REW</button>
            <button id="btn-ff" class="py-2 rounded bg-stone-800 hover:bg-stone-700 active:bg-cyan-600 active:text-white text-xs font-bold tracking-widest font-mono text-stone-300">F.FWD</button>
        </div>

        <div class="mt-4 p-3 bg-stone-950 border border-stone-800 rounded-lg text-center">
            <p class="text-[10px] font-mono text-stone-500 uppercase tracking-widest mb-1">Sound Synthesizer Status</p>
            <p id="playback-status" class="text-xs font-bold tracking-wide text-pink-400">TAPE IDLE</p>
        </div>
    </div>

    <script>
        let isPlaying = false;
        let time = 0;
        let interval = null;

        const spindleLeft = document.getElementById('spindle-left');
        const spindleRight = document.getElementById('spindle-right');
        const playbackStatus = document.getElementById('playback-status');
        const timeDisplay = document.getElementById('time-display');

        function startSpindles() {
            spindleLeft.classList.add('spinning');
            spindleRight.classList.add('spinning');
        }

        function stopSpindles() {
            spindleLeft.classList.remove('spinning');
            spindleRight.classList.remove('spinning');
        }

        document.getElementById('btn-play').addEventListener('click', () => {
            if (isPlaying) return;
            isPlaying = true;
            playbackStatus.innerText = "PLAYING TAPE...";
            playbackStatus.className = "text-xs font-bold tracking-wide text-green-400";
            startSpindles();

            interval = setInterval(() => {
                time++;
                const mins = Math.floor(time / 60);
                const secs = time % 60;
                timeDisplay.innerText = \`\${mins}:\${secs < 10 ? '0' : ''}\${secs}\`;
            }, 1000);
        });

        document.getElementById('btn-pause').addEventListener('click', () => {
            if (!isPlaying) return;
            isPlaying = false;
            playbackStatus.innerText = "PLAYBACK PAUSED";
            playbackStatus.className = "text-xs font-bold tracking-wide text-amber-400";
            stopSpindles();
            clearInterval(interval);
        });

        document.getElementById('btn-rew').addEventListener('click', () => {
            isPlaying = false;
            stopSpindles();
            clearInterval(interval);
            time = 0;
            timeDisplay.innerText = "0:00";
            playbackStatus.innerText = "REWINED TO START";
            playbackStatus.className = "text-xs font-bold tracking-wide text-cyan-400";
        });

        document.getElementById('btn-ff').addEventListener('click', () => {
            isPlaying = false;
            stopSpindles();
            clearInterval(interval);
            time += 30;
            const mins = Math.floor(time / 60);
            const secs = time % 60;
            timeDisplay.innerText = \`\${mins}:\${secs < 10 ? '0' : ''}\${secs}\`;
            playbackStatus.innerText = "FAST FORWARDED +30s";
            playbackStatus.className = "text-xs font-bold tracking-wide text-purple-400";
        });
    </script>
</body>
</html>`
  },
  {
    id: 'vibecode-example-id',
    name: 'Vibecode-blog.json (Artistic Log)',
    timestamp: new Date('2026-07-08T09:00:00Z'),
    html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeCode Editorial Board</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;600&display=swap');
        .serif { font-family: 'Playfair Display', serif; }
        .sans { font-family: 'Plus Jakarta Sans', sans-serif; }
    </style>
</head>
<body class="bg-[#fafaf9] text-[#1c1917] sans min-h-screen flex flex-col justify-between selection:bg-amber-100">
    <header class="border-b border-[#e7e5e4] py-6 px-8 max-w-5xl mx-auto w-full flex justify-between items-center">
        <h1 class="serif text-2xl font-bold tracking-tight">VibeCode.</h1>
        <nav class="flex space-x-6 text-sm font-medium text-[#78716c]">
            <a href="#" class="hover:text-black transition-colors">Issues</a>
            <a href="#" class="hover:text-black transition-colors">About</a>
            <a href="#" class="hover:text-black transition-colors">Design Log</a>
        </nav>
    </header>

    <main class="max-w-3xl mx-auto w-full px-6 py-12 flex-1">
        <article class="space-y-6">
            <div class="space-y-2">
                <span class="text-xs uppercase font-semibold tracking-widest text-amber-700">Issue #12 / Digital Aesthetics</span>
                <h2 class="serif text-4xl font-bold leading-tight md:text-5xl">The Sublime Elegance of Micro-Interactions</h2>
                <div class="flex items-center space-x-3 text-sm text-[#78716c] pt-2">
                    <span class="font-medium text-[#1c1917]">Elara Sterling</span>
                    <span>•</span>
                    <span>July 2026</span>
                </div>
            </div>

            <div class="h-[1px] bg-gradient-to-r from-[#e7e5e4] via-transparent to-[#e7e5e4] my-4"></div>

            <p class="text-base md:text-lg leading-relaxed text-[#44403c] serif italic">
                "We design not merely for eyes, but for fingertips, expectations, and the subconscious rhythmic cycles of human interaction."
            </p>

            <p class="text-base md:text-lg leading-relaxed text-[#44403c]">
                A digital interface is not a painting. It is a live organism that answers, resists, or yields. When a button yields under a mouse-click, it is mimicking the organic feedback loops of our tactile reality.
            </p>

            <div class="p-6 bg-[#f5f5f4] rounded-xl border border-[#e7e5e4] my-8">
                <h4 class="text-sm font-bold uppercase tracking-wider mb-3">Interactive Design Checklist</h4>
                <div class="space-y-2">
                    <label class="flex items-center space-x-3 text-sm cursor-pointer">
                        <input type="checkbox" checked class="accent-amber-700 h-4 w-4 rounded">
                        <span>Generous, breathable negative space</span>
                    </label>
                    <label class="flex items-center space-x-3 text-sm cursor-pointer">
                        <input type="checkbox" checked class="accent-amber-700 h-4 w-4 rounded">
                        <span>Balanced typography pairings (Serif/Sans)</span>
                    </label>
                    <label class="flex items-center space-x-3 text-sm cursor-pointer">
                        <input type="checkbox" id="vibe-mode-chk" class="accent-amber-700 h-4 w-4 rounded">
                        <span class="font-semibold text-amber-800">Activate High-Contrast Dark Editorial Mode</span>
                    </label>
                </div>
            </div>
        </article>
    </main>

    <footer class="border-t border-[#e7e5e4] py-8 text-center text-xs text-[#78716c]">
        <p>© 2026 VibeCode. All rights reserved.</p>
    </footer>

    <script>
        const chk = document.getElementById('vibe-mode-chk');
        chk.addEventListener('change', () => {
            if (chk.checked) {
                document.body.style.backgroundColor = '#1c1917';
                document.body.style.color = '#fafaf9';
                document.querySelector('main').style.color = '#fafaf9';
                document.querySelectorAll('p').forEach(p => p.style.color = '#e7e5e4');
            } else {
                document.body.style.backgroundColor = '#fafaf9';
                document.body.style.color = '#1c1917';
                document.querySelector('main').style.color = '#1c1917';
                document.querySelectorAll('p').forEach(p => p.style.color = '#44403c');
            }
        });
    </script>
</body>
</html>`
  }
];
