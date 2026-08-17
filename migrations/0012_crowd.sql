alter table fighters add column if not exists store text not null default '';
alter table fighters add column if not exists walkout text not null default '';

create table if not exists picks (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  fighter_id text not null references fighters(id) on delete cascade,
  week_number integer not null,
  matchup_id text not null,
  pick_id text not null,
  unique (fighter_id, matchup_id)
);

create index if not exists picks_week_idx on picks (circuit_id, week_number);

create table if not exists promos (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  week_number integer not null,
  from_id text not null references fighters(id) on delete cascade,
  to_id text not null references fighters(id) on delete cascade,
  line_id text not null,
  unique (from_id, week_number)
);
