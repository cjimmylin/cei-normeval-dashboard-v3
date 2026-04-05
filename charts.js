// NormEval Dashboard — charts.js
// ECharts initialization for all charts
// Architecture: all data comes from pre-computed DATA_* constants in data.js

const COLORS = {
  blue: '#5b8def',
  green: '#4ecb71',
  orange: '#f0983e',
  red: '#ef5b5b',
  purple: '#a78bfa',
  cyan: '#22d3ee',
  bg: '#1c1f2e',
  border: '#2a2d42',
  text: '#e4e6f0',
  textMuted: '#6b6f89',
  textSecondary: '#9498b3',
};

const AXIS_COLORS = { ND: COLORS.blue, PE: COLORS.green, CI: COLORS.orange };

// Common dark theme options
function baseTheme() {
  return {
    backgroundColor: 'transparent',
    textStyle: { color: COLORS.textSecondary, fontFamily: 'Inter, sans-serif' },
    legend: { textStyle: { color: COLORS.textSecondary } },
    tooltip: {
      backgroundColor: '#1c1f2e',
      borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 12 },
    },
    toolbox: {
      show: true,
      right: 10,
      top: 0,
      feature: {
        saveAsImage: { title: 'Save PNG', pixelRatio: 2 },
        dataView: { title: 'Data', readOnly: true, lang: ['Data View', 'Close', ''] }
      },
      iconStyle: { borderColor: '#9498b3' }
    },
  };
}

// Lazy chart init map
const chartInstances = {};
function getChart(id) {
  if (!chartInstances[id]) {
    const el = document.getElementById(id);
    if (!el) return null;
    chartInstances[id] = echarts.init(el, null, { renderer: 'canvas' });
  }
  return chartInstances[id];
}

// ============================================================
// Tab 1: Overview — Gates Donut
// ============================================================
function renderGatesDonut() {
  const chart = getChart('chart-gates-donut');
  if (!chart) return;
  const d = DATA_OVERVIEW;
  const failReasons = d.fail_reasons;
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'item' }),
    series: [{
      type: 'pie',
      radius: ['45%', '72%'],
      center: ['50%', '52%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#1c1f2e', borderWidth: 2 },
      label: { color: COLORS.text, fontSize: 11 },
      data: [
        { value: d.n_pass, name: 'Pass (' + d.n_pass + ')', itemStyle: { color: COLORS.green } },
        { value: failReasons.nd_only, name: 'Fail: ND gate (' + failReasons.nd_only + ')', itemStyle: { color: COLORS.red } },
        { value: failReasons.data_only, name: 'Fail: Data gate (' + failReasons.data_only + ')', itemStyle: { color: COLORS.orange } },
        { value: failReasons.both, name: 'Fail: Both (' + failReasons.both + ')', itemStyle: { color: '#8b5cf6' } },
      ]
    }]
  }));
}

// ============================================================
// Tab 1: Overview — Tradition Frequency Bar
// ============================================================
function renderTraditionFreqBar() {
  const chart = getChart('chart-tradition-freq');
  if (!chart) return;
  const d = DATA_OVERVIEW.tradition_freq;
  const tColors = [COLORS.purple, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    xAxis: {
      type: 'category',
      data: d.map(function(t) { return t.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value',
      name: 'Benchmarks',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: d.map(function(t, i) {
        return { value: t.count, itemStyle: { color: tColors[i], borderRadius: [4, 4, 0, 0] } };
      }),
      barWidth: '50%',
      label: { show: true, position: 'top', color: COLORS.text, fontSize: 12, fontWeight: 600 }
    }]
  }));
}

