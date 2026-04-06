scales: {
  x: {
    ticks: {
      color: document.documentElement.classList.contains('light')
        ? '#334155' : 'rgba(169,127,240,0.5)',
      font: { family: 'DM Sans', size: 8 },
      maxTicksLimit: 8
    },
    grid: {
      color: document.documentElement.classList.contains('light')
        ? 'rgba(0,0,0,0.08)' : 'rgba(123,76,224,0.08)'
    }
  },
  y: {
    min: 40, max: 180,
    ticks: {
      color: document.documentElement.classList.contains('light')
        ? '#334155' : 'rgba(169,127,240,0.5)',
      font: { family: 'DM Sans', size: 9 }
    },
    grid: {
      color: document.documentElement.classList.contains('light')
        ? 'rgba(0,0,0,0.08)' : 'rgba(123,76,224,0.12)'
    }
  },
},
