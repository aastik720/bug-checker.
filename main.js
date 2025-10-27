/* =====================================================================================
   main.js — Professional Bug Checker with Advanced Logic
   Complete implementation with pattern matching, AST-like analysis, and auto-fix
   ===================================================================================== */

// ============================================================================
// GLOBAL STATE & CONFIGURATION
// ============================================================================

const state = {
    currentCode: '',
    currentLanguage: 'javascript',
    analysisResults: null,
    settings: {
        autoAnalyze: false,
        strictMode: false,
        tabSize: 4
    }
};

let debounceTimer = null;

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
    codeEditor: document.getElementById('codeEditor'),
    languageSelect: document.getElementById('languageSelect'),
    lineNumbers: document.getElementById('lineNumbers'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    autoFixBtn: document.getElementById('autoFixBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    clearBtn: document.getElementById('clearBtn'),
    loadSampleBtn: document.getElementById('loadSampleBtn'),
    resultsContainer: document.getElementById('resultsContainer'),
    issueCount: document.getElementById('issueCount'),
    lineCount: document.getElementById('lineCount'),
    charCount: document.getElementById('charCount'),
    readabilityScore: document.getElementById('readabilityScore'),
    readabilityBar: document.getElementById('readabilityBar'),
    complexityScore: document.getElementById('complexityScore'),
    totalIssues: document.getElementById('totalIssues'),
    qualityGrade: document.getElementById('qualityGrade'),
    settingsToggle: document.getElementById('settingsToggle'),
    settingsPanel: document.getElementById('settingsPanel'),
    autoAnalyze: document.getElementById('autoAnalyze'),
    strictMode: document.getElementById('strictMode'),
    tabSize: document.getElementById('tabSize'),
    toastContainer: document.getElementById('toastContainer'),
    loadingOverlay: document.getElementById('loadingOverlay')
};

// ============================================================================
// SAMPLE CODE TEMPLATES
// ============================================================================

const sampleCode = {
    javascript: `// JavaScript Example with Bugs
function calculateTotal(items) {
    let total = 0
    for (let i = 0; i <= items.length; i++) {
        total += items[i].price
    }
    return total
}

const unused = 42;

if (true) {
    console.log("Always executes");
    return;
    console.log("Never reaches here");
}

while (true) {
    // Potential infinite loop
    break;
}`,
    
    python: `# Python Example with Bugs
def calculate_average(numbers):
    total = 0
    for i in range(len(numbers)+1):
        total += numbers[i]
    return total / len(numbers)

unused_var = 100

if True:
    print("Always executes")
    return
    print("Unreachable code")

while True:
    # Infinite loop
    pass`,
    
    java: `// Java Example with Bugs
public class Calculator {
    public static int sum(int[] numbers) {
        int total = 0
        for (int i = 0; i <= numbers.length; i++) {
            total += numbers[i]
        }
        return total
    }
    
    public static void main(String[] args) {
        int unused = 42;
        if (true) {
            return;
            System.out.println("Unreachable");
        }
    }
}`
};

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    loadSettings();
    attachEventListeners();
    updateLineNumbers();
    updateStats();
    showToast('Welcome to AI Bug Checker!', 'info');
}

function loadSettings() {
    // Load from memory instead of localStorage
    elements.autoAnalyze.checked = state.settings.autoAnalyze;
    elements.strictMode.checked = state.settings.strictMode;
    elements.tabSize.value = state.settings.tabSize;
}

function saveSettings() {
    // Settings are already in state object, no need for localStorage
    console.log('Settings saved:', state.settings);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function attachEventListeners() {
    // Code editor events
    elements.codeEditor.addEventListener('input', handleCodeInput);
    elements.codeEditor.addEventListener('scroll', syncScroll);
    elements.codeEditor.addEventListener('keydown', handleKeyDown);
    
    // Button events
    elements.analyzeBtn.addEventListener('click', analyzeCode);
    elements.autoFixBtn.addEventListener('click', autoFixCode);
    elements.downloadBtn.addEventListener('click', downloadReport);
    elements.clearBtn.addEventListener('click', clearEditor);
    elements.loadSampleBtn.addEventListener('click', loadSample);
    
    // Settings events
    elements.languageSelect.addEventListener('change', handleLanguageChange);
    elements.settingsToggle.addEventListener('click', toggleSettings);
    elements.autoAnalyze.addEventListener('change', handleSettingChange);
    elements.strictMode.addEventListener('change', handleSettingChange);
    elements.tabSize.addEventListener('change', handleSettingChange);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleGlobalKeyDown);
}

