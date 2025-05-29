// PalmAI - Modern Palm Tree Disease Detector JavaScript

class PalmAI {
    constructor() {
        this.diseaseData = {};
        this.currentImage = null;
        this.analysisInProgress = false;
        
        this.init();
    }

    async init() {
        await this.loadDiseaseData();
        this.setupEventListeners();
        this.setupTheme();
        this.populateDiseaseGrid();
    }

    async loadDiseaseData() {
        try {
            const response = await fetch('/api/disease-data');
            this.diseaseData = await response.json();
        } catch (error) {
            console.error('Failed to load disease data:', error);
            // Fallback to inline data if API fails
            this.diseaseData = {
                healthy: {
                    name: "Healthy Palm",
                    description: "Your palm tree appears to be in excellent health!",
                    symptoms: ["Vibrant green fronds", "Normal leaf structure"],
                    treatment: ["Continue current care routine"],
                    prevention: ["Continue regular maintenance"],
                    severity: "None",
                    color: "green"
                }
            };
        }
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Help modal
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        const closeHelp = document.getElementById('close-help');
        
        helpBtn?.addEventListener('click', () => this.showModal(helpModal));
        closeHelp?.addEventListener('click', () => this.hideModal(helpModal));
        helpModal?.addEventListener('click', (e) => {
            if (e.target === helpModal) this.hideModal(helpModal);
        });

        // File upload
        const fileInput = document.getElementById('file-input');
        const uploadArea = document.getElementById('upload-area');
        const browseBtn = document.getElementById('browse-btn');
        const cameraBtn = document.getElementById('camera-btn');
        
        fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));
        browseBtn?.addEventListener('click', () => fileInput?.click());
        cameraBtn?.addEventListener('click', () => this.openCamera());
        
        // Drag and drop
        uploadArea?.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea?.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        uploadArea?.addEventListener('drop', (e) => this.handleDrop(e));
        uploadArea?.addEventListener('click', () => fileInput?.click());

        // Analysis and controls
        const analyzeBtn = document.getElementById('analyze-btn');
        const clearBtn = document.getElementById('clear-btn');
        const changeImageBtn = document.getElementById('change-image');
        const newAnalysisBtn = document.getElementById('new-analysis-btn');
        const saveReportBtn = document.getElementById('save-report-btn');

        analyzeBtn?.addEventListener('click', () => this.analyzeImage());
        clearBtn?.addEventListener('click', () => this.clearUpload());
        changeImageBtn?.addEventListener('click', () => this.changeImage());
        newAnalysisBtn?.addEventListener('click', () => this.newAnalysis());
        saveReportBtn?.addEventListener('click', () => this.saveReport());

        // Disease cards
        document.addEventListener('click', (e) => {
            if (e.target.closest('.disease-info-card')) {
                const diseaseId = e.target.closest('.disease-info-card').dataset.diseaseId;
                this.showDiseaseDetails(diseaseId);
            }
        });
    }

    setupTheme() {
        const savedTheme = localStorage.getItem('palmai-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('palmai-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const moonIcon = document.querySelector('#theme-toggle .fa-moon');
        const sunIcon = document.querySelector('#theme-toggle .fa-sun');
        
        if (theme === 'dark') {
            moonIcon?.classList.add('hidden');
            sunIcon?.classList.remove('hidden');
        } else {
            moonIcon?.classList.remove('hidden');
            sunIcon?.classList.add('hidden');
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && this.validateFile(file)) {
            this.displayImagePreview(file);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        
        const files = event.dataTransfer.files;
        if (files.length > 0 && this.validateFile(files[0])) {
            this.displayImagePreview(files[0]);
        }
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        
        if (!validTypes.includes(file.type)) {
            this.showNotification('Please upload a valid image file (JPG, PNG)', 'error');
            return false;
        }
        
        if (file.size > maxSize) {
            this.showNotification('File size must be less than 10MB', 'error');
            return false;
        }
        
        return true;
    }

    displayImagePreview(file) {
        this.currentImage = file;
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const previewImage = document.getElementById('preview-image');
            const fileName = document.getElementById('file-name');
            const uploadPrompt = document.getElementById('upload-prompt');
            const uploadPreview = document.getElementById('upload-preview');
            const analyzeBtn = document.getElementById('analyze-btn');
            const clearBtn = document.getElementById('clear-btn');
            
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            
            uploadPrompt?.classList.add('hidden');
            uploadPreview?.classList.remove('hidden');
            analyzeBtn?.removeAttribute('disabled');
            clearBtn?.classList.remove('hidden');
        };
        
        reader.readAsDataURL(file);
    }

    async openCamera() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            // Create camera modal
            const cameraModal = this.createCameraModal(stream);
            document.body.appendChild(cameraModal);
            this.showModal(cameraModal);
            
        } catch (error) {
            console.error('Camera access failed:', error);
            this.showNotification('Camera access failed. Please use file upload instead.', 'error');
        }
    }

    createCameraModal(stream) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-90';
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="relative bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold">Take Photo</h3>
                        <button class="camera-close text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="relative">
                        <video class="camera-video w-full rounded-lg" autoplay playsinline></video>
                        <canvas class="camera-canvas hidden"></canvas>
                    </div>
                    
                    <div class="flex justify-center mt-4 space-x-4">
                        <button class="camera-capture modern-btn-primary">
                            <i class="fas fa-camera mr-2"></i>Capture
                        </button>
                        <button class="camera-cancel modern-btn-secondary">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        
        const video = modal.querySelector('.camera-video');
        const canvas = modal.querySelector('.camera-canvas');
        const captureBtn = modal.querySelector('.camera-capture');
        const cancelBtn = modal.querySelector('.camera-cancel');
        const closeBtn = modal.querySelector('.camera-close');
        
        video.srcObject = stream;
        
        const cleanup = () => {
            stream.getTracks().forEach(track => track.stop());
            modal.remove();
        };
        
        captureBtn.addEventListener('click', () => {
            const context = canvas.getContext('2d');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
                const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                this.displayImagePreview(file);
                cleanup();
            }, 'image/jpeg', 0.9);
        });
        
        cancelBtn.addEventListener('click', cleanup);
        closeBtn.addEventListener('click', cleanup);
        
        return modal;
    }

    async analyzeImage() {
        if (!this.currentImage || this.analysisInProgress) return;
        
        this.analysisInProgress = true;
        this.showAnalysisProgress();
        
        try {
            // Simulate AI analysis with realistic timing
            await this.simulateAnalysis();
            
            // In a real implementation, this would send the image to an AI service
            // For demo purposes, we'll show results based on predefined data
            const result = this.getRandomAnalysisResult();
            this.showAnalysisResults(result);
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showNotification('Analysis failed. Please try again.', 'error');
            this.hideAnalysisProgress();
        } finally {
            this.analysisInProgress = false;
        }
    }

    showAnalysisProgress() {
        const infoPanel = document.getElementById('info-panel');
        const loadingPanel = document.getElementById('loading-panel');
        const analyzeBtn = document.getElementById('analyze-btn');
        
        infoPanel?.classList.add('hidden');
        loadingPanel?.classList.remove('hidden');
        
        // Update analyze button
        const btnContent = analyzeBtn?.querySelector('.btn-content');
        const btnLoader = analyzeBtn?.querySelector('.btn-loader');
        
        btnContent?.classList.add('hidden');
        btnLoader?.classList.remove('hidden');
        analyzeBtn?.setAttribute('disabled', 'true');
        
        // Animate loading steps
        this.animateLoadingSteps();
    }

    hideAnalysisProgress() {
        const infoPanel = document.getElementById('info-panel');
        const loadingPanel = document.getElementById('loading-panel');
        const analyzeBtn = document.getElementById('analyze-btn');
        
        loadingPanel?.classList.add('hidden');
        
        // Reset analyze button
        const btnContent = analyzeBtn?.querySelector('.btn-content');
        const btnLoader = analyzeBtn?.querySelector('.btn-loader');
        
        btnContent?.classList.remove('hidden');
        btnLoader?.classList.add('hidden');
        analyzeBtn?.removeAttribute('disabled');
    }

    animateLoadingSteps() {
        const steps = document.querySelectorAll('.loading-step');
        steps.forEach(step => step.classList.remove('active'));
        
        let currentStep = 0;
        const interval = setInterval(() => {
            if (currentStep < steps.length) {
                steps[currentStep]?.classList.add('active');
                currentStep++;
            } else {
                clearInterval(interval);
            }
        }, 1000);
    }

    async simulateAnalysis() {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    getRandomAnalysisResult() {
        const diseaseKeys = Object.keys(this.diseaseData);
        const randomKey = diseaseKeys[Math.floor(Math.random() * diseaseKeys.length)];
        return {
            condition: randomKey,
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            ...this.diseaseData[randomKey]
        };
    }

    showAnalysisResults(result) {
        const loadingPanel = document.getElementById('loading-panel');
        const resultsPanel = document.getElementById('results-panel');
        
        loadingPanel?.classList.add('hidden');
        resultsPanel?.classList.remove('hidden');
        
        // Update results content
        this.updateResultsContent(result);
    }

    updateResultsContent(result) {
        const elements = {
            confidenceScore: document.getElementById('confidence-score'),
            statusIndicator: document.getElementById('status-indicator'),
            diseaseName: document.getElementById('disease-name'),
            severityBadge: document.getElementById('severity-badge'),
            diseaseDescription: document.getElementById('disease-description'),
            symptomsList: document.getElementById('symptoms-list'),
            treatmentList: document.getElementById('treatment-list'),
            preventionList: document.getElementById('prevention-list')
        };
        
        // Update confidence
        if (elements.confidenceScore) {
            elements.confidenceScore.textContent = `${Math.round(result.confidence * 100)}%`;
        }
        
        // Update status indicator
        if (elements.statusIndicator) {
            elements.statusIndicator.className = `status-indicator ${result.color || 'gray'}`;
        }
        
        // Update disease name
        if (elements.diseaseName) {
            elements.diseaseName.textContent = result.name;
        }
        
        // Update severity badge
        if (elements.severityBadge) {
            const severityClass = result.severity?.toLowerCase().replace(' ', '-') || 'unknown';
            elements.severityBadge.className = `severity-badge ${severityClass}`;
            elements.severityBadge.textContent = result.severity || 'Unknown';
        }
        
        // Update description
        if (elements.diseaseDescription) {
            elements.diseaseDescription.textContent = result.description;
        }
        
        // Update lists
        this.updateList(elements.symptomsList, result.symptoms);
        this.updateList(elements.treatmentList, result.treatment);
        this.updateList(elements.preventionList, result.prevention);
    }

    updateList(listElement, items) {
        if (!listElement || !items) return;
        
        listElement.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            listElement.appendChild(li);
        });
    }

    clearUpload() {
        this.currentImage = null;
        
        const elements = {
            fileInput: document.getElementById('file-input'),
            uploadPrompt: document.getElementById('upload-prompt'),
            uploadPreview: document.getElementById('upload-preview'),
            analyzeBtn: document.getElementById('analyze-btn'),
            clearBtn: document.getElementById('clear-btn'),
            infoPanel: document.getElementById('info-panel'),
            loadingPanel: document.getElementById('loading-panel'),
            resultsPanel: document.getElementById('results-panel')
        };
        
        elements.fileInput.value = '';
        elements.uploadPrompt?.classList.remove('hidden');
        elements.uploadPreview?.classList.add('hidden');
        elements.analyzeBtn?.setAttribute('disabled', 'true');
        elements.clearBtn?.classList.add('hidden');
        
        elements.infoPanel?.classList.remove('hidden');
        elements.loadingPanel?.classList.add('hidden');
        elements.resultsPanel?.classList.add('hidden');
    }

    changeImage() {
        const fileInput = document.getElementById('file-input');
        fileInput?.click();
    }

    newAnalysis() {
        this.clearUpload();
    }

    saveReport() {
        const resultsPanel = document.getElementById('results-panel');
        if (!resultsPanel) return;
        
        // Create a printable version
        const printWindow = window.open('', '_blank');
        const printContent = this.generateReportHTML();
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }

    generateReportHTML() {
        const diseaseName = document.getElementById('disease-name')?.textContent || 'Unknown';
        const confidence = document.getElementById('confidence-score')?.textContent || '0%';
        const description = document.getElementById('disease-description')?.textContent || '';
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>PalmAI Analysis Report</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    h1 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 10px; }
                    .header { display: flex; justify-content: space-between; align-items: center; }
                    .confidence { background: #ecfdf5; padding: 10px; border-radius: 8px; }
                    .section { margin: 20px 0; }
                    .section h3 { color: #374151; margin-bottom: 10px; }
                    ul { padding-left: 20px; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>PalmAI Analysis Report</h1>
                    <div class="confidence">Confidence: ${confidence}</div>
                </div>
                
                <div class="section">
                    <h2>${diseaseName}</h2>
                    <p>${description}</p>
                </div>
                
                <div class="section">
                    <h3>Recommendations</h3>
                    ${this.getListHTML('treatment-list')}
                </div>
                
                <div class="section">
                    <h3>Prevention</h3>
                    ${this.getListHTML('prevention-list')}
                </div>
                
                <div class="footer">
                    <p>Generated by PalmAI on ${new Date().toLocaleDateString()}</p>
                    <p>This is an AI-generated analysis. For serious plant health issues, consult with a professional plant pathologist.</p>
                </div>
            </body>
            </html>
        `;
    }

    getListHTML(listId) {
        const list = document.getElementById(listId);
        if (!list) return '<ul><li>No data available</li></ul>';
        
        const items = Array.from(list.children).map(li => `<li>${li.textContent}</li>`).join('');
        return `<ul>${items}</ul>`;
    }

    populateDiseaseGrid() {
        const diseaseGrid = document.getElementById('disease-grid');
        if (!diseaseGrid) return;
        
        Object.entries(this.diseaseData).forEach(([key, disease]) => {
            const card = this.createDiseaseCard(key, disease);
            diseaseGrid.appendChild(card);
        });
    }

    createDiseaseCard(diseaseId, disease) {
        const card = document.createElement('div');
        card.className = `disease-info-card ${disease.color || 'gray'}`;
        card.dataset.diseaseId = diseaseId;
        
        card.innerHTML = `
            <div class="disease-info-header">
                <h4 class="disease-info-title">${disease.name}</h4>
                <div class="severity-badge ${disease.severity?.toLowerCase().replace(' ', '-') || 'unknown'}">
                    ${disease.severity || 'Unknown'}
                </div>
            </div>
            
            <p class="disease-info-description">${disease.description}</p>
            
            <div class="disease-info-symptoms">
                <h5>Key Symptoms</h5>
                <ul>
                    ${disease.symptoms?.slice(0, 3).map(symptom => `<li>${symptom}</li>`).join('') || '<li>No symptoms listed</li>'}
                </ul>
            </div>
        `;
        
        return card;
    }

    showDiseaseDetails(diseaseId) {
        const disease = this.diseaseData[diseaseId];
        if (!disease) return;
        
        // Create and show disease detail modal
        const modal = this.createDiseaseDetailModal(disease);
        document.body.appendChild(modal);
        this.showModal(modal);
    }

    createDiseaseDetailModal(disease) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50';
        
        modal.innerHTML = `
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="relative bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 max-h-screen overflow-y-auto">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-bold">${disease.name}</h3>
                        <button class="modal-close text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-6">
                        <div>
                            <p class="text-gray-600 dark:text-gray-300">${disease.description}</p>
                        </div>
                        
                        <div>
                            <h4 class="font-semibold mb-3 flex items-center">
                                <i class="fas fa-eye mr-2 text-emerald-600"></i>Symptoms
                            </h4>
                            <ul class="space-y-2">
                                ${disease.symptoms?.map(symptom => `
                                    <li class="flex items-start">
                                        <span class="text-emerald-500 mr-2">•</span>
                                        <span class="text-gray-600 dark:text-gray-300">${symptom}</span>
                                    </li>
                                `).join('') || '<li>No symptoms listed</li>'}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 class="font-semibold mb-3 flex items-center">
                                <i class="fas fa-stethoscope mr-2 text-blue-600"></i>Treatment
                            </h4>
                            <ul class="space-y-2">
                                ${disease.treatment?.map(treatment => `
                                    <li class="flex items-start">
                                        <span class="text-blue-500 mr-2">✓</span>
                                        <span class="text-gray-600 dark:text-gray-300">${treatment}</span>
                                    </li>
                                `).join('') || '<li>No treatment information available</li>'}
                            </ul>
                        </div>
                        
                        <div>
                            <h4 class="font-semibold mb-3 flex items-center">
                                <i class="fas fa-shield-alt mr-2 text-purple-600"></i>Prevention
                            </h4>
                            <ul class="space-y-2">
                                ${disease.prevention?.map(prevention => `
                                    <li class="flex items-start">
                                        <span class="text-purple-500 mr-2">⚡</span>
                                        <span class="text-gray-600 dark:text-gray-300">${prevention}</span>
                                    </li>
                                `).join('') || '<li>No prevention information available</li>'}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => {
            this.hideModal(modal);
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideModal(modal);
                modal.remove();
            }
        });
        
        return modal;
    }

    showModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
        
        const bgColor = type === 'error' ? 'bg-red-500' : 'bg-emerald-500';
        notification.className += ` ${bgColor} text-white`;
        
        notification.innerHTML = `
            <div class="flex items-center space-x-2">
                <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        // Animate out and remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
}

// Initialize PalmAI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.palmAI = new PalmAI();
});

// Add some global utility functions
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (nav) {
        if (window.scrollY > 50) {
            nav.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            nav.style.background = 'rgba(255, 255, 255, 0.9)';
        }
    }
});

// Handle escape key for modals
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.fixed.inset-0:not(.hidden)');
        modals.forEach(modal => {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }
});
