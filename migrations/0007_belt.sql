alter table fighters add column if not exists plate_border text not null default 'bone';
alter table fighters add column if not exists plate_bg text not null default 'surface';
alter table fighters add column if not exists plate_mark text not null default '';

create table if not exists floor_work (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  fighter_id text not null references fighters(id) on delete cascade,
  week_number integer not null,
  task_id text not null,
  stars integer not null default 1,
  done boolean not null default false,
  completed_at timestamptz,
  unique (fighter_id, week_number, task_id)
);

create index if not exists floor_work_week_idx on floor_work (circuit_id, week_number);

create table if not exists belt_items (
  fighter_id text not null references fighters(id) on delete cascade,
  item_id text not null,
  spent integer not null default 0,
  unlocked_at timestamptz not null default now(),
  primary key (fighter_id, item_id)
);
