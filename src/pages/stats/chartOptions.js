function truncateLabel(maxLen) {
  return function (val) {
    const label = this.getLabelForValue(val);
    const s = String(label || "");
    return s.length > maxLen ? `${s.slice(0, maxLen)}...` : s;
  };
}

export const defaultBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
};

export const leadBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: (ctx) => ` ${ctx.parsed.x}` } },
  },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } },
    y: { ticks: { autoSkip: false, callback: truncateLabel(22) } },
  },
};

export const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "bottom" } },
};

export const stackedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "top" } },
  scales: {
    x: { stacked: true },
    y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
  },
};

export const horizontalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: { legend: { display: false } },
  scales: {
    x: { beginAtZero: true, ticks: { precision: 0 } },
    y: { ticks: { autoSkip: false, callback: truncateLabel(20) } },
  },
};

export const horizontalStackedBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: "y",
  plugins: { legend: { position: "top" } },
  scales: {
    x: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
    y: {
      stacked: true,
      ticks: { autoSkip: false, callback: truncateLabel(20) },
    },
  },
};
