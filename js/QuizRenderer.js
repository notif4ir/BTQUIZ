export class QuizRenderer {
    constructor(game) {
        this.game = game;
    }

    renderImageList() {
        this.game.imageList.innerHTML = '';
        
        if (this.game.images.length === 0) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'empty-state';
            emptyDiv.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #a8b2ff; opacity: 0.7;">
                    <h3>No questions yet</h3>
                    <p>Click "Add New Question" to get started</p>
                </div>
            `;
            this.game.imageList.appendChild(emptyDiv);
            return;
        }
        
        this.game.images.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'image-item';
            
            const quizTypeLabel = {
                'guess-image': '🖼️ Image',
                'multiple-choice': '📝 Multiple Choice',
                'text-question': '❓ Text',
                'true-false': '✅ True/False',
                'fill-blank': '📋 Fill Blank'
            };
            
            div.innerHTML = `
                ${item.src ? `<img src="${item.src}" alt="Question">` : ''}
                <div class="quiz-type-badge">${quizTypeLabel[item.quizType] || '📝'}</div>
                ${item.question ? `<p class="question-preview">${item.question.length > 60 ? item.question.substring(0, 60) + '...' : item.question}</p>` : ''}
                <p class="answers-preview">Answers: ${item.names.length > 2 ? item.names.slice(0, 2).join(', ') + '...' : item.names.join(', ')}</p>
                <div class="image-actions">
                    <button class="edit-btn" onclick="game.openModal(${index})">Edit</button>
                    <button class="delete-btn" onclick="game.deleteItem(${index})">Delete</button>
                </div>
            `;
            this.game.imageList.appendChild(div);
        });
    }

    clearModalFields() {
        this.game.modalNamesInput.value = '';
        this.game.modalQuestionInput.value = '';
        this.game.quizTypeSelect.value = 'multiple-choice';
        document.querySelector('input[name="questionImageSource"][value="none"]').checked = true;
        document.getElementById('modal-question-url-input').value = '';
        const file = document.getElementById('modal-question-image-input'); 
        if (file) file.value = '';
        document.getElementById('shuffle-options').checked = true;
    }

    populateModalFields(item) {
        this.game.modalNamesInput.value = item.names.join('\n');
        this.game.modalQuestionInput.value = item.question || '';
        this.game.quizTypeSelect.value = item.quizType || 'multiple-choice';
        
        if (item.questionImage) {
            if (item.questionImage.startsWith('http')) {
                document.querySelector('input[name="questionImageSource"][value="url"]').checked = true;
                document.getElementById('modal-question-url-input').value = item.questionImage;
            } else {
                document.querySelector('input[name="questionImageSource"][value="file"]').checked = true;
            }
        } else {
            document.querySelector('input[name="questionImageSource"][value="none"]').checked = true;
        }
        
        // Load existing options
        if (item.allOptions) {
            item.allOptions.forEach(option => {
                const isCorrect = item.names.includes(option.text.toLowerCase());
                this.game.addOptionField(option.text, option.image || '', isCorrect);
            });
        } else {
            // Legacy support
            if (item.wrongOptions) {
                item.wrongOptions.forEach(option => {
                    this.game.addOptionField(option, '', false);
                });
            }
            item.names.forEach(name => {
                this.game.addOptionField(name, '', true);
            });
        }
    }

    updateModalForQuizType(quizType) {
        const imageSection = document.querySelector('.image-section');
        const questionSection = document.querySelector('.question-section');
        const optionsSection = document.querySelector('.options-section');
        const answersLabel = this.game.modalNamesInput.parentElement.querySelector('label');
        
        // Reset visibility - all question types can have images
        imageSection.style.display = 'block';
        questionSection.style.display = 'block';
        optionsSection.style.display = 'none';
        
        switch(quizType) {
            case 'guess-image':
                answersLabel.textContent = 'Correct Answers (one per line):';
                this.game.modalNamesInput.placeholder = 'Enter correct answers, one per line';
                break;
                
            case 'multiple-choice':
                optionsSection.style.display = 'block';
                answersLabel.textContent = 'Correct Answers (one per line):';
                this.game.modalNamesInput.placeholder = 'Enter correct answers, one per line';
                break;
                
            case 'text-question':
                answersLabel.textContent = 'Correct Answers (one per line):';
                this.game.modalNamesInput.placeholder = 'Enter correct answers, one per line';
                break;
                
            case 'true-false':
                answersLabel.textContent = 'Correct Answer:';
                this.game.modalNamesInput.placeholder = 'Enter "true" or "false"';
                break;
                
            case 'fill-blank':
                answersLabel.textContent = 'Correct Answers (one per line):';
                this.game.modalNamesInput.placeholder = 'Enter correct answers, one per line';
                break;
        }
    }

    handleQuestionImageSourceChange(e) {
        const fileInput = document.getElementById('modal-question-image-input');
        const urlInput = document.getElementById('modal-question-url-input');
        const uploadBtn = document.querySelector('.upload-btn');
        
        const value = e.target.value;
        fileInput.style.display = value === 'file' ? 'block' : 'none';
        urlInput.style.display = value === 'url' ? 'block' : 'none';
        uploadBtn.style.display = value === 'file' ? 'inline-block' : 'none';
    }

    collectItemData() {
        const names = this.game.modalNamesInput.value
            .split('\n')
            .map(n => n.trim())
            .filter(n => n);

        const quizType = this.game.quizTypeSelect.value;
        const question = this.game.modalQuestionInput.value.trim();
        const shuffleOptions = document.getElementById('shuffle-options').checked;

        // Collect all options
        const allOptions = [];
        const optionFields = this.game.optionsContainer.querySelectorAll('.option-field');
        
        optionFields.forEach(field => {
            const text = field.querySelector('.option-text').value.trim();
            const isCorrect = field.querySelector('.option-correct input').checked;
            const optionId = field.dataset.optionId;
            
            if (text) {
                const imageSource = field.querySelector(`input[name="optionImage-${optionId}"]:checked`).value;
                let image = null;
                
                if (imageSource === 'url') {
                    image = field.querySelector('.option-image-url').value.trim();
                } else if (imageSource === 'file') {
                    const preview = field.querySelector('.option-preview');
                    if (preview) {
                        image = preview.src;
                    }
                }
                
                allOptions.push({
                    text: text,
                    image: image,
                    isCorrect: isCorrect
                });
            }
        });

        return {
            names: names.map(n => n.toLowerCase()),
            quizType: quizType,
            question: question,
            allOptions: allOptions,
            shuffleOptions: shuffleOptions,
            questionImage: null, // Will be set by caller
            wrongOptions: allOptions.filter(opt => !opt.isCorrect).map(opt => opt.text),
            id: Date.now()
        };
    }

    addOptionField(text, image, isCorrect, optionId) {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option-field';
        optionDiv.dataset.optionId = `option-${optionId}`;
        
        optionDiv.innerHTML = `
            <div class="option-header">
                <input type="text" class="option-text" placeholder="Enter option text..." value="${text}">
                <label class="option-correct">
                    <input type="checkbox" ${isCorrect ? 'checked' : ''}> Correct Answer
                </label>
                <button type="button" class="remove-option-btn" onclick="game.removeOptionField('option-${optionId}')">×</button>
            </div>
            <div class="option-image-section">
                <div class="option-image-controls">
                    <label>
                        <input type="radio" name="optionImage-option-${optionId}" value="none" ${!image ? 'checked' : ''}>
                        No image
                    </label>
                    <label>
                        <input type="radio" name="optionImage-option-${optionId}" value="file" ${image && !image.startsWith('http') ? 'checked' : ''}>
                        Upload file
                    </label>
                    <label>
                        <input type="radio" name="optionImage-option-${optionId}" value="url" ${image && image.startsWith('http') ? 'checked' : ''}>
                        Image URL
                    </label>
                </div>
                <input type="file" class="option-image-file" accept="image/*" style="display: none;">
                <input type="url" class="option-image-url" placeholder="Enter image URL" value="${image && image.startsWith('http') ? image : ''}" style="display: ${image && image.startsWith('http') ? 'block' : 'none'};">
                <label for="option-image-file-option-${optionId}" class="upload-btn option-upload-btn" style="display: ${image && !image.startsWith('http') ? 'inline-block' : 'none'};">Choose Image</label>
                ${image && !image.startsWith('http') ? `<img class="option-preview" src="${image}" style="max-width: 100px; max-height: 60px; margin-top: 10px; border-radius: 5px;">` : ''}
            </div>
        `;
        
        this.game.optionsContainer.appendChild(optionDiv);
        this.bindOptionEvents(optionDiv, `option-${optionId}`);
    }

    bindOptionEvents(optionDiv, optionId) {
        const imageRadios = optionDiv.querySelectorAll(`input[name="optionImage-${optionId}"]`);
        const fileInput = optionDiv.querySelector('.option-image-file');
        const urlInput = optionDiv.querySelector('.option-image-url');
        const uploadBtn = optionDiv.querySelector('.option-upload-btn');
        
        imageRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                const value = radio.value;
                fileInput.style.display = value === 'file' ? 'block' : 'none';
                urlInput.style.display = value === 'url' ? 'block' : 'none';
                uploadBtn.style.display = value === 'file' ? 'inline-block' : 'none';
            });
        });
        
        uploadBtn.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    let preview = optionDiv.querySelector('.option-preview');
                    if (!preview) {
                        preview = document.createElement('img');
                        preview.className = 'option-preview';
                        preview.style.cssText = 'max-width: 100px; max-height: 60px; margin-top: 10px; border-radius: 5px; display: block;';
                        optionDiv.querySelector('.option-image-section').appendChild(preview);
                    }
                    preview.src = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
}