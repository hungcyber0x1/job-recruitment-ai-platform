class UserDTO {
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.role = user.role;
    this.firstName = user.first_name;
    this.lastName = user.last_name;
    this.fullName = `${user.first_name} ${user.last_name}`;
    this.avatarUrl = user.avatar_url;
    this.createdAt = user.created_at;
  }

  static fromUser(user) {
    if (!user) return null;
    return new UserDTO(user);
  }

  static fromUsers(users) {
    return users.map((user) => new UserDTO(user));
  }
}

module.exports = UserDTO;
