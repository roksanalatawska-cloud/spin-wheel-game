class MagicWheel {
    constructor() {
        this.options = ['YES', 'NO', 'MAYBE'];
        this.colors = ['#FF6B6B', '#4ECDC4', '#FFD93D'];
        this.spinning = false;
        this.currentRotation = 0;
        this.history = this.loadHistory();
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinBtn = document.getElementById('spinBtn');
        this.questionInput = document.getElementById('questionInput');
        this.resultSection = document.getElementById('resultSection');
        this.themeToggle = document.getElementById('themeToggle');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.drawWheel();
        this.setupEventListeners();
        this.updateTheme();
        this.displayHistory();
    }

    setupCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.radius = this.canvas.width / 2 - 20;
    }

    drawWheel() {
        const sliceAngle = (2 * Math.PI) / this.options.length;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Save context state
        this.ctx.save();
        this.ctx.translate(this.centerX, this.centerY);
        this.ctx.rotate(this.currentRotation);

        // Draw slices
        for (let i = 0; i < this.options.length; i++) {
            const startAngle = i * sliceAngle;
            const endAngle = (i + 1) * sliceAngle;

            // Draw slice
            this.ctx.fillStyle = this.colors[i];
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.arc(0, 0, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fill();

            // Draw border
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // Draw text
            this.ctx.save();
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillText(this.options[i], this.radius - 30, 0);
            this.ctx.restore();
        }

        this.ctx.restore();
    }

    setupEventListeners() {
        this.spinBtn.addEventListener('click', () => this.spin());
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.questionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.spin();
        });
    }

    spin() {
        if (this.spinning) return;
        if (!this.questionInput.value.trim()) {
            alert('Please ask a question first!');
            return;
        }

        this.spinning = true;
        this.spinBtn.disabled = true;

        const spins = 5 + Math.random() * 5;
        const extraRotation = Math.random() * (2 * Math.PI);
        const finalRotation = spins * (2 * Math.PI) + extraRotation;
        
        const duration = 3000; // 3 seconds
        const startTime = Date.now();
        const startRotation = this.currentRotation;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (ease-out)
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            
            this.currentRotation = startRotation + finalRotation * easeProgress;
            this.drawWheel();

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.onSpinComplete();
            }
        };

        animate();
    }

    onSpinComplete() {
        this.spinning = false;
        this.spinBtn.disabled = false;

        // Calculate which section the pointer is on (top of wheel)
        // Normalize rotation to 0-2π
        const normalizedRotation = ((2 * Math.PI - (this.currentRotation % (2 * Math.PI))) + 2 * Math.PI) % (2 * Math.PI);
        const sliceAngle = (2 * Math.PI) / this.options.length;
        const index = Math.floor((normalizedRotation / sliceAngle) % this.options.length);

        const result = this.options[index];
        const question = this.questionInput.value.trim();

        this.displayResult(result, question);
        this.addToHistory(question, result);
        this.questionInput.value = '';
    }

    displayResult(result, question) {
        const advice = this.getAdvice(result);
        
        document.getElementById('resultText').textContent = result;
        document.getElementById('questionDisplay').textContent = `"${question}"`;
        document.getElementById('adviceText').textContent = advice;
        
        this.resultSection.style.display = 'block';
    }

    getAdvice(result) {
        const adviceMap = {
            'YES': '✨ The universe says YES! Go for it with confidence! ✨',
            'NO': '🚫 The universe suggests thinking twice about this. 🚫',
            'MAYBE': '🤔 The answer is unclear. Trust your instincts and explore further. 🤔'
        };
        return adviceMap[result] || '';
    }

    addToHistory(question, result) {
        const entry = {
            question,
            result,
            timestamp: new Date().toLocaleTimeString()
        };
        this.history.unshift(entry);
        this.history = this.history.slice(0, 10); // Keep only last 10
        this.saveHistory();
        this.displayHistory();
    }

    displayHistory() {
        const historyList = document.getElementById('historyList');
        historyList.innerHTML = '';

        if (this.history.length === 0) {
            historyList.innerHTML = '<li class="history-empty">No spins yet. Ask a question!</li>';
            return;
        }

        this.history.forEach((entry, index) => {
            const li = document.createElement('li');
            const resultEmoji = this.getResultEmoji(entry.result);
            li.textContent = `${resultEmoji} "${entry.question}" → ${entry.result}`;
            li.title = entry.timestamp;
            historyList.appendChild(li);
        });
    }

    getResultEmoji(result) {
        const emojiMap = {
            'YES': '✅',
            'NO': '❌',
            'MAYBE': '❓'
        };
        return emojiMap[result] || '';
    }

    saveHistory() {
        localStorage.setItem('wheelHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const saved = localStorage.getItem('wheelHistory');
        return saved ? JSON.parse(saved) : [];
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            this.history = [];
            this.saveHistory();
            this.displayHistory();
        }
    }

    toggleTheme() {
        this.darkMode = !this.darkMode;
        this.updateTheme();
        localStorage.setItem('darkMode', this.darkMode);
    }

    updateTheme() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
            this.themeToggle.textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            this.themeToggle.textContent = '🌙';
        }
    }
}

// Initialize the wheel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MagicWheel();
});
