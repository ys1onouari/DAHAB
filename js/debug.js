const DEBUG_KEY = 'dahab_debug';
let _memoryInterval = null;

export function isDebugEnabled() {
  return window.__DAHAB_DEBUG?.enabled === true;
}

export function initDebug() {
  if (!isDebugEnabled()) return;
  const dbg = window.__DAHAB_DEBUG;
  dbg.log('DEBUG', 'Debug module loaded');

  if (window.performance && performance.getEntriesByType) {
    const resources = performance.getEntriesByType('resource');
    resources.forEach(r => {
      if (r.duration > 3000) {
        dbg.log('SLOW', r.name + ' took ' + r.duration.toFixed(0) + 'ms');
      }
    });
  }

  if (performance.memory) {
    _memoryInterval = setInterval(() => {
      const mem = performance.memory;
      dbg.log('MEMORY', 'used=' + (mem.usedJSHeapSize / 1048576).toFixed(1) + 'MB limit=' + (mem.jsHeapSizeLimit / 1048576).toFixed(1) + 'MB');
    }, 15000);
  }

  if (window.PerformanceObserver) {
    try {
      const obs = new PerformanceObserver(list => {
        list.getEntries().forEach(e => {
          if (e.duration > 100) {
            dbg.log('LONGTASK', e.duration.toFixed(0) + 'ms');
          }
        });
      });
      obs.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      dbg.log('DEBUG', 'PerformanceObserver longtask not supported');
    }
    try {
      const layoutObs = new PerformanceObserver(list => {
        list.getEntries().forEach(e => {
          if (e.value > 0.1) {
            dbg.log('LAYOUTSHIFT', 'CLS value=' + e.value.toFixed(3));
          }
        });
      });
      layoutObs.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {}
  }

  setInterval(() => {
    try {
      const recent = dbg.logs.slice(-200);
      localStorage.setItem('dahab_debug_logs', JSON.stringify(recent));
    } catch (e) {}
  }, 10000);
}

export function getLogs() {
  try {
    const saved = localStorage.getItem('dahab_debug_logs');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return window.__DAHAB_DEBUG?.logs || [];
}

export function clearLogs() {
  if (window.__DAHAB_DEBUG) window.__DAHAB_DEBUG.logs = [];
  localStorage.removeItem('dahab_debug_logs');
}

export function disableDebug() {
  if (_memoryInterval) clearInterval(_memoryInterval);
  localStorage.removeItem(DEBUG_KEY);
  clearLogs();
  delete window.__DAHAB_DEBUG;
  window.onerror = null;
}
