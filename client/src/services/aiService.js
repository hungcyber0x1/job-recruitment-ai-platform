import api from './api';

const buildFallbackDescription = (title, category) => ({
  success: true,
  data: `<h3>About the ${title} role</h3>
<p>We are looking for a strong ${title} to join the team and contribute to clear business outcomes.</p>
<h3>Main responsibilities</h3>
<ul>
  <li>Plan and execute work related to ${category || 'the assigned domain'}.</li>
  <li>Collaborate with cross-functional teams to deliver projects on time.</li>
  <li>Analyze results, report outcomes, and improve execution quality.</li>
</ul>`,
});

const aiService = {
  generateJobDescription: async (title, category) => {
    try {
      const response = await api.post('ai/generate-jd', { title, category });
      return response.data;
    } catch (error) {
      console.warn('JD generation failed, using fallback template.', error);
      return buildFallbackDescription(title, category);
    }
  },
};

export default aiService;
