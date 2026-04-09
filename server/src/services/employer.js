const EmployerRepository = require('../repositories/employer');
const UserRepository = require('../repositories/user');
const AppError = require('../utils/errorHandler');

class EmployerService {
  async getProfile(userId) {
    const employer = await EmployerRepository.findByUserId(userId);
    if (!employer) {
      throw new AppError('Employer profile not found', 404);
    }
    return employer;
  }

  async updateProfile(userId, data) {
    const employer = await EmployerRepository.findByUserId(userId);
    if (!employer) {
      throw new AppError('Employer profile not found', 404);
    }

    const { first_name, last_name, email, ...employerData } = data;

    // Update user info if provided
    if (first_name || last_name || email) {
      await UserRepository.update(userId, { first_name, last_name, email });
    }

    // Update employer info
    if (Object.keys(employerData).length > 0) {
      await EmployerRepository.update(employer.id, employerData);
      const logo = employerData.company_logo;
      if (typeof logo === 'string' && logo.trim() !== '') {
        await UserRepository.update(userId, { avatar_url: logo.trim() });
      }
    }

    return await this.getProfile(userId);
  }
}

module.exports = new EmployerService();