// ============================================================
// Tab 3: Feature Matrix Heatmap
// ============================================================
function renderFeatureHeatmap() {
  var chart = getChart('chart-feature-heatmap');
  if (!chart) return;
  var fm = DATA_FEATURE_MATRIX;
  var heatData = [];
  // Normalize columns to 0-100 for color mapping
  var colMins = [], colMaxes = [];
  for (var c = 0; c < fm.columns.length; c++) {
    var minV = Infinity, maxV = -Infinity;
    for (var r = 0; r < fm.data.length; r++) {
      var v = fm.data[r][c];
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    colMins.push(minV);
    colMaxes.push(maxV);
  }

  for (var r = 0; r < fm.data.length; r++) {
    for (var c = 0; c < fm.columns.length; c++) {
      var raw = fm.data[r][c];
      var norm = colMaxes[c] === colMins[c] ? 50 : ((raw - colMins[c]) / (colMaxes[c] - colMins[c])) * 100;
      heatData.push([c, r, Math.round(norm), raw]);
    }
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e',
      borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      formatter: function(p) {
        return '<b>' + fm.row_names[p.value[1]] + '</b><br/>' +
               fm.columns[p.value[0]] + ': ' + p.value[3] +
               ' <span style="color:' + AXIS_COLORS[fm.column_axes[p.value[0]]] + '">(' +
               fm.column_axes[p.value[0]] + ')</span>';
      }
    },
    grid: { left: 200, right: 40, top: 60, bottom: 30 },
    xAxis: {
      type: 'category',
      data: fm.columns,
      position: 'top',
      axisLabel: { color: COLORS.textSecondary, fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: COLORS.border } },
      splitArea: { show: false },
    },
    yAxis: {
      type: 'category',
      data: fm.row_names,
      inverse: true,
      axisLabel: {
        color: function(value, index) {
          return fm.passes_gates[index] ? COLORS.green : COLORS.textMuted;
        },
        fontSize: 10,
        width: 180,
        overflow: 'truncate'
      },
      axisLine: { lineStyle: { color: COLORS.border } },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0, max: 100,
      calculable: false, show: false,
      inRange: {
        color: ['#0d1b2a', '#1b3a5c', '#2a6f97', '#52b788', '#b5e48c']
      }
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } },
      itemStyle: { borderColor: '#0f1117', borderWidth: 1, borderRadius: 2 },
    }]
  }));
}

// ============================================================
// Tab 4: Tradition Heatmap
// ============================================================
function renderTraditionHeatmap() {
  var chart = getChart('chart-tradition-heatmap');
  if (!chart) return;
  var tc = DATA_TRADITION_COVERAGE;
  var heatData = [];
  for (var r = 0; r < tc.heatmap.length; r++) {
    for (var c = 0; c < tc.traditions.length; c++) {
      heatData.push([c, r, tc.heatmap[r][c]]);
    }
  }
  var tColors = [COLORS.purple, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      formatter: function(p) {
        return '<b>' + tc.benchmark_names[p.value[1]] + '</b><br/>' +
               tc.traditions[p.value[0]] + ': ' + p.value[2];
      }
    },
    grid: { left: 200, right: 40, top: 50, bottom: 30 },
    xAxis: {
      type: 'category',
      data: tc.traditions,
      position: 'top',
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: tc.benchmark_names,
      inverse: true,
      axisLabel: {
        color: function(value, index) {
          return tc.passes_gates[index] ? COLORS.green : COLORS.textMuted;
        },
        fontSize: 10, width: 180, overflow: 'truncate'
      },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    visualMap: {
      min: 0, max: 100, show: true, orient: 'horizontal',
      left: 'center', bottom: 0,
      textStyle: { color: COLORS.textMuted },
      inRange: {
        color: ['#1a1a2e', '#3b0764', '#7c3aed', '#a78bfa', '#c4b5fd']
      }
    },
    series: [{
      type: 'heatmap',
      data: heatData,
      itemStyle: { borderColor: '#0f1117', borderWidth: 1, borderRadius: 2 },
      emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } },
    }]
  }));
}

function renderTraditionBar() {
  var chart = getChart('chart-tradition-bar');
  if (!chart) return;
  var d = DATA_TRADITION_COVERAGE.frequency;
  var tColors = [COLORS.purple, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    xAxis: {
      type: 'value',
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: d.map(function(t) { return t.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: d.map(function(t, i) {
        return { value: t.count, itemStyle: { color: tColors[i], borderRadius: [0, 4, 4, 0] } };
      }),
      label: { show: true, position: 'right', color: COLORS.text, fontSize: 12, fontWeight: 600 }
    }]
  }));
}

function renderEntropy() {
  var chart = getChart('chart-entropy');
  if (!chart) return;
  var tc = DATA_TRADITION_COVERAGE;
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      trigger: 'axis',
      formatter: function(params) {
        var p = params[0];
        return '<b>' + tc.benchmark_names[p.dataIndex] + '</b><br/>Entropy: ' + p.value;
      }
    },
    grid: { left: 200, right: 30, top: 10, bottom: 30 },
    xAxis: {
      type: 'value', name: 'Shannon Entropy (bits)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: tc.benchmark_names,
      inverse: true,
      axisLabel: { color: COLORS.textMuted, fontSize: 9, width: 170, overflow: 'truncate' },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: tc.entropies.map(function(e, i) {
        return {
          value: e,
          itemStyle: { color: tc.passes_gates[i] ? COLORS.green : COLORS.textMuted, borderRadius: [0, 3, 3, 0] }
        };
      }),
      barWidth: 8,
    }]
  }));
}