function handleCodeInput(e) {
    state.currentCode = e.target.value;
    updateLineNumbers();
    updateStats();
    
    // Auto-analyze with debounce
    if (state.settings.autoAnalyze) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            analyzeCode();
        }, 1500);
    }
}

function syncScroll() {
    // Synchronize the scroll position of line numbers with textarea
    const scrollTop = elements.codeEditor.scrollTop;
    const scrollHeight = elements.codeEditor.scrollHeight;
    const clientHeight = elements.codeEditor.clientHeight;
    const lineHeight = parseFloat(getComputedStyle(elements.codeEditor).lineHeight);
    
    // Calculate which line is at the top
    const topLine = Math.floor(scrollTop / lineHeight);
    
    // Update line numbers display to match visible lines
    const totalLines = (state.currentCode || '\n').split('\n').length;
    const visibleLines = Math.ceil(clientHeight / lineHeight);
    
    // Scroll line numbers container
    elements.lineNumbers.scrollTop = scrollTop;
}

function handleKeyDown(e) {
    // Tab key handling
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        const spaces = ' '.repeat(state.settings.tabSize);
        
        e.target.value = e.target.value.substring(0, start) + 
                         spaces + 
                         e.target.value.substring(end);
        e.target.selectionStart = e.target.selectionEnd = start + spaces.length;
        
        handleCodeInput(e);
    }
}

function handleGlobalKeyDown(e) {
    // Ctrl/Cmd + Enter: Analyze
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeCode();
    }
    
    // Ctrl/Cmd + S: Save to state
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showToast('Code saved to session', 'success');
    }
    
    // Ctrl/Cmd + K: Clear
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        clearEditor();
    }
}

function handleLanguageChange(e) {
    state.currentLanguage = e.target.value;
    if (state.currentCode.trim()) {
        analyzeCode();
    }
}

function handleSettingChange() {
    state.settings.autoAnalyze = elements.autoAnalyze.checked;
    state.settings.strictMode = elements.strictMode.checked;
    state.settings.tabSize = parseInt(elements.tabSize.value);
    saveSettings();
    showToast('Settings updated', 'info');
}

