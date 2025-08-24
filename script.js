class MemoryQuizGame {
    constructor() {
        this.images = [];
        this.currentQuiz = [];
        this.currentIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 10;
        this.editingIndex = -1;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.setupScreen = document.getElementById('setup-screen');
        this.quizScreen = document.getElementById('quiz-screen');
        this.resultsScreen = document.getElementById('results-screen');
        this.imageList = document.getElementById('image-list');
        this.quizImage = document.getElementById('quiz-image');
        this.answerInput = document.getElementById('answer-input');
        this.timerText = document.getElementById('timer-text');
        this.timerBar = document.querySelector('.timer-bar');
        this.scoreDisplay = document.getElementById('score');
        this.currentCount = document.getElementById('current-count');
        this.totalCount = document.getElementById('total-count');
        this.finalScore = document.getElementById('final-score');
        this.globalTimeInput = document.getElementById('global-time-input');
        
        // Modal elements
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalImageInput = document.getElementById('modal-image-input');
        this.modalNamesInput = document.getElementById('modal-names-input');
        this.modalCancel = document.getElementById('modal-cancel');
        this.modalSave = document.getElementById('modal-save');
        
        // File operations
        this.importBtn = document.getElementById('import-btn');
        this.importFile = document.getElementById('import-file');
        this.saveBtn = document.getElementById('save-btn');
        
        // Action buttons
        this.addNewBtn = document.getElementById('add-new-btn');
        this.playBtn = document.getElementById('play-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.backBtn = document.getElementById('back-btn');
        
        // Tierlist import elements
        this.tierlistInput = document.getElementById('tierlist-input');
        this.importTierlistBtn = document.getElementById('import-tierlist-btn');
        this.tierlistFileInput = document.getElementById('tierlist-file-input');
    }

    bindEvents() {
        this.addNewBtn.addEventListener('click', () => this.openModal());
        this.modalCancel.addEventListener('click', () => this.closeModal());
        this.modalSave.addEventListener('click', () => this.saveItem());
        this.playBtn.addEventListener('click', () => this.startQuiz());
        this.answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.checkAnswer();
        });
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.backBtn.addEventListener('click', () => this.backToSetup());
        
        // File operations
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.importData(e));
        this.saveBtn.addEventListener('click', () => this.saveData());
        
        // Modal close
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // Tierlist import events - ensure these are properly bound
        this.importTierlistBtn.addEventListener('click', () => this.tierlistFileInput.click());
        this.tierlistFileInput.addEventListener('change', (e) => this.importTierlistData(e));
    }

    openModal(index = -1) {
        this.editingIndex = index;
        this.modalTitle.textContent = index === -1 ? 'Add New Item' : 'Edit Item';
        
        if (index === -1) {
            // Adding new
            this.modalImageInput.value = '';
            this.modalNamesInput.value = '';
        } else {
            // Editing existing
            const item = this.images[index];
            this.modalImageInput.value = '';
            this.modalNamesInput.value = item.names.join('\n');
        }
        
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.editingIndex = -1;
    }

    saveItem() {
        const names = this.modalNamesInput.value
            .split('\n')
            .map(n => n.trim())
            .filter(n => n);

        if (names.length === 0) {
            alert('Please enter at least one name');
            return;
        }

        const sourceType = document.querySelector('input[name="imageSource"]:checked').value;
        
        if (this.editingIndex === -1) {
            // Adding new
            if (sourceType === 'file') {
                const file = this.modalImageInput.files[0];
                if (!file) {
                    alert('Please select an image');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.createImageItem(e.target.result, names);
                };
                reader.readAsDataURL(file);
            } else {
                // URL input
                const url = document.getElementById('modal-url-input').value.trim();
                if (!url) {
                    alert('Please enter an image URL');
                    return;
                }
                this.createImageItem(url, names);
            }
        } else {
            // Editing existing
            const item = this.images[this.editingIndex];
            if (sourceType === 'file') {
                const file = this.modalImageInput.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        item.src = e.target.result;
                        item.names = names.map(n => n.toLowerCase());
                        this.renderImageList();
                    };
                    reader.readAsDataURL(file);
                } else {
                    item.names = names.map(n => n.toLowerCase());
                    this.renderImageList();
                }
            } else {
                const url = document.getElementById('modal-url-input').value.trim();
                if (url) {
                    item.src = url;
                    item.names = names.map(n => n.toLowerCase());
                    this.renderImageList();
                } else {
                    item.names = names.map(n => n.toLowerCase());
                    this.renderImageList();
                }
            }
        }
        
        this.closeModal();
    }

    createImageItem(src, names) {
        // Create a 250x250 canvas and draw the image scaled
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 250;
            canvas.height = 250;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 250, 250);
            
            this.images.push({
                src: canvas.toDataURL('image/png'),
                names: names.map(n => n.toLowerCase()),
                id: Date.now()
            });
            this.renderImageList();
        };
        img.src = src;
    }

    renderImageList() {
        this.imageList.innerHTML = '';
        this.images.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'image-item';
            div.innerHTML = `
                <img src="${item.src}" alt="${item.names[0]}">
                <p>${item.names.join(', ')}</p>
                <div class="image-actions">
                    <button class="edit-btn" onclick="game.openModal(${index})">Edit</button>
                    <button class="delete-btn" onclick="game.deleteItem(${index})">Delete</button>
                </div>
            `;
            this.imageList.appendChild(div);
        });
    }

    deleteItem(index) {
        if (confirm('Delete this item?')) {
            this.images.splice(index, 1);
            this.renderImageList();
        }
    }

    startQuiz() {
        if (this.images.length === 0) {
            alert('Please add some images first!');
            return;
        }

        // Create quiz array with all possible image-name combinations
        this.currentQuiz = [];
        this.images.forEach(image => {
            image.names.forEach(name => {
                this.currentQuiz.push({
                    src: image.src,
                    name: name,
                    id: image.id
                });
            });
        });

        // Shuffle the quiz
        this.currentQuiz = this.currentQuiz.sort(() => Math.random() - 0.5);
        
        this.currentIndex = 0;
        this.score = 0;
        this.showQuizScreen();
        this.nextQuestion();
    }

    showQuizScreen() {
        this.setupScreen.classList.add('hidden');
        this.quizScreen.classList.remove('hidden');
        this.resultsScreen.classList.add('hidden');
    }

    nextQuestion() {
        if (this.currentIndex >= this.currentQuiz.length) {
            this.showResults();
            return;
        }

        const current = this.currentQuiz[this.currentIndex];
        this.quizImage.src = current.src;
        this.answerInput.value = '';
        this.answerInput.focus();
        
        this.currentCount.textContent = this.currentIndex + 1;
        this.totalCount.textContent = this.currentQuiz.length;
        this.scoreDisplay.textContent = Math.round((this.score / this.currentQuiz.length) * 100);

        this.startTimer();
    }

    startTimer() {
        this.timeLeft = parseInt(this.globalTimeInput.value) || 10;
        this.updateTimerDisplay();
        
        clearInterval(this.timer);
        this.timerBar.style.animation = 'none';
        
        setTimeout(() => {
            this.timerBar.style.animation = `timer ${this.timeLeft}s linear`;
        }, 10);

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimerDisplay();
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.checkAnswer(true);
            }
        }, 1000);
    }

    updateTimerDisplay() {
        this.timerText.textContent = this.timeLeft;
        if (this.timeLeft <= 3) {
            this.timerText.style.color = '#ff4757';
        } else {
            this.timerText.style.color = '#e0e0ff';
        }
    }

    checkAnswer(timeout = false) {
        clearInterval(this.timer);
        
        const userAnswer = this.answerInput.value.trim().toLowerCase();
        const correctAnswer = this.currentQuiz[this.currentIndex].name;
        
        if (userAnswer === correctAnswer) {
            this.score++;
        }

        this.currentIndex++;
        setTimeout(() => this.nextQuestion(), 1000);
    }

    showResults() {
        this.quizScreen.classList.add('hidden');
        this.resultsScreen.classList.remove('hidden');
        this.finalScore.textContent = Math.round((this.score / this.currentQuiz.length) * 100);
    }

    restartGame() {
        this.showQuizScreen();
        this.startQuiz();
    }

    backToSetup() {
        this.setupScreen.classList.remove('hidden');
        this.quizScreen.classList.add('hidden');
        this.resultsScreen.classList.add('hidden');
    }

    saveData() {
        if (this.images.length === 0) {
            alert('No data to save');
            return;
        }

        const data = {
            images: this.images.map(img => ({
                src: img.src,
                names: img.names
            }))
        };

        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'memory-quiz.fqz';
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Check if it's tierlist data
                if (data.tiers || data.poolItems || Array.isArray(data)) {
                    await this.processTierlistData(data);
                    alert('Tierlist imported successfully!');
                } else if (data.images && Array.isArray(data.images)) {
                    // Original format
                    this.images = data.images.map(img => ({
                        src: img.src,
                        names: img.names,
                        id: Date.now() + Math.random()
                    }));
                    this.renderImageList();
                    alert('Data imported successfully!');
                } else {
                    alert('Invalid file format');
                }
            } catch (error) {
                alert('Error importing file: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    async importTierlistData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                await this.processTierlistData(data);
                alert('Tierlist imported successfully!');
            } catch (error) {
                alert('Error importing tierlist: ' + error.message);
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    async processTierlistData(data) {
        // Handle both tierlist formats
        const items = [];
        
        // Handle new format with poolItems
        if (data.poolItems && Array.isArray(data.poolItems)) {
            for (const item of data.poolItems) {
                if (item.image) {
                    // Handle base64 image
                    if (item.image.startsWith('data:image')) {
                        items.push({
                            src: item.image,
                            names: [item.name || 'Untitled']
                        });
                    } 
                    // Handle URL
                    else if (item.image.startsWith('http')) {
                        items.push({
                            src: item.image,
                            names: [item.name || 'Untitled']
                        });
                    }
                }
            }
        }
        // Handle old format with direct items
        else if (Array.isArray(data)) {
            for (const item of data) {
                if (item.image) {
                    items.push({
                        src: item.image,
                        names: [item.name || 'Untitled']
                    });
                }
            }
        }

        // Process all items
        for (const item of items) {
            await this.createImageItemFromTierlist(item.src, item.names);
        }

        this.renderImageList();
    }

    async createImageItemFromTierlist(src, names) {
        return new Promise((resolve) => {
            if (src.startsWith('data:image')) {
                // Base64 image - no need to resize
                this.images.push({
                    src: src,
                    names: names.map(n => n.toLowerCase()),
                    id: Date.now() + Math.random()
                });
                resolve();
            } else {
                // URL - process normally
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 250;
                    canvas.height = 250;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, 250, 250);
                    
                    this.images.push({
                        src: canvas.toDataURL('image/png'),
                        names: names.map(n => n.toLowerCase()),
                        id: Date.now() + Math.random()
                    });
                    resolve();
                };
                img.onerror = () => {
                    // If image fails to load, use placeholder
                    this.images.push({
                        src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRmFpbGVkPC90ZXh0Pjwvc3ZnPg==',
                        names: names.map(n => n.toLowerCase()),
                        id: Date.now() + Math.random()
                    });
                    resolve();
                };
                img.src = src;
            }
        });
    }
}

const game = new MemoryQuizGame();