// ============================================================
// Tab 5: Composite Scoring — ND vs PE Scatter
// ============================================================
function renderNDPEScatter() {
  var chart = getChart('chart-nd-pe-scatter');
  if (!chart) return;
  var scatter = DATA_COMPOSITE_SCORING.scatter;
  var passData = [], failData = [];
  for (var i = 0; i < scatter.length; i++) {
    var s = scatter[i];
    var item = [s.nd, s.pe, s.ci, s.name, s.composite];
    if (s.passes) passData.push(item);
    else failData.push(item);
  }

  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      formatter: function(p) {
        var d = p.data;
        return '<b>' + d[3] + '</b><br/>' +
               'ND: ' + d[0] + ' | PE: ' + d[1] + ' | CI: ' + d[2] +
               '<br/>Composite: ' + d[4];
      }
    },
    legend: {
      data: ['Pass Gates', 'Fail Gates'],
      textStyle: { color: COLORS.textSecondary },
      top: 5,
    },
    grid: { left: 60, right: 30, top: 50, bottom: 50 },
    xAxis: {
      type: 'value', name: 'Normative Depth (ND)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      min: 10, max: 95,
    },
    yAxis: {
      type: 'value', name: 'Practical Ecosystem (PE)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      min: 20, max: 100,
    },
    series: [
      {
        name: 'Pass Gates', type: 'scatter',
        data: passData,
        symbolSize: function(d) { return Math.max(8, d[2] / 3); },
        itemStyle: { color: COLORS.green, opacity: 0.85 },
        label: {
          show: true, formatter: function(p) { return p.data[3].substring(0, 12); },
          position: 'right', color: COLORS.textSecondary, fontSize: 9,
        },
      },
      {
        name: 'Fail Gates', type: 'scatter',
        data: failData,
        symbolSize: function(d) { return Math.max(8, d[2] / 3); },
        itemStyle: { color: COLORS.red, opacity: 0.5 },
      },
    ]
  }));
}

function renderGateSensitivity() {
  var chart = getChart('chart-gate-sensitivity');
  if (!chart) return;
  var gt = DATA_COMPOSITE_SCORING.gate_threshold;
  var thresholds = Object.keys(gt).sort();
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    xAxis: {
      type: 'category',
      data: thresholds.map(function(k) { return k.replace('ND_gate_', 'ND >= '); }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', name: 'Passing Count',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      min: 10, max: 20,
    },
    series: [{
      type: 'line',
      data: thresholds.map(function(k) { return gt[k]; }),
      itemStyle: { color: COLORS.blue },
      lineStyle: { width: 2 },
      symbol: 'circle',
      symbolSize: 8,
      label: { show: true, position: 'top', color: COLORS.text, fontSize: 12, fontWeight: 600 },
      markLine: {
        silent: true,
        data: [{ yAxis: 15, lineStyle: { color: COLORS.orange, type: 'dashed' }, label: { formatter: 'Current Top 15', color: COLORS.orange } }]
      }
    }]
  }));
}

// ============================================================
// Tab 6: Trials
// ============================================================
function renderTrialsBar() {
  var chart = getChart('chart-trials-bar');
  if (!chart) return;
  var trials = DATA_TRIAL_DATA.trials;
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    legend: { data: ['Accuracy', 'Discriminative Power'], textStyle: { color: COLORS.textSecondary }, top: 5 },
    grid: { left: 50, right: 20, top: 50, bottom: 40 },
    xAxis: {
      type: 'category',
      data: trials.map(function(t) { return t.id; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', name: '%',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      min: 0, max: 100,
    },
    series: [
      {
        name: 'Accuracy', type: 'bar',
        data: trials.map(function(t) {
          return { value: t.accuracy, itemStyle: { color: COLORS.green, borderRadius: [4, 4, 0, 0] } };
        }),
        barGap: '10%',
      },
      {
        name: 'Discriminative Power', type: 'bar',
        data: trials.map(function(t) {
          return { value: t.discriminative, itemStyle: { color: COLORS.blue, borderRadius: [4, 4, 0, 0] } };
        }),
      },
    ]
  }));
}

