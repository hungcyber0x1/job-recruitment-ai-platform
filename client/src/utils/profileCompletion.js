export const PROFILE_COMPLETION_SECTIONS = [
  { key: 'basic_info', label: 'Thông tin cơ bản' },
  { key: 'resume', label: 'Upload CV' },
  { key: 'experience', label: 'Kinh nghiệm làm việc' },
  { key: 'education', label: 'Học vấn' },
  { key: 'skills', label: 'Kỹ năng chuyên môn' },
  { key: 'preferences', label: 'Công việc mong muốn' },
];

const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const hasArray = (value) => Array.isArray(value) && value.length > 0;

export const calculateProfileCompletion = (profile = {}, user = {}) => {
  const skillsValue = profile.skills;
  const parsedSkills = Array.isArray(skillsValue)
    ? skillsValue
    : hasText(skillsValue)
      ? skillsValue
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const checks = {
    basic_info: Boolean(
      hasText(user.first_name || profile.first_name) &&
      hasText(user.last_name || profile.last_name) &&
      hasText(user.email || profile.email) &&
      (hasText(profile.bio) || hasText(profile.phone) || hasText(profile.address))
    ),
    resume: hasText(profile.resume_url),
    experience:
      hasArray(profile.experiences) ||
      hasText(profile.experience) ||
      hasText(profile.experience_level),
    education: hasArray(profile.education) || hasText(profile.education),
    skills: parsedSkills.length > 0,
    preferences: Boolean(
      hasText(profile.desired_role) ||
      hasText(profile.expected_salary) ||
      hasText(profile.preferences) ||
      hasText(profile.location)
    ),
  };

  const completed = PROFILE_COMPLETION_SECTIONS.filter((section) => checks[section.key]).length;
  const completion = Math.round((completed / PROFILE_COMPLETION_SECTIONS.length) * 100);
  const missingItems = PROFILE_COMPLETION_SECTIONS.filter((section) => !checks[section.key]).map(
    (section) => section.key
  );

  return {
    completion,
    missingItems,
    checks,
  };
};
