// 遊戲配置
const config = {
    rows: 10,
    columns: 10,
    totalBubbles: 100,
    soundEnabled: false
};

// 表情符號列表
const emojis = ['🤣', '🤪', '😆', '😝', '😋', '🥳', '🤩', '😜', '😊', '😎'];

// 音效系統 - 延遲初始化避免自動播放限制
let audioContext = null;

// 初始化音頻上下文 - 需要在用戶互動後調用
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

// 音效生成函數
function createPopSound(frequency = 500, duration = 0.1) {
    if (!config.soundEnabled) return;
    
    try {
        const context = initAudioContext();
        if (!context) return;
        
        // 建立音頻振盪器
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        // 設定頻率和音量
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        gainNode.gain.setValueAtTime(0.1, context.currentTime);
        
        // 設定音頻消失的曲線
        gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
        
        // 連接並播放
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration);
    } catch (error) {
        console.log('Error playing sound:', error);
    }
}

function createCompleteSound() {
    if (!config.soundEnabled) return;
    
    // 產生一段歡快的音效
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
        setTimeout(() => {
            createPopSound(freq, 0.2);
        }, index * 150);
    });
}

// 遊戲狀態
const gameState = {
    poppedCount: 0,
    remainingCount: config.totalBubbles,
    isCompleted: false,
    isDragging: false
};

// DOM 元素
const elements = {
    bubbleWrap: document.getElementById('bubble-wrap'),
    popCount: document.getElementById('pop-count'),
    remainingCount: document.getElementById('remaining-count'),
    resetBtn: document.getElementById('reset-btn'),
    soundToggle: document.getElementById('sound-toggle'),
    completionMessage: document.getElementById('completion-message'),
    totalPops: document.getElementById('total-pops'),
    playAgainBtn: document.getElementById('play-again-btn')
};

// 畫面震動效果
function shakeScreen() {
    document.body.classList.add('shake');
    setTimeout(() => {
        document.body.classList.remove('shake');
    }, 200);
}

// 初始化泡泡紙
function initBubbleWrap() {
    elements.bubbleWrap.innerHTML = '';
    
    for (let i = 0; i < config.totalBubbles; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.setAttribute('data-index', i);
        elements.bubbleWrap.appendChild(bubble);
    }
    
    gameState.poppedCount = 0;
    gameState.remainingCount = config.totalBubbles;
    gameState.isCompleted = false;
    
    updateCounters();
    elements.completionMessage.style.display = 'none';
}

// 更新計數器
function updateCounters() {
    elements.popCount.textContent = gameState.poppedCount;
    elements.remainingCount.textContent = gameState.remainingCount;
}

// 播放泡泡音效
function playPopSound() {
    if (!config.soundEnabled) return;
    
    // 隨機頻率，使音效有變化
    const frequency = 400 + Math.random() * 300; // 400-700 Hz
    createPopSound(frequency, 0.15);
}

// 播放完成音效
function playCompleteSound() {
    if (!config.soundEnabled) return;
    createCompleteSound();
}

// 創建表情符號動畫
function createEmojiPop(x, y) {
    const emoji = document.createElement('div');
    emoji.className = 'emoji-pop';
    emoji.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    emoji.style.left = `${x}px`;
    emoji.style.top = `${y}px`;
    document.body.appendChild(emoji);
    
    // 動畫結束後移除元素
    emoji.addEventListener('animationend', () => {
        document.body.removeChild(emoji);
    });
}

// 處理泡泡點擊
function popBubble(bubble, clientX, clientY) {
    if (bubble.classList.contains('popped')) {
        return;
    }
    
    bubble.classList.add('popped');
    
    // 播放音效
    playPopSound();
    
    // 創建表情符號動畫
    // 如果沒有提供座標，使用泡泡的位置
    if (typeof clientX === 'undefined' || typeof clientY === 'undefined') {
        const rect = bubble.getBoundingClientRect();
        clientX = rect.left + rect.width / 2;
        clientY = rect.top + rect.height / 2;
    }
    createEmojiPop(clientX, clientY);
    
    gameState.poppedCount++;
    gameState.remainingCount--;
    updateCounters();
    
    if (gameState.remainingCount === 0 && !gameState.isCompleted) {
        gameState.isCompleted = true;
        setTimeout(() => {
            showCompletionMessage();
        }, 500);
    }
}

// 顯示完成訊息
function showCompletionMessage() {
    elements.totalPops.textContent = gameState.poppedCount;
    elements.completionMessage.style.display = 'block';
    playCompleteSound();
}

// 點擊事件處理
function handleBubbleClick(event) {
    const bubble = event.target;
    
    // 確認點擊的是泡泡元素
    if (bubble.classList.contains('bubble')) {
        popBubble(bubble, event.clientX, event.clientY);
    }
}

// 拖曳事件處理
function handleDragStart(event) {
    gameState.isDragging = true;
    
    // 如果點擊在泡泡上，立即處理這個泡泡
    if (event.target.classList.contains('bubble')) {
        popBubble(event.target, event.clientX, event.clientY);
    }
}

function handleDragMove(event) {
    if (!gameState.isDragging) return;
    
    // 找出滑鼠下方的元素
    const elementsUnderPointer = document.elementsFromPoint(event.clientX, event.clientY);
    
    // 檢查是否有泡泡在滑鼠下方
    for (const element of elementsUnderPointer) {
        if (element.classList.contains('bubble')) {
            popBubble(element, event.clientX, event.clientY);
            break;
        }
    }
}

function handleDragEnd() {
    gameState.isDragging = false;
}

// 設置事件監聽器
function setupEventListeners() {
    // 點擊事件
    elements.bubbleWrap.addEventListener('click', handleBubbleClick);
    
    // 拖曳事件 (觸控和滑鼠)
    elements.bubbleWrap.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // 觸控事件
    elements.bubbleWrap.addEventListener('touchstart', (e) => {
        // 只有在泡泡上才阻止預設行為
        if (e.target.classList.contains('bubble')) {
            e.preventDefault();
        }
        const touch = e.touches[0];
        handleDragStart({
            clientX: touch.clientX,
            clientY: touch.clientY,
            target: document.elementFromPoint(touch.clientX, touch.clientY)
        });
    }, { passive: false });
    
    document.addEventListener('touchmove', (e) => {
        if (!gameState.isDragging) return;
        
        // 只有在泡泡上才阻止預設行為
        const touch = e.touches[0];
        const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
        if (elementUnderTouch && elementUnderTouch.classList.contains('bubble')) {
            e.preventDefault();
        }
        
        handleDragMove({
            clientX: touch.clientX,
            clientY: touch.clientY
        });
    }, { passive: false });
    
    document.addEventListener('touchend', handleDragEnd);
    
    // 重置按鈕
    elements.resetBtn.addEventListener('click', () => {
        initBubbleWrap();
    });
    
    // 再玩一次按鈕
    elements.playAgainBtn.addEventListener('click', () => {
        initBubbleWrap();
    });
    
    // 音效開關
    elements.soundToggle.addEventListener('change', (e) => {
        config.soundEnabled = e.target.checked;
    });
}

// 初始化遊戲
function initGame() {
    initBubbleWrap();
    setupEventListeners();
}

// 當DOM載入完成後初始化遊戲
document.addEventListener('DOMContentLoaded', initGame); 