function toggleSettings() {
    elements.settingsPanel.style.display = 
        elements.settingsPanel.style.display === 'none' ? 'block' : 'none';
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateLineNumbers() {
    const lines = (state.currentCode || '\n').split('\n').length;
    elements.lineNumbers.textContent = Array.from(
        { length: lines },
        (_, i) => i + 1
    ).join('\n');
}

function updateStats() {
    const code = state.currentCode || '';
    const lines = code.split('\n').length;
    const chars = code.length;
    
    elements.lineCount.textContent = lines;
    elements.charCount.textContent = chars;
}

function updateMetrics(results) {
    // Readability score
    const readability = results.readability || 0;
    elements.readabilityScore.textContent = `${readability}/100`;
    elements.readabilityBar.style.width = `${readability}%`;
    
    // Complexity
    const complexity = results.complexity || 'Low';
    elements.complexityScore.textContent = complexity;
    
    // Total issues
    const totalIssues = results.issues.length;
    elements.totalIssues.textContent = totalIssues;
    
    // Quality grade
    const grade = calculateQualityGrade(readability, totalIssues);
    elements.qualityGrade.textContent = grade;
    
    // Issue count badge
    elements.issueCount.innerHTML = `<span>${totalIssues} issue${totalIssues !== 1 ? 's' : ''}</span>`;
}

function calculateQualityGrade(readability, issueCount) {
    const score = readability - (issueCount * 5);
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none"><path d="M13 16H12V12H11M12 8H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/></svg>'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2"/>
            </svg>
        </button>
    `;
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => toast.remove());
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================================
// LOADING OVERLAY
// ============================================================================

function showLoading() {
    elements.loadingOverlay.classList.add('active');
}

function hideLoading() {
    elements.loadingOverlay.classList.remove('active');
}

// ============================================================================
// BUTTON ACTIONS
// ============================================================================

function clearEditor() {
    if (state.currentCode.trim() && !confirm('Clear all code? This cannot be undone.')) {
        return;
    }
    
    elements.codeEditor.value = '';
    state.currentCode = '';
    state.analysisResults = null;
    
    updateLineNumbers();
    updateStats();
    renderEmptyState();
    
    elements.autoFixBtn.disabled = true;
    elements.downloadBtn.disabled = true;
    
    showToast('Editor cleared', 'info');
}

function loadSample() {
    const lang = state.currentLanguage;
    elements.codeEditor.value = sampleCode[lang] || sampleCode.javascript;
    state.currentCode = elements.codeEditor.value;
    
    updateLineNumbers();
    updateStats();
    
    showToast(`Loaded ${lang} sample code`, 'success');
}

// ============================================================================
// CORE ANALYSIS ENGINE
// ============================================================================

async function analyzeCode() {
    const code = state.currentCode.trim();
    
    if (!code) {
        showToast('Please enter some code to analyze', 'warning');
        return;
    }
    
    showLoading();
    elements.analyzeBtn.disabled = true;
    
    // Simulate async analysis
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
        const results = performAnalysis(code, state.currentLanguage);
        state.analysisResults = results;
        
        renderResults(results);
        updateMetrics(results);
        
        elements.autoFixBtn.disabled = results.issues.length === 0;
        elements.downloadBtn.disabled = false;
        
        const issueCount = results.issues.length;
        if (issueCount === 0) {
            showToast('✨ No issues found! Your code looks great!', 'success');
        } else {
            showToast(`Found ${issueCount} issue${issueCount !== 1 ? 's' : ''} in your code`, 'warning');
        }
        
    } catch (error) {
        console.error('Analysis error:', error);
        showToast('Analysis failed. Please try again.', 'error');
    } finally {
        hideLoading();
        elements.analyzeBtn.disabled = false;
    }
}

function performAnalysis(code, language) {
    const lines = code.split('\n');
    const issues = [];
    
    // Run all checks
    issues.push(...checkSyntaxErrors(code, lines, language));
    issues.push(...checkBrackets(code, lines));
    issues.push(...checkUnusedVariables(code, lines, language));
    issues.push(...checkInfiniteLoops(lines, language));
    issues.push(...checkUnreachableCode(lines, language));
    issues.push(...checkComplexity(lines, language));
    issues.push(...checkBestPractices(code, lines, language));
    
    if (state.settings.strictMode) {
        issues.push(...strictModeChecks(code, lines, language));
    }
    
    // Calculate readability
    const readability = calculateReadability(code, lines);
    const complexity = calculateComplexity(lines, language);
    
    // Sort issues by severity and line number
    issues.sort((a, b) => {
        const severityOrder = { critical: 0, error: 1, warning: 2, info: 3 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return a.line - b.line;
    });
    
    return {
        issues,
        readability,
        complexity,
        timestamp: new Date().toISOString()
    };
}

// ============================================================================
// CHECK FUNCTIONS
// ============================================================================

function checkSyntaxErrors(code, lines, language) {
    const issues = [];
    
    // Missing semicolons (JavaScript, Java, C++, C, PHP)
    if (['javascript', 'java', 'cpp', 'c', 'php'].includes(language)) {
        lines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;
            if (/^(if|for|while|switch|else|do|try|catch|finally|class|function|public|private|protected)\b/.test(trimmed)) return;
            if (trimmed.endsWith('{') || trimmed.endsWith('}') || trimmed.endsWith(';')) return;
            
            // Check if line looks like a statement
            if (/^(var|let|const|return|throw|break|continue)\b/.test(trimmed) || 
                /^\w+\s*=/.test(trimmed) || 
                /^\w+\(/.test(trimmed)) {
                issues.push({
                    line: index + 1,
                    severity: 'warning',
                    type: 'Syntax',
                    message: 'Missing semicolon at end of statement',
                    suggestion: line + ';'
                });
            }
        });
    }
    
    // Indentation errors (Python)
    if (language === 'python') {
        lines.forEach((line, index) => {
            const leadingSpaces = line.match(/^\s*/)[0];
            if (leadingSpaces.includes('\t')) {
                issues.push({
                    line: index + 1,
                    severity: 'error',
                    type: 'Indentation',
                    message: 'Use spaces instead of tabs for indentation',
                    suggestion: line.replace(/^\t+/, (match) => ' '.repeat(match.length * state.settings.tabSize))
                });
            } else if (leadingSpaces.length % state.settings.tabSize !== 0 && line.trim()) {
                issues.push({
                    line: index + 1,
                    severity: 'warning',
                    type: 'Indentation',
                    message: `Indentation should be a multiple of ${state.settings.tabSize} spaces`
                });
            }
        });
    }
    
    return issues;
}

function checkBrackets(code, lines) {
    const issues = [];
    const stack = [];
    const pairs = { '(': ')', '[': ']', '{': '}' };
    const closers = { ')': '(', ']': '[', '}': '{' };
    
    // Remove strings and comments for accurate bracket checking
    const cleanCode = removeStringsAndComments(code);
    
    for (let i = 0; i < cleanCode.length; i++) {
        const char = cleanCode[i];
        
        if (pairs[char]) {
            stack.push({ char, pos: i });
        } else if (closers[char]) {
            if (stack.length === 0 || stack[stack.length - 1].char !== closers[char]) {
                const lineNum = code.substring(0, i).split('\n').length;
                issues.push({
                    line: lineNum,
                    severity: 'error',
                    type: 'Bracket Mismatch',
                    message: `Unexpected closing bracket '${char}'`
                });
            } else {
                stack.pop();
            }
        }
    }
    
    // Check for unclosed brackets
    stack.forEach(item => {
        const lineNum = code.substring(0, item.pos).split('\n').length;
        issues.push({
            line: lineNum,
            severity: 'error',
            type: 'Bracket Mismatch',
            message: `Unclosed bracket '${item.char}'`,
            suggestion: `Add closing '${pairs[item.char]}'`
        });
    });
    
    return issues;
}

function checkUnusedVariables(code, lines, language) {
    const issues = [];
    
    if (language === 'javascript') {
        const declRegex = /\b(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g;
        const declarations = [];
        let match;
        
        while ((match = declRegex.exec(code)) !== null) {
            declarations.push({
                name: match[2],
                pos: match.index,
                line: code.substring(0, match.index).split('\n').length
            });
        }
        
        declarations.forEach(decl => {
            const regex = new RegExp('\\b' + decl.name + '\\b', 'g');
            const matches = code.match(regex);
            
            if (matches && matches.length === 1) {
                issues.push({
                    line: decl.line,
                    severity: 'warning',
                    type: 'Unused Variable',
                    message: `Variable '${decl.name}' is declared but never used`
                });
            }
        });
    }
    
    return issues;
}

function checkInfiniteLoops(lines, language) {
    const issues = [];
    
    const patterns = {
        javascript: [/\bwhile\s*\(\s*true\s*\)/i, /\bfor\s*\(\s*;\s*;\s*\)/],
        python: [/\bwhile\s+True\s*:/],
        java: [/\bwhile\s*\(\s*true\s*\)/i, /\bfor\s*\(\s*;\s*;\s*\)/],
        cpp: [/\bwhile\s*\(\s*1\s*\)/i, /\bfor\s*\(\s*;\s*;\s*\)/],
        c: [/\bwhile\s*\(\s*1\s*\)/i, /\bfor\s*\(\s*;\s*;\s*\)/]
    };
    
    const pats = patterns[language] || patterns.javascript;
    
    lines.forEach((line, index) => {
        for (const pattern of pats) {
            if (pattern.test(line)) {
                // Check if there's a break in the next few lines
                let hasBreak = false;
                for (let i = index + 1; i < Math.min(index + 10, lines.length); i++) {
                    if (/\bbreak\b|\breturn\b/.test(lines[i])) {
                        hasBreak = true;
                        break;
                    }
                }
                
                if (!hasBreak) {
                    issues.push({
                        line: index + 1,
                        severity: 'critical',
                        type: 'Infinite Loop',
                        message: 'Potential infinite loop detected - no break or return statement found'
                    });
                }
            }
        }
    });
    
    return issues;
}

function checkUnreachableCode(lines, language) {
    const issues = [];
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        if (/\b(return|throw|break|continue)\b/.test(trimmed)) {
            // Check next non-empty, non-comment line
            for (let i = index + 1; i < lines.length; i++) {
                const nextLine = lines[i].trim();
                
                if (!nextLine || nextLine.startsWith('//') || nextLine.startsWith('#') || 
                    nextLine === '}' || nextLine === ')') {
                    continue;
                }
                
                issues.push({
                    line: i + 1,
                    severity: 'warning',
                    type: 'Unreachable Code',
                    message: 'Code after return/throw/break statement is unreachable'
                });
                break;
            }
        }
    });
    
    return issues;
}

function checkComplexity(lines, language) {
    const issues = [];
    let nestingLevel = 0;
    let maxNesting = 0;
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Count loop/conditional nesting
        if (/\b(for|while|if|switch)\b.*\{?$/.test(trimmed)) {
            nestingLevel++;
            maxNesting = Math.max(maxNesting, nestingLevel);
            
            if (nestingLevel > 3) {
                issues.push({
                    line: index + 1,
                    severity: 'warning',
                    type: 'High Complexity',
                    message: `Deep nesting level (${nestingLevel}) - consider refactoring`
                });
            }
        }
        
        if (trimmed === '}' || trimmed.startsWith('}')) {
            nestingLevel = Math.max(0, nestingLevel - 1);
        }
    });
    
    return issues;
}

function checkBestPractices(code, lines, language) {
    const issues = [];
    
    if (language === 'javascript') {
        // Use === instead of ==
        lines.forEach((line, index) => {
            if (/[^=!]==[^=]/.test(line) && !line.includes('===')) {
                issues.push({
                    line: index + 1,
                    severity: 'info',
                    type: 'Best Practice',
                    message: 'Use === instead of == for comparison',
                    suggestion: line.replace(/([^=!])==([^=])/g, '$1===$2')
                });
            }
        });
        
        // Use const/let instead of var
        lines.forEach((line, index) => {
            if (/\bvar\s+/.test(line)) {
                issues.push({
                    line: index + 1,
                    severity: 'info',
                    type: 'Best Practice',
                    message: 'Consider using const or let instead of var',
                    suggestion: line.replace(/\bvar\b/, 'const')
                });
            }
        });
    }
    
    // Long lines
    lines.forEach((line, index) => {
        if (line.length > 120) {
            issues.push({
                line: index + 1,
                severity: 'info',
                type: 'Code Style',
                message: `Line is too long (${line.length} characters) - consider breaking it up`
            });
        }
    });
    
    // Trailing whitespace
    lines.forEach((line, index) => {
        if (/\s+$/.test(line)) {
            issues.push({
                line: index + 1,
                severity: 'info',
                type: 'Formatting',
                message: 'Trailing whitespace detected',
                suggestion: line.trimEnd()
            });
        }
    });
    
    return issues;
}

function strictModeChecks(code, lines, language) {
    const issues = [];
    
    // Check for console.log statements
    if (language === 'javascript') {
        lines.forEach((line, index) => {
            if (/console\.(log|warn|error|info)/.test(line)) {
                issues.push({
                    line: index + 1,
                    severity: 'info',
                    type: 'Strict Mode',
                    message: 'console statement found - remove before production'
                });
            }
        });
    }
    
    // Check for TODO comments
    lines.forEach((line, index) => {
        if (/TODO|FIXME|HACK|XXX/.test(line)) {
            issues.push({
                line: index + 1,
                severity: 'info',
                type: 'Strict Mode',
                message: 'TODO/FIXME comment found - resolve before production'
            });
        }
    });
    
    return issues;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function removeStringsAndComments(code) {
    let result = '';
    let inString = false;
    let inComment = false;
    let inMultiLineComment = false;
    let stringChar = '';
    
    for (let i = 0; i < code.length; i++) {
        const char = code[i];
        const next = code[i + 1];
        
        if (inMultiLineComment) {
            if (char === '*' && next === '/') {
                inMultiLineComment = false;
                i++;
            }
            result += ' ';
            continue;
        }
        
        if (inComment) {
            if (char === '\n') {
                inComment = false;
                result += char;
            } else {
                result += ' ';
            }
            continue;
        }
        
        if (inString) {
            if (char === '\\') {
                result += '  ';
                i++;
            } else if (char === stringChar) {
                inString = false;
                result += ' ';
            } else {
                result += ' ';
            }
            continue;
        }
        
        if ((char === '"' || char === "'" || char === '`') && !inString) {
            inString = true;
            stringChar = char;
            result += ' ';
            continue;
        }
        
        if (char === '/' && next === '/') {
            inComment = true;
            result += '  ';
            i++;
            continue;
        }
        
        if (char === '/' && next === '*') {
            inMultiLineComment = true;
            result += '  ';
            i++;
            continue;
        }
        
        result += char;
    }
    
    return result;
}

