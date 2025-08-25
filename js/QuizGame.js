import { DataManager } from './DataManager.js';
import { QuizRenderer } from './QuizRenderer.js';
import { QuizEngine } from './QuizEngine.js';

export class QuizGame {
    constructor() {
        this.images = [];
        this.editingIndex = -1;
        this.optionCounter = 0;
        
        this.dataManager = new DataManager(this);
        this.renderer = new QuizRenderer(this);
        this.engine = new QuizEngine(this);
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Setup screen elements
        this.setupScreen = document.getElementById('setup-screen');
        this.quizScreen = document.getElementById('quiz-screen');
        this.resultsScreen = document.getElementById('results-screen');
        this.imageList = document.getElementById('image-list');
        this.globalTimeInput = document.getElementById('global-time-input');
        
        // Modal elements
        this.modal = document.getElementById('modal');
        this.modalTitle = document.getElementById('modal-title');
        this.modalImageInput = document.getElementById('modal-image-input');
        this.modalNamesInput = document.getElementById('modal-names-input');
        this.modalCancel = document.getElementById('modal-cancel');
        this.modalSave = document.getElementById('modal-save');
        this.quizTypeSelect = document.getElementById('quiz-type-select');
        this.modalQuestionInput = document.getElementById('modal-question-input');
        this.optionsContainer = document.getElementById('options-container');
        this.addOptionBtn = document.getElementById('add-option-btn');
        
        // File operations
        this.importBtn = document.getElementById('import-btn');
        this.importFile = document.getElementById('import-file');
        this.saveBtn = document.getElementById('save-btn');
        this.importTierlistBtn = document.getElementById('import-tierlist-btn');
        this.tierlistFileInput = document.getElementById('tierlist-file-input');
        
        // Action buttons
        this.addNewBtn = document.getElementById('add-new-btn');
        this.playBtn = document.getElementById('play-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.backBtn = document.getElementById('back-btn');
    }

    bindEvents() {
        // Modal events
        this.addNewBtn.addEventListener('click', () => this.openModal());
        this.modalCancel.addEventListener('click', () => this.closeModal());
        this.modalSave.addEventListener('click', () => this.saveItem());
        
        // Game control events
        this.playBtn.addEventListener('click', () => this.engine.startQuiz());
        this.restartBtn.addEventListener('click', () => this.engine.restartGame());
        this.backBtn.addEventListener('click', () => this.engine.backToSetup());
        
        // File operation events
        this.importBtn.addEventListener('click', () => this.importFile.click());
        this.importFile.addEventListener('change', (e) => this.dataManager.importData(e));
        this.saveBtn.addEventListener('click', () => this.dataManager.saveData());
        this.importTierlistBtn.addEventListener('click', () => this.tierlistFileInput.click());
        this.tierlistFileInput.addEventListener('change', (e) => this.dataManager.importTierlistData(e));
        
        // Modal close events
        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        window.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });
        
        // Quiz type and option events
        this.quizTypeSelect.addEventListener('change', () => this.updateModalForQuizType());
        this.addOptionBtn.addEventListener('click', () => this.addOptionField());
        
        // Question image source events
        document.addEventListener('change', (e) => {
            if (e.target.name === 'questionImageSource') {
                this.renderer.handleQuestionImageSourceChange(e);
            }
        });
    }

    // Modal management methods
    openModal(index = -1) {
        this.editingIndex = index;
        this.modalTitle.textContent = index === -1 ? 'Add New Item' : 'Edit Item';
        
        // Clear existing options
        this.optionsContainer.innerHTML = '';
        this.optionCounter = 0;
        
        if (index === -1) {
            this.renderer.clearModalFields();
        } else {
            this.renderer.populateModalFields(this.images[index]);
        }
        
        this.updateModalForQuizType();
        this.modal.classList.remove('hidden');
    }

    closeModal() {
        this.modal.classList.add('hidden');
        this.editingIndex = -1;
    }

    updateModalForQuizType() {
        this.renderer.updateModalForQuizType(this.quizTypeSelect.value);
    }

    saveItem() {
        const itemData = this.renderer.collectItemData();
        if (itemData.names.length === 0) {
            alert('Please enter at least one correct answer');
            return;
        }

        // Handle question image
        const imageSource = document.querySelector('input[name="questionImageSource"]:checked').value;
        
        if (imageSource === 'file') {
            const file = document.getElementById('modal-question-image-input').files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    itemData.questionImage = e.target.result;
                    this.addOrUpdateItem(itemData);
                };
                reader.readAsDataURL(file);
                return;
            }
        } else if (imageSource === 'url') {
            itemData.questionImage = document.getElementById('modal-question-url-input').value.trim();
        }

        this.addOrUpdateItem(itemData);
    }

    addOrUpdateItem(itemData) {
        if (this.editingIndex === -1) {
            this.images.push(itemData);
        } else {
            this.images[this.editingIndex] = itemData;
        }
        this.renderer.renderImageList();
        this.closeModal();
    }

    // Option field management
    addOptionField(text = '', image = '', isCorrect = false) {
        this.renderer.addOptionField(text, image, isCorrect, this.optionCounter++);
    }

    removeOptionField(optionId) {
        const optionDiv = document.querySelector(`[data-option-id="${optionId}"]`);
        if (optionDiv) {
            optionDiv.remove();
        }
    }

    // Item management
    deleteItem(index) {
        if (confirm('Delete this item?')) {
            this.images.splice(index, 1);
            this.renderer.renderImageList();
        }
    }
}