function renderDifficultyPie() {
  var chart = getChart('chart-difficulty-pie');
  if (!chart) return;
  var dd = DATA_TRIAL_DATA.difficulty_distribution;
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'item' }),
    series: [{
      type: 'pie',
      radius: ['40%', '68%'],
      center: ['50%', '55%'],
      itemStyle: { borderRadius: 6, borderColor: '#1c1f2e', borderWidth: 2 },
      label: { color: COLORS.text, fontSize: 11 },
      data: [
        { value: dd.Easy, name: 'Easy (' + dd.Easy + ')', itemStyle: { color: COLORS.green } },
        { value: dd.Medium, name: 'Medium (' + dd.Medium + ')', itemStyle: { color: COLORS.orange } },
        { value: dd.Hard, name: 'Hard (' + dd.Hard + ')', itemStyle: { color: COLORS.red } },
      ]
    }]
  }));
}

// ============================================================
// Tab 7: Data Availability
// ============================================================
function renderHostBar() {
  var chart = getChart('chart-host-bar');
  if (!chart) return;
  var d = DATA_AVAILABILITY.host_distribution;
  var hostColors = { GitHub: COLORS.green, HuggingFace: COLORS.purple, Other: COLORS.blue, None: COLORS.red };
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    xAxis: {
      type: 'category',
      data: d.map(function(h) { return h.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', name: 'Count',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: d.map(function(h) {
        return { value: h.count, itemStyle: { color: hostColors[h.name] || COLORS.blue, borderRadius: [4, 4, 0, 0] } };
      }),
      label: { show: true, position: 'top', color: COLORS.text, fontSize: 12, fontWeight: 600 }
    }]
  }));
}

function renderLicensePie() {
  var chart = getChart('chart-license-pie');
  if (!chart) return;
  var d = DATA_AVAILABILITY.license_distribution;
  var licColors = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.cyan, COLORS.red];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'item' }),
    series: [{
      type: 'pie',
      radius: ['35%', '68%'],
      center: ['50%', '55%'],
      itemStyle: { borderRadius: 6, borderColor: '#1c1f2e', borderWidth: 2 },
      label: { color: COLORS.text, fontSize: 10 },
      data: d.map(function(l, i) {
        return { value: l.count, name: l.name + ' (' + l.count + ')', itemStyle: { color: licColors[i % licColors.length] } };
      })
    }]
  }));
}

// ============================================================
// Tab 9: Gaps — Care Ethics Prototype Dimensions
// ============================================================
function renderCarePrototypeDims() {
  var chart = getChart('chart-care-dims');
  if (!chart) return;
  var cp = DATA_GAPS.care_prototype;
  if (!cp) return;
  var dims = cp.dimensions;
  var dimColors = [COLORS.green, COLORS.blue, COLORS.orange, COLORS.purple];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    grid: { left: 120, right: 50, top: 20, bottom: 30 },
    xAxis: {
      type: 'value', name: '%', min: 80, max: 100,
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: dims.map(function(d) { return d.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: dims.map(function(d, i) {
        return {
          value: d.pct,
          itemStyle: { color: dimColors[i], borderRadius: [0, 4, 4, 0] }
        };
      }),
      label: {
        show: true, position: 'right', color: COLORS.text, fontSize: 12, fontWeight: 600,
        formatter: function(p) { return p.value + '%'; }
      }
    }]
  }));
}

// ============================================================
// Tab 9: Gaps — Void Bar
// ============================================================
function renderVoidBar() {
  var chart = getChart('chart-void-bar');
  if (!chart) return;
  var freq = DATA_OVERVIEW.tradition_freq;
  var tColors = [COLORS.purple, COLORS.blue, COLORS.orange, COLORS.red, COLORS.cyan];
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    grid: { left: 120, right: 40, top: 20, bottom: 30 },
    xAxis: {
      type: 'value', name: 'Benchmarks >= 50',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
      max: 30,
    },
    yAxis: {
      type: 'category',
      data: freq.map(function(t) { return t.name; }),
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: freq.map(function(t, i) {
        return {
          value: t.count,
          itemStyle: {
            color: t.count <= 2 ? COLORS.red : tColors[i],
            borderRadius: [0, 4, 4, 0]
          }
        };
      }),
      label: {
        show: true, position: 'right', color: COLORS.text, fontSize: 12, fontWeight: 600,
        formatter: function(p) { return p.value + (p.value <= 2 ? ' (VOID)' : ''); }
      }
    }]
  }));
}