function calculateReadability(code, lines) {
    let score = 100;
    
    const nonEmpty = lines.filter(l => l.trim().length > 0);
    const avgLineLength = nonEmpty.reduce((sum, line) => sum + line.length, 0) / Math.max(nonEmpty.length, 1);
    
    // Penalize long average line length
    if (avgLineLength > 80) score -= Math.min(20, (avgLineLength - 80) / 4);
    
    // Reward comments
    const commentLines = lines.filter(l => /^\s*(\/\/|#|\/\*)/.test(l)).length;
    const commentRatio = commentLines / Math.max(nonEmpty.length, 1);
    score += Math.min(10, commentRatio * 30);
    
    // Penalize inconsistent indentation
    const indentSizes = nonEmpty
        .map(l => l.match(/^\s*/)[0].length)
        .filter(n => n > 0);
    const uniqueIndents = new Set(indentSizes.map(n => n % state.settings.tabSize));
    if (uniqueIndents.size > 2) score -= 10;
    
    // Penalize magic numbers
    const magicNumbers = (code.match(/\b\d+\b/g) || []).length;
    score -= Math.min(10, magicNumbers / 3);
    
    return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateComplexity(lines, language) {
    let complexity = 0;
    
    lines.forEach(line => {
        // Count decision points
        if (/\b(if|else|switch|case|for|while)\b/.test(line)) complexity++;
        if (/&&|\|\|/.test(line)) complexity++;
    });
    
    if (complexity <= 10) return 'Low';
    if (complexity <= 20) return 'Medium';
    return 'High';
}

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

function renderEmptyState() {
    elements.resultsContainer.innerHTML = `
        <div class="result-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M9 11L12 14L22 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3>No Analysis Yet</h3>
            <p>Click "Analyze Code" to check for bugs and issues</p>
        </div>
    `;
}

function renderResults(results) {
    if (results.issues.length === 0) {
        elements.resultsContainer.innerHTML = `
            <div class="success-message">
                <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3>✨ Perfect! No Issues Found</h3>
                <p>Your code looks clean and follows best practices!</p>
            </div>
        `;
        return;
    }
    
    const issuesHTML = results.issues.map((issue, index) => renderIssue(issue, index)).join('');
    elements.resultsContainer.innerHTML = issuesHTML;
}

function renderIssue(issue, index) {
    const suggestionHTML = issue.suggestion ? `
        <div class="issue-suggestion">
            <div class="issue-suggestion-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 10V3L4 14H11L11 21L20 10L13 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Suggested Fix
            </div>
            <div class="issue-suggestion-code">${escapeHtml(issue.suggestion)}</div>
            <div class="issue-actions">
                <button class="btn-small btn-success" onclick="applySingleFix(${index})">
                    Apply Fix
                </button>
                <button class="btn-small btn-ghost" onclick="copyToClipboard('${escapeHtml(issue.suggestion).replace(/'/g, "\\'")}')">
                    Copy
                </button>
            </div>
        </div>
    ` : '';
    
    return `
        <div class="issue-item ${issue.severity}">
            <div class="issue-header">
                <div class="issue-title">
                    <span class="issue-badge ${issue.severity}">${issue.severity}</span>
                    <span>${escapeHtml(issue.type)}</span>
                </div>
                <div class="issue-line">Line ${issue.line}</div>
            </div>
            <div class="issue-message">${escapeHtml(issue.message)}</div>
            ${suggestionHTML}
        </div>
    `;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// ============================================================================
// AUTO-FIX FUNCTIONALITY
// ============================================================================

async function autoFixCode() {
    if (!state.analysisResults || state.analysisResults.issues.length === 0) {
        showToast('No issues to fix', 'info');
        return;
    }
    
    showLoading();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
        let fixedCode = state.currentCode;
        const fixableIssues = state.analysisResults.issues.filter(issue => issue.suggestion);
        
        if (fixableIssues.length === 0) {
            showToast('No automatic fixes available', 'info');
            hideLoading();
            return;
        }
        
        // Sort by line number (descending) to avoid line number shifts
        fixableIssues.sort((a, b) => b.line - a.line);
        
        fixableIssues.forEach(issue => {
            const lines = fixedCode.split('\n');
            if (issue.line <= lines.length) {
                lines[issue.line - 1] = issue.suggestion;
                fixedCode = lines.join('\n');
            }
        });
        
        // Apply the fixes
        elements.codeEditor.value = fixedCode;
        state.currentCode = fixedCode;
        
        updateLineNumbers();
        updateStats();
        
        showToast(`Applied ${fixableIssues.length} fix${fixableIssues.length !== 1 ? 'es' : ''}!`, 'success');
        
        // Re-analyze
        setTimeout(() => analyzeCode(), 500);
        
    } catch (error) {
        console.error('Auto-fix error:', error);
        showToast('Auto-fix failed', 'error');
    } finally {
        hideLoading();
    }
}

// Apply single fix
window.applySingleFix = function(index) {
    const issue = state.analysisResults.issues[index];
    if (!issue || !issue.suggestion) return;
    
    const lines = state.currentCode.split('\n');
    if (issue.line <= lines.length) {
        lines[issue.line - 1] = issue.suggestion;
        const newCode = lines.join('\n');
        
        elements.codeEditor.value = newCode;
        state.currentCode = newCode;
        
        updateLineNumbers();
        updateStats();
        
        showToast('Fix applied!', 'success');
        
        // Re-analyze
        setTimeout(() => analyzeCode(), 300);
    }
};

// Copy to clipboard
window.copyToClipboard = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard', 'success');
    }).catch(() => {
        showToast('Failed to copy', 'error');
    });
};

