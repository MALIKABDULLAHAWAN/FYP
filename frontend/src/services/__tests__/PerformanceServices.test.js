import AggressiveCacheManager from '../AggressiveCacheManager';
import PerformanceMonitor from '../PerformanceMonitor';
import ResourcePreloader from '../ResourcePreloader';
import PerformanceOptimizer from '../PerformanceOptimizer';

if (!global.fetch || typeof global.fetch.mockResolvedValue !== 'function') {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({})
  });
}

describe('Performance Services (smoke)', () => {
  test('singletons are available', () => {
    expect(AggressiveCacheManager).toBeDefined();
    expect(PerformanceMonitor).toBeDefined();
    expect(ResourcePreloader).toBeDefined();
    expect(PerformanceOptimizer).toBeDefined();
  });

  test('cache manager basic set/get works', async () => {
    await AggressiveCacheManager.set('smoke-key', { ok: true });
    const value = await AggressiveCacheManager.get('smoke-key');
    expect(value).toEqual({ ok: true });
  });

  test('performance monitor records metric', () => {
    PerformanceMonitor.recordMetric('smoke_metric', 1);
    const summary = PerformanceMonitor.getPerformanceSummary();
    expect(summary).toBeDefined();
    expect(summary.coreWebVitals).toBeDefined();
  });

  test('resource preloader exposes stats interface', () => {
    const stats = ResourcePreloader.getStats();
    expect(stats).toBeDefined();
    expect(stats.preloadedResources).toBeDefined();
  });

  test('performance optimizer report shape is valid', () => {
    const report = PerformanceOptimizer.getPerformanceReport();
    expect(report).toBeDefined();
    expect(report.performanceMetrics).toBeDefined();
    expect(report.cacheStats).toBeDefined();
    expect(report.preloaderStats).toBeDefined();
  });
});