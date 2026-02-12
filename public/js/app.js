/* ══════════════════════════════════════════════════════════════════════
   app.js — Feedback Submission Page Logic
   ══════════════════════════════════════════════════════════════════════ */

const API_BASE = '/api/feedback';

// ─── DOM References ────────────────────────────────────────────────────
const feedbackForm = document.getElementById('feedbackForm');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const categoryInput = document.getElementById('categoryInput');
const messageInput = document.getElementById('messageInput');
const charCount = document.getElementById('charCount');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const sentimentResult = document.getElementById('sentimentResult');
const sentimentBadge = document.getElementById('sentimentBadge');
const sentimentScore = document.getElementById('sentimentScore');
const keywordsContainer = document.getElementById('keywordsContainer');
const insightsGrid = document.getElementById('insightsGrid');
const toastContainer = document.getElementById('toastContainer');

// Chart instances
let doughnutChart = null;
let barChart = null;

// ─── Initialize ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadRecentFeedback();
    loadOverviewCharts();
});

// ─── Character counter ──────────────────────────────────────────────
messageInput.addEventListener('input', () => {
    const len = messageInput.value.length;
    charCount.textContent = `${len} / 2000`;
    charCount.style.color = len > 1800 ? 'var(--danger-400)' : 'var(--text-muted)';
});

// ─── Form Submit ────────────────────────────────────────────────────
feedbackForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const category = categoryInput.value;
    const message = messageInput.value.trim();
    const ratingEl = document.querySelector('input[name="rating"]:checked');
    const rating = ratingEl ? parseInt(ratingEl.value) : 3;

    if (!name || !message) {
        showToast('Please fill in your name and feedback.', 'error');
        return;
    }

    // Show loading
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline-block';

    try {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, category, rating, message })
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.error || 'Submission failed');
        }

        // Show sentiment result
        showSentimentResult(data.data.sentiment);

        // Clear form
        feedbackForm.reset();
        document.getElementById('star3').checked = true;
        charCount.textContent = '0 / 2000';

        showToast('Feedback submitted and analyzed successfully! ✨', 'success');

        // Refresh lists and charts
        loadRecentFeedback();
        loadOverviewCharts();

    } catch (err) {
        console.error(err);
        showToast(err.message || 'Error submitting feedback.', 'error');
    } finally {
        submitBtn.disabled = false;
        btnText.style.display = 'inline-flex';
        btnSpinner.style.display = 'none';
    }
});

// ─── Show Sentiment Result ──────────────────────────────────────────
function showSentimentResult(sentiment) {
    sentimentResult.classList.add('show');

    const label = sentiment.label;
    const emoji = label === 'Positive' ? '😊' : label === 'Negative' ? '😞' : '😐';

    sentimentBadge.className = `sentiment-badge ${label.toLowerCase()}`;
    sentimentBadge.textContent = `${emoji} ${label}`;

    sentimentScore.textContent = `Score: ${sentiment.score} · Comparative: ${sentiment.comparative}`;

    // Keywords
    keywordsContainer.innerHTML = '';

    if (sentiment.positiveWords && sentiment.positiveWords.length) {
        sentiment.positiveWords.forEach(w => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag positive';
            tag.textContent = `✓ ${w}`;
            keywordsContainer.appendChild(tag);
        });
    }

    if (sentiment.negativeWords && sentiment.negativeWords.length) {
        sentiment.negativeWords.forEach(w => {
            const tag = document.createElement('span');
            tag.className = 'keyword-tag negative';
            tag.textContent = `✗ ${w}`;
            keywordsContainer.appendChild(tag);
        });
    }
}

// ─── Load Recent Feedback ───────────────────────────────────────────
async function loadRecentFeedback() {
    try {
        const res = await fetch(`${API_BASE}?limit=12`);
        const data = await res.json();

        if (!data.success || !data.data.length) {
            insightsGrid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No feedback submitted yet. Be the first!</p>
        </div>`;
            return;
        }

        insightsGrid.innerHTML = data.data.map(fb => {
            const lbl = fb.sentiment?.label || 'Neutral';
            const emoji = lbl === 'Positive' ? '😊' : lbl === 'Negative' ? '😞' : '😐';
            const date = new Date(fb.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            return `
        <div class="insight-card ${lbl.toLowerCase()} fade-in">
          <div class="user-name">${escapeHtml(fb.name)}</div>
          <div class="user-feedback">${escapeHtml(fb.message)}</div>
          <div class="meta-row">
            <span class="sentiment-badge ${lbl.toLowerCase()}">${emoji} ${lbl}</span>
            <span class="category-tag">${fb.category || 'General'}</span>
            <span class="time-tag">${date}</span>
          </div>
        </div>`;
        }).join('');

    } catch (err) {
        console.error('Error loading feedback:', err);
    }
}

// ─── Load Overview Charts (Doughnut + Bar) ──────────────────────────
async function loadOverviewCharts() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        if (!data.success) return;

        const { sentimentDistribution: sd } = data.data;
        const labels = ['Positive', 'Neutral', 'Negative'];
        const counts = [sd.Positive || 0, sd.Neutral || 0, sd.Negative || 0];
        const colors = ['#4ade80', '#818cf8', '#f87171'];

        // ── Doughnut ──
        const doughnutCtx = document.getElementById('sentimentDoughnut').getContext('2d');
        if (doughnutChart) doughnutChart.destroy();
        doughnutChart = new Chart(doughnutCtx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors,
                    borderColor: 'transparent',
                    borderWidth: 0,
                    hoverOffset: 12
                }]
            },
            options: {
                responsive: true,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#94a3b8', font: { family: "'Inter'", size: 12 }, padding: 16 }
                    }
                }
            }
        });

        // ── Bar ──
        const barCtx = document.getElementById('sentimentBar').getContext('2d');
        if (barChart) barChart.destroy();
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Count',
                    data: counts,
                    backgroundColor: colors.map(c => c + '88'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 8,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#94a3b8', stepSize: 1 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });

    } catch (err) {
        console.error('Error loading charts:', err);
    }
}

// ─── Toast Notifications ────────────────────────────────────────────
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ─── Utility ────────────────────────────────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
