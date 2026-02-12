/* ══════════════════════════════════════════════════════════════════════
   dashboard.js — Admin Analytics Dashboard Logic
   ══════════════════════════════════════════════════════════════════════ */

const API_BASE = '/api/feedback';

// Chart instances (so we can destroy + recreate on refresh)
let pieChart = null;
let barChart = null;
let categoryChart = null;
let ratingChart = null;
let trendChart = null;

// ─── Init ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();

    document.getElementById('filterSentiment').addEventListener('change', loadFeedbackList);
    document.getElementById('filterCategory').addEventListener('change', loadFeedbackList);
});

// ─── Load everything ────────────────────────────────────────────────
async function loadDashboard() {
    await Promise.all([loadStats(), loadFeedbackList()]);
}

// ─── Stat Cards & Charts ────────────────────────────────────────────
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/stats`);
        const data = await res.json();
        if (!data.success) return;

        const s = data.data;

        // ── Counters (animated) ──
        animateCounter('totalFeedback', s.totalFeedback);
        animateCounter('posCount', s.sentimentDistribution.Positive || 0);
        animateCounter('neuCount', s.sentimentDistribution.Neutral || 0);
        animateCounter('negCount', s.sentimentDistribution.Negative || 0);
        document.getElementById('avgRating').textContent =
            s.averageRating ? s.averageRating.toFixed(1) : '—';

        // ── Sentiment Pie ──
        renderPieChart(s.sentimentDistribution);

        // ── Sentiment Bar ──
        renderBarChart(s.sentimentDistribution);

        // ── Category Chart ──
        renderCategoryChart(s.categoryDistribution);

        // ── Rating Chart ──
        renderRatingChart(s.ratingDistribution);

        // ── Trend Chart ──
        renderTrendChart(s.trend);

    } catch (err) {
        console.error('Error loading stats:', err);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// CHART RENDERERS
// ═══════════════════════════════════════════════════════════════════════

function renderPieChart(sd) {
    const ctx = document.getElementById('sentimentPie').getContext('2d');
    if (pieChart) pieChart.destroy();

    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Positive', 'Neutral', 'Negative'],
            datasets: [{
                data: [sd.Positive || 0, sd.Neutral || 0, sd.Negative || 0],
                backgroundColor: ['#4ade80', '#818cf8', '#f87171'],
                borderWidth: 0,
                hoverOffset: 14
            }]
        },
        options: {
            responsive: true,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: "'Inter'", size: 12 }, padding: 14 }
                }
            }
        }
    });
}

function renderBarChart(sd) {
    const ctx = document.getElementById('sentimentBarChart').getContext('2d');
    if (barChart) barChart.destroy();

    const labels = ['Positive', 'Neutral', 'Negative'];
    const counts = [sd.Positive || 0, sd.Neutral || 0, sd.Negative || 0];
    const colors = ['#4ade80', '#818cf8', '#f87171'];

    barChart = new Chart(ctx, {
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
                barPercentage: 0.55
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
            plugins: { legend: { display: false } }
        }
    });
}

function renderCategoryChart(cats) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChart) categoryChart.destroy();

    const labels = cats.map(c => c.category || 'Unknown');
    const counts = cats.map(c => c.count);
    const palette = ['#6366f1', '#22d3ee', '#a78bfa', '#f472b6', '#facc15', '#34d399'];

    categoryChart = new Chart(ctx, {
        type: 'polarArea',
        data: {
            labels,
            datasets: [{
                data: counts,
                backgroundColor: palette.slice(0, labels.length).map(c => c + '99'),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            scales: {
                r: {
                    ticks: { display: false },
                    grid: { color: 'rgba(255,255,255,0.06)' }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: "'Inter'", size: 11 }, padding: 12 }
                }
            }
        }
    });
}

function renderRatingChart(rd) {
    const ctx = document.getElementById('ratingChart').getContext('2d');
    if (ratingChart) ratingChart.destroy();

    const labels = ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'];
    const counts = [rd[1] || 0, rd[2] || 0, rd[3] || 0, rd[4] || 0, rd[5] || 0];
    const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

    ratingChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Ratings',
                data: counts,
                backgroundColor: colors.map(c => c + 'aa'),
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderTrendChart(trend) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    if (trendChart) trendChart.destroy();

    if (!trend || !trend.length) {
        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['No data yet'],
                datasets: [{ data: [0], borderColor: '#64748b', borderDash: [5, 5] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
        return;
    }

    const labels = trend.map(t => t.date);

    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Positive',
                    data: trend.map(t => t.Positive || 0),
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74,222,128,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7
                },
                {
                    label: 'Neutral',
                    data: trend.map(t => t.Neutral || 0),
                    borderColor: '#818cf8',
                    backgroundColor: 'rgba(129,140,248,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7
                },
                {
                    label: 'Negative',
                    data: trend.map(t => t.Negative || 0),
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248,113,113,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7
                }
            ]
        },
        options: {
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#94a3b8', stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.05)' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { color: 'rgba(255,255,255,0.04)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#94a3b8', font: { family: "'Inter'", size: 12 }, padding: 16 }
                }
            }
        }
    });
}

// ─── Load Feedback List ──────────────────────────────────────────────
async function loadFeedbackList() {
    const sentiment = document.getElementById('filterSentiment').value;
    const category = document.getElementById('filterCategory').value;

    const params = new URLSearchParams({ limit: 50 });
    if (sentiment) params.append('sentiment', sentiment);
    if (category) params.append('category', category);

    try {
        const res = await fetch(`${API_BASE}?${params}`);
        const data = await res.json();
        const grid = document.getElementById('feedbackGrid');

        if (!data.success || !data.data.length) {
            grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No feedback matches the selected filters.</p>
        </div>`;
            return;
        }

        grid.innerHTML = data.data.map(fb => {
            const lbl = fb.sentiment?.label || 'Neutral';
            const emoji = lbl === 'Positive' ? '😊' : lbl === 'Negative' ? '😞' : '😐';
            const stars = '⭐'.repeat(fb.rating || 0);
            const date = new Date(fb.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            return `
        <div class="insight-card ${lbl.toLowerCase()} fade-in">
          <div class="user-name">${escapeHtml(fb.name)} <span style="font-size:0.8rem">${stars}</span></div>
          <div class="user-feedback">${escapeHtml(fb.message)}</div>
          <div class="meta-row">
            <span class="sentiment-badge ${lbl.toLowerCase()}">${emoji} ${lbl}</span>
            <span class="category-tag">${fb.category || 'General'}</span>
            <span class="time-tag">${date}</span>
          </div>
        </div>`;
        }).join('');

    } catch (err) {
        console.error('Error loading feedback list:', err);
    }
}

// ─── Animated Counter ───────────────────────────────────────────────
function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const duration = 800;
    const start = performance.now();
    const startVal = 0;

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(startVal + (target - startVal) * ease);
        if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
}

// ─── Utility ────────────────────────────────────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