// ============================================================================
// DOWNLOAD REPORT
// ============================================================================

function downloadReport() {
    if (!state.analysisResults) {
        showToast('No analysis to download', 'warning');
        return;
    }
    
    const report = generateReport(state.analysisResults);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bug-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Report downloaded', 'success');
}

function generateReport(results) {
    let report = '═══════════════════════════════════════════════════\n';
    report += '           BUG CHECKER ANALYSIS REPORT\n';
    report += '═══════════════════════════════════════════════════\n\n';
    report += `Date: ${new Date().toLocaleString()}\n`;
    report += `Language: ${state.currentLanguage}\n`;
    report += `Total Issues: ${results.issues.length}\n`;
    report += `Readability Score: ${results.readability}/100\n`;
    report += `Complexity: ${results.complexity}\n`;
    report += '\n───────────────────────────────────────────────────\n\n';
    
    if (results.issues.length === 0) {
        report += '✓ No issues found! Your code is clean.\n';
    } else {
        const grouped = {};
        results.issues.forEach(issue => {
            if (!grouped[issue.severity]) grouped[issue.severity] = [];
            grouped[issue.severity].push(issue);
        });
        
        ['critical', 'error', 'warning', 'info'].forEach(severity => {
            if (grouped[severity]) {
                report += `\n${severity.toUpperCase()} (${grouped[severity].length}):\n`;
                report += '─'.repeat(50) + '\n';
                grouped[severity].forEach(issue => {
                    report += `\nLine ${issue.line} - ${issue.type}\n`;
                    report += `  ${issue.message}\n`;
                    if (issue.suggestion) {
                        report += `  Suggestion: ${issue.suggestion}\n`;
                    }
                });
                report += '\n';
            }
        });
    }
    
    report += '\n═══════════════════════════════════════════════════\n';
    report += '           END OF REPORT\n';
    report += '═══════════════════════════════════════════════════\n';
    
    return report;
}

// ============================================================================
// INITIALIZE ON PAGE LOAD
// ============================================================================

document.addEventListener('DOMContentLoaded', init);