// ============================================================
// Render all charts (called from app.js on tab show)
// ============================================================
function renderOverviewCharts() {
  renderGatesDonut();
  renderTraditionFreqBar();
}

function renderFeatureCharts() {
  renderFeatureHeatmap();
}

function renderTraditionCharts() {
  renderTraditionHeatmap();
  renderTraditionBar();
  renderEntropy();
}

function renderCompositeCharts() {
  renderNDPEScatter();
  renderGateSensitivity();
}

function renderTrialCharts() {
  renderTrialsBar();
  renderDifficultyPie();
}

function renderDataCharts() {
  renderHostBar();
  renderLicensePie();
}

function renderGapsCharts() {
  renderVoidBar();
  renderCarePrototypeDims();
}

// ============================================================
// Tab 8: Cross-Model Charts
// ============================================================
function renderCMIHChart() {
  var cm = DATA_CROSS_MODEL;
  if (!cm.key_charts || !cm.key_charts.ih_scaling) return;
  var kc = cm.key_charts.ih_scaling;
  var el = document.getElementById('chart-cm-ih');
  if (!el) return;
  var chart = echarts.init(el);
  chartInstances['cm-ih'] = chart;
  var opt = baseTheme();
  opt.xAxis = { type: 'category', data: kc.models, axisLabel: { color: COLORS.textSecondary } };
  opt.yAxis = { type: 'value', min: 0, max: 7, name: 'OUS Score (1-7)', nameTextStyle: { color: COLORS.textMuted, fontSize: 11 }, axisLabel: { color: COLORS.textSecondary } };
  opt.series = [
    { name: 'IB (Impartial Beneficence)', type: 'bar', data: kc.IB_means, itemStyle: { color: COLORS.green }, barWidth: '30%' },
    { name: 'IH (Instrumental Harm)', type: 'bar', data: kc.IH_means, itemStyle: { color: COLORS.red }, barWidth: '30%' },
    { name: 'Util. Philosophers IH', type: 'line', data: [kc.philosopher_IH, kc.philosopher_IH, kc.philosopher_IH], lineStyle: { type: 'dashed', color: COLORS.orange }, symbol: 'none', itemStyle: { color: COLORS.orange } },
    { name: 'Lay Population IH', type: 'line', data: [kc.lay_IH, kc.lay_IH, kc.lay_IH], lineStyle: { type: 'dashed', color: COLORS.textMuted }, symbol: 'none', itemStyle: { color: COLORS.textMuted } },
  ];
  opt.legend = { data: ['IB (Impartial Beneficence)', 'IH (Instrumental Harm)', 'Util. Philosophers IH', 'Lay Population IH'], textStyle: { color: COLORS.textSecondary, fontSize: 10 }, bottom: 0 };
  opt.tooltip = Object.assign({}, opt.tooltip, { trigger: 'axis' });
  opt.grid = { top: 30, bottom: 80, left: 50, right: 20 };
  chart.setOption(opt);
}

function renderCMCBRChart() {
  var cm = DATA_CROSS_MODEL;
  if (!cm.key_charts || !cm.key_charts.cbr_rate) return;
  var kc = cm.key_charts.cbr_rate;
  var el = document.getElementById('chart-cm-cbr');
  if (!el) return;
  var chart = echarts.init(el);
  chartInstances['cm-cbr'] = chart;
  var opt = baseTheme();
  opt.xAxis = { type: 'category', data: kc.models, axisLabel: { color: COLORS.textSecondary } };
  opt.yAxis = { type: 'value', min: 0, max: 100, name: 'CBR Rate (%)', nameTextStyle: { color: COLORS.textMuted, fontSize: 11 }, axisLabel: { color: COLORS.textSecondary } };
  opt.series = [
    { name: 'CBR (Consequentialist)', type: 'bar', data: kc.cbr_percent, itemStyle: { color: function(p) { return [COLORS.blue, COLORS.green, COLORS.orange][p.dataIndex]; } }, barWidth: '40%', label: { show: true, position: 'top', formatter: '{c}%', color: COLORS.text, fontSize: 12 } },
  ];
  opt.tooltip = Object.assign({}, opt.tooltip, { trigger: 'axis', formatter: function(p) { return p[0].name + ': ' + p[0].value + '% consequentialist'; } });
  opt.grid = { top: 30, bottom: 30, left: 50, right: 20 };
  chart.setOption(opt);
}

