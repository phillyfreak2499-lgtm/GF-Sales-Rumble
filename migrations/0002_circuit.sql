create table if not exists circuits (
  id text primary key,
  slug text not null unique,
  name text not null,
  period_label text not null,
  weeks integer not null check (weeks between 4 and 5),
  current_week integer not null default 1,
  status text not null default 'setup',
  join_code text not null,
  owner_user_id text,
  is_demo boolean not null default false,
  prize_main text not null default '$150',
  prize_redemption text not null default '$50',
  prize_rumble text not null default 'Lunch',
  week1_byes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists metrics (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  key text not null,
  label text not null,
  sort_order integer not null
);

create table if not exists fighters (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  user_id text,
  first_name text not null,
  last_name text not null,
  nickname text not null,
  hype_line text not null default '',
  backstory text not null default '',
  seed integer,
  prior_points integer not null default 0,
  prior_blues integer not null default 0,
  prior_reviews integer not null default 0,
  claim_code text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index if not exists fighters_claim_code_idx on fighters (claim_code);
create index if not exists fighters_circuit_idx on fighters (circuit_id);

create table if not exists weeks (
  circuit_id text not null references circuits(id) on delete cascade,
  week_number integer not null,
  status text not null default 'upcoming',
  primary key (circuit_id, week_number)
);

create table if not exists scores (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  fighter_id text not null references fighters(id) on delete cascade,
  week_number integer not null,
  statuses_json text not null,
  reviews integer not null default 0,
  notes text not null default '',
  submitted_at timestamptz not null default now(),
  unique (fighter_id, week_number)
);

create table if not exists matchups (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  week_number integer not null,
  bracket text not null,
  kind text not null,
  fighter_ids_json text not null,
  winner_id text,
  status text not null default 'scheduled'
);

create index if not exists matchups_week_idx on matchups (circuit_id, week_number);

create table if not exists placements (
  circuit_id text not null,
  fighter_id text not null,
  week_number integer not null,
  bracket text not null,
  result text not null,
  rank_in_bracket integer,
  primary key (circuit_id, fighter_id, week_number)
);

create table if not exists gazette (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  week_number integer not null,
  kind text not null,
  headline text not null,
  body text not null,
  published_at timestamptz not null default now(),
  unique (circuit_id, week_number, kind)
);
