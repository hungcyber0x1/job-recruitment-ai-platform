import api from './api';

const buildFallbackDescription = (title, category) => ({
  success: true,
  data: `<h3>About the ${title} role</h3>
<p>We are looking for a strong ${title} to join the team and contribute to clear business outcomes.</p>
<h3>Main responsibilities</h3>
<ul>
  <li>Plan and execute work related to ${category || 'the assigned domain'}.</li>
  <li>Collaborate with cross-functional teams to deliver projects on time.</li>
  <li>Analyze results, report progress, and improve execution quality.</li>
</ul>`,
});

const aiService = {
  generateJobDescription: async (title, category) => {
    try {
      const response = await api.post('ai/generate-jd', { title, category });
      return response.data;
    } catch (error) {
      console.warn('AI JD generation failed, using fallback template.', error);
      return buildFallbackDescription(title, category);
    }
  },

  analyzeJobPost: (postData) => {
    const scores = [];
    let totalScore = 0;

    if ((postData.title || '').length < 10) {
      scores.push({
        label: 'Title',
        status: 'Too Short',
        done: false,
        tip: 'Use at least 10-50 characters.',
      });
    } else {
      scores.push({ label: 'Title', status: 'Optimal', done: true });
      totalScore += 30;
    }

    const descLength = (postData.description || '').replace(/<[^>]*>?/gm, '').length;
    if (descLength < 100) {
      scores.push({
        label: 'Description',
        status: 'Too Brief',
        done: false,
        tip: 'Add more concrete role details.',
      });
    } else {
      scores.push({ label: 'Description', status: 'Clear', done: true });
      totalScore += 40;
    }

    if (postData.salaryMin && postData.salaryMax) {
      scores.push({ label: 'Salary', status: 'Specific', done: true });
      totalScore += 30;
    } else {
      scores.push({
        label: 'Salary',
        status: 'Vague',
        done: false,
        tip: 'A clear salary range usually improves response rate.',
      });
    }

    return {
      scores,
      overallPercent: totalScore,
      rating: totalScore > 80 ? 'Premium' : totalScore > 50 ? 'Good' : 'Needs Improvement',
    };
  },
};

export default aiService;