function renderCMKJChart() {
  var cm = DATA_CROSS_MODEL;
  if (!cm.key_charts || !cm.key_charts.knowledge_vs_judgment) return;
  var kc = cm.key_charts.knowledge_vs_judgment;
  var el = document.getElementById('chart-cm-kj');
  if (!el) return;
  var chart = echarts.init(el);
  chartInstances['cm-kj'] = chart;
  var opt = baseTheme();
  var cats = kc.categories;
  var vals = kc.three_way_agreement.map(function(v) { return v === 'variable' ? 73 : v; });
  opt.xAxis = { type: 'category', data: cats, axisLabel: { color: COLORS.textSecondary, fontSize: 10, rotate: 15 } };
  opt.yAxis = { type: 'value', min: 0, max: 100, name: 'Three-Way Agreement (%)', nameTextStyle: { color: COLORS.textMuted, fontSize: 11 }, axisLabel: { color: COLORS.textSecondary } };
  opt.series = [{
    type: 'bar', data: vals,
    itemStyle: { color: function(p) { return p.value >= 95 ? COLORS.green : p.value >= 70 ? COLORS.orange : COLORS.red; } },
    barWidth: '50%',
    label: { show: true, position: 'top', formatter: '{c}%', color: COLORS.text, fontSize: 11 }
  }];
  opt.grid = { top: 30, bottom: 50, left: 50, right: 20 };
  chart.setOption(opt);
}

function renderCMPersuasionChart() {
  var cm = DATA_CROSS_MODEL;
  if (!cm.key_charts || !cm.key_charts.persuasion_resistance) return;
  var kc = cm.key_charts.persuasion_resistance;
  var el = document.getElementById('chart-cm-persuasion');
  if (!el) return;
  var chart = echarts.init(el);
  chartInstances['cm-persuasion'] = chart;
  var opt = baseTheme();
  opt.xAxis = { type: 'category', data: kc.models, axisLabel: { color: COLORS.textSecondary } };
  opt.yAxis = { type: 'value', min: 0, max: 100, name: 'Decision Change Rate (%)', nameTextStyle: { color: COLORS.textMuted, fontSize: 11 }, axisLabel: { color: COLORS.textSecondary } };
  opt.series = [{
    type: 'bar', data: kc.dcr_percent,
    itemStyle: { color: function(p) { return p.value === 0 ? COLORS.green : p.value <= 35 ? COLORS.orange : COLORS.red; } },
    barWidth: '40%',
    label: { show: true, position: 'top', formatter: '{c}%', color: COLORS.text, fontSize: 12 }
  }];
  opt.grid = { top: 30, bottom: 30, left: 50, right: 20 };
  chart.setOption(opt);
}

function renderCrossModelCharts() {
  renderCMIHChart();
  renderCMCBRChart();
  renderCMKJChart();
  renderCMPersuasionChart();
}

// ============================================================
// Tab 10: Cross-Vendor Charts
// ============================================================
var CV_PROVIDER_COLORS = { 'Anthropic': '#a78bfa', 'OpenAI': '#2dd4bf', 'Google': '#5b8def' };

function renderCVHeatmapChart() {
  var cv = DATA_CROSS_VENDOR;
  if (!cv || !cv.heatmap) return;
  var chart = getChart('chart-cv-heatmap');
  if (!chart) return;
  var hm = cv.heatmap;
  var heatData = [];
  for (var r = 0; r < hm.matrix.length; r++) {
    for (var c = 0; c < hm.matrix[r].length; c++) {
      heatData.push([c, r, hm.matrix[r][c]]);
    }
  }
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      formatter: function(p) {
        return '<b>' + hm.labels[p.value[1]] + ' ↔ ' + hm.labels[p.value[0]] + '</b>: ' + p.value[2].toFixed(1) + '%';
      }
    },
    grid: { left: 90, right: 40, top: 10, bottom: 90 },
    xAxis: {
      type: 'category',
      data: hm.labels,
      axisLabel: { color: COLORS.textSecondary, fontSize: 10, rotate: 45 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: hm.labels,
      axisLabel: { color: COLORS.textSecondary, fontSize: 10 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    visualMap: {
      min: 70, max: 100, calculable: false, show: true,
      orient: 'horizontal', left: 'center', bottom: 0,
      textStyle: { color: COLORS.textMuted },
      inRange: { color: ['#ef5b5b', '#f0983e', '#2dd4bf'] }
    },
    graphic: [
      { type: 'text', left: '8%', bottom: '6%', style: { text: 'Anthropic', fill: '#a78bfa', fontSize: 10, fontWeight: 'bold' } },
      { type: 'text', left: '30%', bottom: '6%', style: { text: 'Google', fill: '#5b8def', fontSize: 10, fontWeight: 'bold' } },
      { type: 'text', left: '62%', bottom: '6%', style: { text: 'OpenAI', fill: '#2dd4bf', fontSize: 10, fontWeight: 'bold' } },
      { type: 'text', right: '3%', bottom: '6%', style: { text: '(Scale: 70\u2013100%, compressed to highlight divergence)', fill: '#6b6f89', fontSize: 9, fontStyle: 'italic' } }
    ],
    series: [{
      type: 'heatmap',
      data: heatData,
      itemStyle: { borderColor: '#0f1117', borderWidth: 1, borderRadius: 2 },
      emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } },
    }]
  }));
}

