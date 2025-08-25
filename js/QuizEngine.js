export class QuizEngine {
    constructor(game) {
        this.game = game;
        this.currentQuiz = [];
        this.currentIndex = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 10;
        
        this.initializeElements();
    }

    initializeElements() {
        this.quizImage = document.getElementById('quiz-image');
        this.answerInput = document.getElementById('answer-input');
        this.timerText = document.getElementById('timer-text');
        this.timerBar = document.querySelector('.timer-bar');
        this.scoreDisplay = document.getElementById('score');
        this.currentCount = document.getElementById('current-count');
        this.totalCount = document.getElementById('total-count');
        this.finalScore = document.getElementById('final-score');
    }

    startQuiz() {
        if (this.game.images.length === 0) {
            alert('Please add some images first!');
            return;
        }

        // Create quiz array with complete question data
        this.currentQuiz = [];
        this.game.images.forEach(image => {
            this.currentQuiz.push({
                src: image.src,
                names: image.names,
                quizType: image.quizType,
                question: image.question,
                questionImage: image.questionImage,
                wrongOptions: image.wrongOptions,
                allOptions: image.allOptions,
                shuffleOptions: image.shuffleOptions,
                id: image.id
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
        this.game.setupScreen.classList.add('hidden');
        this.game.quizScreen.classList.remove('hidden');
        this.game.resultsScreen.classList.add('hidden');
    }

    nextQuestion() {
        if (this.currentIndex >= this.currentQuiz.length) {
            this.showResults();
            return;
        }

        const current = this.currentQuiz[this.currentIndex];
        this.renderQuizQuestion(current);
        
        this.currentCount.textContent = this.currentIndex + 1;
        this.totalCount.textContent = this.currentQuiz.length;
        this.scoreDisplay.textContent = Math.round((this.score / this.currentQuiz.length) * 100);

        this.startTimer();
    }

    startTimer() {
        this.timeLeft = parseInt(this.game.globalTimeInput.value) || 10;
        this.timerText.textContent = this.timeLeft;
        
        // Update timer bar animation duration
        const timerBar = document.querySelector('.timer-bar::before');
        if (timerBar) {
            timerBar.style.animationDuration = `${this.timeLeft}s`;
        }
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timerText.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.checkAnswer(true);
            }
        }, 1000);
    }

    renderQuizQuestion(questionData) {
        const quizContent = document.querySelector('.quiz-content');
        const hasQuestionImage = questionData.questionImage;
        
        switch(questionData.quizType) {
            case 'multiple-choice':
                let options = [];
                
                if (questionData.allOptions) {
                    options = questionData.allOptions.map(opt => ({
                        text: opt.text,
                        image: opt.image,
                        isCorrect: opt.isCorrect
                    }));
                } else {
                    // Legacy support
                    options = [...questionData.wrongOptions.map(opt => ({text: opt, image: null, isCorrect: false})), 
                              ...questionData.names.map(opt => ({text: opt, image: null, isCorrect: true}))];
                }
                
                if (questionData.shuffleOptions) {
                    options = this.shuffleArray([...options]);
                }
                
                this.renderMultipleChoice(hasQuestionImage, questionData, options);
                break;
                
            case 'guess-image':
                this.renderGuessImage(hasQuestionImage, questionData);
                break;
                
            case 'text-question':
                this.renderTextQuestion(hasQuestionImage, questionData);
                break;
                
            case 'true-false':
                this.renderTrueFalse(hasQuestionImage, questionData);
                break;
                
            case 'fill-blank':
                this.renderFillBlank(hasQuestionImage, questionData);
                break;
        }
        
        const answerInput = document.getElementById('answer-input');
        if (answerInput) {
            answerInput.focus();
            answerInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.checkAnswer();
            });
        }
    }

    renderMultipleChoice(hasQuestionImage, questionData, options) {
        const quizContent = document.querySelector('.quiz-content');
        let content = '';
        
        if (hasQuestionImage) {
            content += `<img class="question-image" src="${questionData.questionImage}" alt="Question image">`;
        }
        content += `<h3>${questionData.question}</h3>`;
        content += `<div class="choice-btn-grid">`;
        
        options.forEach((option, index) => {
            content += `
                <button class="choice-btn" 
                        data-answer="${option.text}" 
                        data-correct="${option.isCorrect}">
                    ${option.image ? `<img src="${option.image}" style="max-width: 60px; max-height: 40px; margin-right: 10px; border-radius: 5px;">` : ''}
                    <span>${String.fromCharCode(65 + index)}. ${option.text}</span>
                </button>
            `;
        });
        
        content += `</div>`;
        quizContent.innerHTML = content;
        this.bindChoiceButtons();
    }

    renderGuessImage(hasQuestionImage, questionData) {
        const quizContent = document.querySelector('.quiz-content');
        quizContent.innerHTML = `
            ${hasQuestionImage ? `<img class="question-image" src="${questionData.questionImage}" alt="Quiz image">` : ''}
            <img id="quiz-image" src="${questionData.src}" alt="Quiz image">
            <h3>What is this?</h3>
            <input type="text" id="answer-input" placeholder="Type your answer..." autocomplete="off">
        `;
    }

    renderTextQuestion(hasQuestionImage, questionData) {
        const quizContent = document.querySelector('.quiz-content');
        quizContent.innerHTML = `
            ${hasQuestionImage ? `<img class="question-image" src="${questionData.questionImage}" alt="Question image">` : ''}
            <h3>${questionData.question}</h3>
            <input type="text" id="answer-input" placeholder="Type your answer..." autocomplete="off">
        `;
    }

    renderTrueFalse(hasQuestionImage, questionData) {
        const quizContent = document.querySelector('.quiz-content');
        quizContent.innerHTML = `
            ${hasQuestionImage ? `<img class="question-image" src="${questionData.questionImage}" alt="Question image">` : ''}
            <h3>${questionData.question}</h3>
            <div class="choice-btn-grid">
                <button class="choice-btn" data-answer="true">✅ TRUE</button>
                <button class="choice-btn" data-answer="false">❌ FALSE</button>
            </div>
        `;
        this.bindChoiceButtons();
    }

    renderFillBlank(hasQuestionImage, questionData) {
        const quizContent = document.querySelector('.quiz-content');
        const blankedQuestion = questionData.question.replace(/\[blank\]/gi, '_____');
        quizContent.innerHTML = `
            ${hasQuestionImage ? `<img class="question-image" src="${questionData.questionImage}" alt="Question image">` : ''}
            <h3>${blankedQuestion}</h3>
            <input type="text" id="answer-input" placeholder="Fill in the blank..." autocomplete="off">
        `;
    }

    bindChoiceButtons() {
        const choiceBtns = document.querySelectorAll('.choice-btn');
        choiceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const answer = btn.dataset.answer;
                this.checkAnswer(false, answer);
            });
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    checkAnswer(timeout = false, selectedAnswer = null) {
        clearInterval(this.timer);
        
        let userAnswer;
        if (selectedAnswer !== null) {
            userAnswer = selectedAnswer.toLowerCase();
        } else {
            const answerInput = document.getElementById('answer-input');
            userAnswer = answerInput ? answerInput.value.trim().toLowerCase() : '';
        }
        
        const currentQuestion = this.currentQuiz[this.currentIndex];
        const correctAnswers = currentQuestion.names || [];
        const isCorrect = correctAnswers.includes(userAnswer);
        
        if (isCorrect) {
            this.score++;
        }

        // Visual feedback
        if (selectedAnswer !== null) {
            const buttons = document.querySelectorAll('.choice-btn');
            buttons.forEach(btn => {
                const answer = btn.dataset.answer.toLowerCase();
                const correct = btn.dataset.correct === 'true';
                
                if (correct) {
                    btn.classList.add('correct');
                } else if (answer === userAnswer && !isCorrect) {
                    btn.classList.add('incorrect');
                }
                
                btn.disabled = true;
            });
        }

        setTimeout(() => {
            this.currentIndex++;
            this.nextQuestion();
        }, 1500);
    }

    showResults() {
        this.game.quizScreen.classList.add('hidden');
        this.game.resultsScreen.classList.remove('hidden');
        this.finalScore.textContent = Math.round((this.score / this.currentQuiz.length) * 100);
    }

    restartGame() {
        this.showQuizScreen();
        this.startQuiz();
    }

    backToSetup() {
        this.game.setupScreen.classList.remove('hidden');
        this.game.quizScreen.classList.add('hidden');
        this.game.resultsScreen.classList.add('hidden');
    }
}