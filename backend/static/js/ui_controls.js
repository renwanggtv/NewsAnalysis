export function setupUIControls(elements, handleAnalysis, handleExport, toggleDarkMode, startTutorial) {
    elements.modelSourceSelect.addEventListener('change', () => handleModelSourceChange(elements));
    elements.analyzeButton.addEventListener('click', handleAnalysis);
    elements.exportButton.addEventListener('click', handleExport);
    elements.darkModeToggle.addEventListener('click', toggleDarkMode);
    elements.startTutorial.addEventListener('click', startTutorial);
    elements.newsInput.addEventListener('input', autoSave);

    // 添加键盘快捷键
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.key === 'Enter') {
            handleAnalysis();
        }
    });
}

function handleModelSourceChange(elements) {
    const modelSource = elements.modelSourceSelect.value;
    if (modelSource === 'local') {
        elements.apiKeyContainer.style.display = 'none';
        elements.localModelContainer.style.display = 'block';
    } else {
        elements.apiKeyContainer.style.display = 'block';
        elements.localModelContainer.style.display = 'none';
    }
}

function autoSave() {
    const newsContent = document.getElementById('newsInput').value;
    localStorage.setItem('savedNewsContent', newsContent);
}

export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

export function updateProgressBar(progress) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progress}%`;
    progressBar.textContent = `${progress}%`;
}