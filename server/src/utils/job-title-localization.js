const JOB_TITLE_PAIRS = [
  ['Senior Full-stack Developer (React + Node.js)', 'Lap trinh vien toan trinh cao cap (React + Node.js)'],
  ['Senior Full-Stack Developer', 'Lap trinh vien toan trinh cao cap'],
  ['DevOps Engineer (AWS / Kubernetes)', 'Ky su DevOps (AWS / Kubernetes)'],
  ['DevOps Engineer', 'Ky su DevOps'],
  ['AI/ML Engineer', 'Ky su AI/ML'],
  ['AI Engineer (Machine Learning)', 'Ky su AI (hoc may)'],
  ['AI Research Engineer', 'Ky su nghien cuu AI'],
  ['Frontend Developer (Vue.js)', 'Lap trinh vien giao dien (Vue.js)'],
  ['Senior Frontend Developer', 'Lap trinh vien giao dien cao cap'],
  ['Senior Java Developer (Japan)', 'Lap trinh vien Java cao cap (Nhat Ban)'],
  ['Mobile Developer (React Native)', 'Lap trinh vien di dong (React Native)'],
  ['Python Developer (Data Pipeline)', 'Lap trinh vien Python (luong du lieu)'],
  ['Senior Backend Engineer', 'Ky su Backend cao cap'],
  ['Fullstack Engineer', 'Ky su phan mem toan trinh'],
  ['Fullstack Lead', 'Truong nhom phat trien toan trinh'],
  ['Performance Marketing Manager', 'Quan ly tiep thi hieu suat'],
  ['Content Marketing Specialist', 'Chuyen vien tiep thi noi dung'],
  ['Social Media Specialist', 'Chuyen vien truyen thong mang xa hoi'],
  ['Headhunting Consultant (IT)', 'Tu van vien san tim nhan su (CNTT)'],
  ['HRIS Implementation Specialist', 'Chuyen vien trien khai he thong nhan su (HRIS)'],
  ['Healthcare Software Engineer', 'Ky su phan mem y te'],
  ['Medical Data Analyst', 'Chuyen vien phan tich du lieu y te'],
  ['Instructional Designer', 'Chuyen vien thiet ke hoc lieu'],
  ['LMS Administrator', 'Quan tri vien he thong hoc tap (LMS)'],
  ['Warehouse Manager', 'Quan ly kho van'],
  ['Senior UI/UX Designer', 'Nha thiet ke UI/UX cao cap'],
  ['Product Designer', 'Nha thiet ke san pham'],
  ['Product Designer (AI)', 'Nha thiet ke san pham AI'],
  ['Senior Product Designer', 'Nha thiet ke san pham cao cap'],
  ['Product Designer - Senior Level', 'Nha thiet ke san pham cap cao'],
  ['Business Development Executive', 'Chuyen vien phat trien kinh doanh'],
  ['Business Analyst (ERP)', 'Chuyen vien phan tich nghiep vu (ERP)'],
  ['QA Automation Engineer', 'Ky su kiem thu tu dong'],
  ['Project Manager', 'Quan ly du an'],
  ['Software Engineer Intern (Java)', 'Thuc tap sinh lap trinh Java'],
  ['Marketing Intern', 'Thuc tap sinh tiep thi'],
  ['Freelance Content Writer (English)', 'Cong tac vien viet noi dung tieng Anh'],
];

const JOB_TITLE_ENGLISH_ALIASES = new Map([
  ['senior java developer (nhat ban)', 'Senior Java Developer (Japan)'],
  ['freelance content writer (tieng anh)', 'Freelance Content Writer (English)'],
]);

function normalizeJobTitle(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const JOB_TITLE_TRANSLATIONS = new Map(JOB_TITLE_PAIRS);
const CANONICAL_ENGLISH_TITLES = new Map(
  JOB_TITLE_PAIRS.map(([englishTitle]) => [normalizeJobTitle(englishTitle), englishTitle])
);
const VIETNAMESE_TO_ENGLISH = new Map(
  JOB_TITLE_PAIRS.map(([englishTitle, vietnameseTitle]) => [normalizeJobTitle(vietnameseTitle), englishTitle])
);

function localizeJobTitle(title) {
  if (typeof title !== 'string') {
    return title;
  }

  const trimmed = title.trim();
  if (!trimmed) {
    return title;
  }

  const normalized = normalizeJobTitle(trimmed);

  return (
    JOB_TITLE_ENGLISH_ALIASES.get(normalized) ||
    CANONICAL_ENGLISH_TITLES.get(normalized) ||
    VIETNAMESE_TO_ENGLISH.get(normalized) ||
    trimmed
  );
}

module.exports = {
  JOB_TITLE_TRANSLATIONS,
  localizeJobTitle,
  normalizeJobTitle,
};
