-- OAuth: cho phép tài khoản không mật khẩu (đăng nhập Google / Facebook / GitHub)

ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

ALTER TABLE users
  ADD COLUMN oauth_provider VARCHAR(32) NULL COMMENT 'google, facebook, github' AFTER password,
  ADD COLUMN oauth_provider_id VARCHAR(255) NULL AFTER oauth_provider;

CREATE UNIQUE INDEX idx_users_oauth_provider ON users (oauth_provider, oauth_provider_id);
