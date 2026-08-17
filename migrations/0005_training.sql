create table if not exists training_attempts (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  fighter_id text not null references fighters(id) on delete cascade,
  week_number integer not null,
  module_id text not null,
  passed boolean not null default false,
  correct integer not null default 0,
  total integer not null default 0,
  answers_json text not null default '[]',
  attempted_at timestamptz not null default now(),
  unique (fighter_id, week_number, module_id)
);

create index if not exists training_attempts_circuit_idx on training_attempts (circuit_id);
create index if not exists training_attempts_fighter_idx on training_attempts (fighter_id);
