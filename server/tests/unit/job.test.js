/**
 * JobService gọi DB + AIService trực tiếp (monolith). Unit test chỉ kiểm tra surface API.
 */
describe('JobService', () => {
  test('exports singleton with expected methods', () => {
    const JobService = require('../../src/services/job');
    expect(JobService).toBeDefined();
    expect(typeof JobService.getAllJobs).toBe('function');
    expect(typeof JobService.getJobById).toBe('function');
    expect(typeof JobService.getJobsByEmployer).toBe('function');
    expect(typeof JobService.createJob).toBe('function');
    expect(typeof JobService.updateJob).toBe('function');
    expect(typeof JobService.deleteJob).toBe('function');
  });
});