function renderCVIHChart() {
  var cv = DATA_CROSS_VENDOR;
  if (!cv || !cv.ih_scaling) return;
  var chart = getChart('chart-cv-ih');
  if (!chart) return;
  var ih = cv.ih_scaling;
  // Build sorted indices by IH_means ascending
  var indices = [];
  for (var i = 0; i < ih.models.length; i++) indices.push(i);
  indices.sort(function(a, b) { return ih.IH_means[a] - ih.IH_means[b]; });
  var sortedModels = indices.map(function(i) { return ih.models[i]; });
  var sortedIH = indices.map(function(i) { return ih.IH_means[i]; });
  var sortedProviders = indices.map(function(i) { return ih.providers[i]; });
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    grid: { left: 80, right: 40, top: 20, bottom: 30 },
    xAxis: {
      type: 'value', min: 0, max: 7,
      name: 'IH Score (1-7)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'category',
      data: sortedModels,
      axisLabel: { color: COLORS.textSecondary, fontSize: 11 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: sortedIH.map(function(v, i) {
        var baseColor = CV_PROVIDER_COLORS[sortedProviders[i]] || COLORS.blue;
        var isHaikuN1 = sortedModels[i].indexOf('\u2021') !== -1;
        return {
          value: v,
          itemStyle: {
            color: isHaikuN1 ? baseColor + '80' : baseColor,
            borderRadius: [0, 4, 4, 0],
            borderColor: isHaikuN1 ? '#f0983e' : 'transparent',
            borderWidth: isHaikuN1 ? 2 : 0,
            borderType: isHaikuN1 ? 'dashed' : 'solid'
          }
        };
      }),
      label: { show: true, position: 'right', color: COLORS.text, fontSize: 12, fontWeight: 600 },
      markLine: {
        silent: true,
        data: [
          { xAxis: 4.5, lineStyle: { color: COLORS.orange, type: 'dashed' }, label: { formatter: 'Philosopher IH', color: COLORS.orange, fontSize: 10 } },
          { xAxis: 3.1, lineStyle: { color: COLORS.textMuted, type: 'dashed' }, label: { formatter: 'Lay IH', color: COLORS.textMuted, fontSize: 10 } }
        ]
      }
    }]
  }));
}

function renderCVCBRChart() {
  var cv = DATA_CROSS_VENDOR;
  if (!cv || !cv.cbr_rate) return;
  var chart = getChart('chart-cv-cbr');
  if (!chart) return;
  var cbr = cv.cbr_rate;
  // Sort by CBR ascending
  var paired = [];
  for (var i = 0; i < cbr.models.length; i++) {
    paired.push({ model: cbr.models[i], cbr: cbr.cbr_percent[i], provider: cbr.providers[i] });
  }
  paired.sort(function(a, b) { return a.cbr - b.cbr; });
  var sortedModels = paired.map(function(p) { return p.model; });
  var sortedCBR = paired.map(function(p) { return p.cbr; });
  var sortedProviders = paired.map(function(p) { return p.provider; });
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: Object.assign(baseTheme().tooltip, { trigger: 'axis' }),
    grid: { left: 50, right: 20, top: 30, bottom: 80 },
    xAxis: {
      type: 'category',
      data: sortedModels,
      axisLabel: { color: COLORS.textSecondary, fontSize: 11, rotate: 30 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', name: 'CBR Rate (%)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'bar',
      data: sortedCBR.map(function(v, i) {
        return {
          value: v,
          itemStyle: { color: CV_PROVIDER_COLORS[sortedProviders[i]] || COLORS.blue, borderRadius: [4, 4, 0, 0] }
        };
      }),
      barWidth: '50%',
      label: { show: true, position: 'top', color: COLORS.text, fontSize: 12, fontWeight: 600, formatter: '{c}%' }
    }]
  }));
}

