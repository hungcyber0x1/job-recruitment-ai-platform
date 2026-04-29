jest.mock('../../src/models/Candidate', () => ({
  findByUserId: jest.fn(),
  update: jest.fn(),
}));

jest.mock('../../src/models/User', () => ({
  update: jest.fn(),
}));

const CandidateRepository = require('../../src/models/Candidate');
const UserRepository = require('../../src/models/User');
const CandidateService = require('../../src/services/candidate');

describe('CandidateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps current job title aliases when returning a profile', async () => {
    CandidateRepository.findByUserId.mockResolvedValue({
      id: 7,
      current_job_title: 'Frontend Developer',
      phone: '',
      user_phone: '0900000000',
      location: '',
      user_address: 'Ho Chi Minh City',
    });

    const profile = await CandidateService.getProfile(42);

    expect(profile.title).toBe('Frontend Developer');
    expect(profile.phone).toBe('0900000000');
    expect(profile.location).toBe('Ho Chi Minh City');
  });

  it('updates both user and candidate records with aliased profile fields', async () => {
    CandidateRepository.findByUserId
      .mockResolvedValueOnce({ id: 9, user_id: 42 })
      .mockResolvedValueOnce({
        id: 9,
        user_id: 42,
        current_job_title: 'Product Designer',
        phone: '0988123123',
        location: 'Da Nang',
      });

    const profile = await CandidateService.updateProfile(42, {
      first_name: 'Lan',
      last_name: 'Nguyen',
      phone: '0988123123',
      location: 'Da Nang',
      title: 'Product Designer',
      bio: 'Design systems and UX.',
    });

    expect(UserRepository.update).toHaveBeenCalledWith(
      42,
      expect.objectContaining({
        first_name: 'Lan',
        last_name: 'Nguyen',
        phone: '0988123123',
        address: 'Da Nang',
      })
    );

    expect(CandidateRepository.update).toHaveBeenCalledWith(
      9,
      expect.objectContaining({
        current_job_title: 'Product Designer',
        phone: '0988123123',
        location: 'Da Nang',
        bio: 'Design systems and UX.',
      })
    );

    expect(profile.title).toBe('Product Designer');
    expect(profile.phone).toBe('0988123123');
    expect(profile.location).toBe('Da Nang');
  });
});
