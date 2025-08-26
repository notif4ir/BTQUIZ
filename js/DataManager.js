export class DataManager {
    constructor(game) {
        this.game = game;
    }

    saveData() {
        if (this.game.images.length === 0) {
            alert('No data to save');
            return;
        }

        const data = {
            images: this.game.images.map(img => ({
                src: img.src,
                names: img.names,
                quizType: img.quizType,
                question: img.question,
                questionImage: img.questionImage,
                allOptions: img.allOptions,
                shuffleOptions: img.shuffleOptions,
                wrongOptions: img.wrongOptions
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
                    this.game.images = data.images.map(img => ({
                        src: img.src,
                        names: img.names || [],
                        quizType: img.quizType || 'guess-image',
                        question: img.question || '',
                        questionImage: img.questionImage || null,
                        allOptions: img.allOptions || [],
                        shuffleOptions: img.shuffleOptions !== false,
                        wrongOptions: img.wrongOptions || [],
                        id: img.id || Date.now() + Math.random()
                    }));
                    this.game.renderer.renderImageList();
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

        this.game.renderImageList();
    }

    async createImageItemFromTierlist(src, names) {
        return new Promise((resolve) => {
            if (src.startsWith('data:image')) {
                // Base64 image - no need to resize
                this.game.images.push({
                    src: src,
                    names: names.map(n => n.toLowerCase()),
                    quizType: 'guess-image',
                    question: 'What is this?',
                    questionImage: null,
                    allOptions: [],
                    shuffleOptions: true,
                    wrongOptions: [],
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
                    
                    this.game.images.push({
                        src: canvas.toDataURL('image/png'),
                        names: names.map(n => n.toLowerCase()),
                        quizType: 'guess-image',
                        question: 'What is this?',
                        questionImage: null,
                        allOptions: [],
                        shuffleOptions: true,
                        wrongOptions: [],
                        id: Date.now() + Math.random()
                    });
                    resolve();
                };
                img.onerror = () => {
                    // If image fails to load, use placeholder
                    this.game.images.push({
                        src: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjZmZmIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRmFpbGVkPC90ZXh0Pjwvc3ZnPg==',
                        names: names.map(n => n.toLowerCase()),
                        quizType: 'guess-image',
                        question: 'What is this?',
                        questionImage: null,
                        allOptions: [],
                        shuffleOptions: true,
                        wrongOptions: [],
                        id: Date.now() + Math.random()
                    });
                    resolve();
                };
                img.src = src;
            }
        });
    }
}