alter table training_attempts
  add column if not exists awarded boolean not null default false;
