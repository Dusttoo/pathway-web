-- Make discord_username nullable so the bot can create users rows for
-- Discord-only users (who haven't logged into the web app yet) without
-- needing a username. The web app updates the username on OAuth login;
-- the bot uses 'Discord User' as a placeholder when the username is unknown.

ALTER TABLE users
  ALTER COLUMN discord_username DROP NOT NULL,
  ALTER COLUMN discord_username SET DEFAULT 'Discord User';