function renderCVKJChart() {
  var cv = DATA_CROSS_VENDOR;
  if (!cv || !cv.knowledge_judgment || !cv.knowledge_judgment.trials) return;
  var chart = getChart('chart-cv-kj');
  if (!chart) return;
  var trials = cv.knowledge_judgment.trials;
  var typeColors = { knowledge: '#5b8def', judgment: '#f0983e', mixed: '#a78bfa' };
  var names = trials.map(function(t) { return t.name; });
  var baseData = trials.map(function(t) { return t.min_agreement; });
  var rangeData = trials.map(function(t) {
    return {
      value: t.max_agreement - t.min_agreement,
      min_val: t.min_agreement,
      max_val: t.max_agreement,
      trial_type: t.type
    };
  });
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
      trigger: 'axis',
      formatter: function(params) {
        if (params.length < 2) return '';
        var p = params[1];
        var d = p.data;
        return '<b>' + names[p.dataIndex] + '</b><br/>' +
               'Range: ' + d.min_val + '% – ' + d.max_val + '%<br/>' +
               'Type: ' + d.trial_type;
      }
    },
    grid: { left: 50, right: 20, top: 20, bottom: 80 },
    xAxis: {
      type: 'category',
      data: names,
      axisLabel: { color: COLORS.textSecondary, fontSize: 10, rotate: 30 },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    yAxis: {
      type: 'value', min: 0, max: 100, name: 'Agreement (%)',
      nameTextStyle: { color: COLORS.textMuted },
      axisLabel: { color: COLORS.textMuted },
      splitLine: { lineStyle: { color: COLORS.border } },
    },
    series: [
      {
        name: 'Base',
        type: 'bar',
        stack: 'range',
        data: baseData,
        itemStyle: { color: 'transparent' },
        emphasis: { itemStyle: { color: 'transparent' } },
      },
      {
        name: 'Range',
        type: 'bar',
        stack: 'range',
        data: rangeData,
        itemStyle: {
          color: function(p) { return typeColors[p.data.trial_type] || COLORS.blue; },
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true, position: 'top', color: COLORS.text, fontSize: 10,
          formatter: function(p) { return p.data.min_val + '–' + p.data.max_val + '%'; }
        }
      }
    ]
  }));
}

function renderCVRadarChart() {
  var cv = DATA_CROSS_VENDOR;
  if (!cv || !cv.provider_profiles) return;
  var chart = getChart('chart-cv-radar');
  if (!chart) return;
  var pp = cv.provider_profiles;
  var indicators = pp.dimensions.map(function(d) { return { name: d, max: 100 }; });
  var seriesData = [];
  var providerNames = Object.keys(pp.profiles);
  for (var i = 0; i < providerNames.length; i++) {
    var name = providerNames[i];
    var color = CV_PROVIDER_COLORS[name] || COLORS.blue;
    seriesData.push({
      value: pp.profiles[name],
      name: name,
      lineStyle: { color: color, width: 2 },
      itemStyle: { color: color },
      areaStyle: { color: color + '33' }
    });
  }
  chart.setOption(Object.assign(baseTheme(), {
    tooltip: {
      backgroundColor: '#1c1f2e', borderColor: '#2a2d42',
      textStyle: { color: COLORS.text, fontSize: 11 },
    },
    legend: {
      data: providerNames,
      textStyle: { color: COLORS.textSecondary },
      bottom: 0
    },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: { color: COLORS.textSecondary, fontSize: 10 },
      splitLine: { lineStyle: { color: COLORS.border } },
      splitArea: { areaStyle: { color: ['transparent'] } },
      axisLine: { lineStyle: { color: COLORS.border } },
    },
    series: [{
      type: 'radar',
      data: seriesData,
    }]
  }));
}

function renderCrossVendorCharts() {
  renderCVHeatmapChart();
  renderCVIHChart();
  renderCVCBRChart();
  renderCVKJChart();
  renderCVRadarChart();
}

// Resize handler
window.addEventListener('resize', function() {
  Object.values(chartInstances).forEach(function(c) { c.resize(); });
});
