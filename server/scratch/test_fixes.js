require('dotenv').config();
const JobRepository = require('../src/models/Job');
const { connectDB, closeDB } = require('../src/config/database.config');

async function testDuplicationFix() {
  try {
    console.log('--- Testing Job Duplication Fix ---');
    await connectDB();
    
    // Find a job to duplicate
    const { data: jobs } = await JobRepository.findWithDetails({ limit: 1 });
    if (!jobs || jobs.length === 0) {
      console.log('No jobs found to test duplication.');
      return;
    }
    
    const originalJobId = jobs[0].id;
    console.log(`Duplicating job ID: ${originalJobId}`);
    
    const newJobId = await JobRepository.duplicate(originalJobId);
    console.log(`Duplicate created with ID: ${newJobId}`);
    
    if (typeof newJobId === 'number') {
      console.log('SUCCESS: Duplication call returned a valid ID.');
    } else {
      console.log('FAILURE: Duplication call returned invalid result type:', typeof newJobId);
    }
    
    // Check if skills were copied
    const [skills] = await JobRepository.pool.query('SELECT * FROM job_skills WHERE job_id = ?', [newJobId]);
    console.log(`Copied skills count: ${skills.length}`);
    
  } catch (err) {
    console.error('Test Duplication Failed:', err);
  } finally {
    await closeDB();
  }
}

testDuplicationFix();
