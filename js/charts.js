const chartInstances = {};
let currentTheme = 'dark';

const themeColors = {
  light: {
    grid: 'rgba(0, 0, 0, 0.1)',
    ticks: '#666',
    tooltipBg: '#fff',
    tooltipText: '#333'
  },
  dark: {
    grid: 'rgba(255, 255, 255, 0.1)',
    ticks: '#ccc',
    tooltipBg: '#222',
    tooltipText: '#eee'
  }
};

function getChartOptions(theme) {
    const colors = themeColors[theme];
    return {
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: colors.tooltipBg,
                titleColor: colors.tooltipText,
                bodyColor: colors.tooltipText,
            }
        },
        scales: {
            x: { 
                ticks: { color: colors.ticks, font: { family: "'Courier New', monospace" } }, 
                grid: { color: colors.grid } 
            },
            y: { 
                beginAtZero: false, 
                ticks: { color: colors.ticks, font: { family: "'Courier New', monospace" } }, 
                grid: { color: colors.grid } 
            }
        },
        responsive: true,
        maintainAspectRatio: false,
    };
}


function renderChart(canvasId, label, data, theme, primaryColor) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    if (!data || data.length < 2) {
        // You can display a message here if you want
        return;
    }
    
    const options = getChartOptions(theme);

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map((_, i) => i + 1), // Simple numeric labels
            datasets: [{
                label: label,
                data: data,
                borderColor: primaryColor,
                backgroundColor: primaryColor + '33', // 20% opacity
                tension: 0.3,
                borderWidth: 2,
                fill: true,
                pointRadius: 1,
            }]
        },
        options: options
    });
}


window.renderSessionCharts = function(sessionData) {
    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();

    renderChart('chart-bpm', 'Heart Rate', sessionData.bpm?.values, theme, primaryColor);
    renderChart('chart-power', 'Power', sessionData.power?.values, theme, primaryColor);
    renderChart('chart-rpm', 'Cadence', sessionData.rpm?.values, theme, primaryColor);
    renderChart('chart-speed', 'Km/h', sessionData.speed?.values, theme, primaryColor);
}

window.addEventListener('themeChanged', (e) => {
    // Re-render charts with the new theme
    // We need the data again. This is a bit tricky.
    // For now, let's assume the data is somehow available or we just update options.
    const newTheme = e.detail.theme;
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();

    for (const chartId in chartInstances) {
        const chart = chartInstances[chartId];
        const newOptions = getChartOptions(newTheme);
        chart.options = newOptions;

        // Update dataset colors if needed (primaryColor might change)
        chart.data.datasets[0].borderColor = primaryColor;
        chart.data.datasets[0].backgroundColor = primaryColor + '33';
        
        chart.update();
    }
}); 