create table if not exists challenges (
  circuit_id text not null references circuits(id) on delete cascade,
  week_number integer not null,
  title text not null,
  blurb text not null default '',
  primary key (circuit_id, week_number)
);

create table if not exists challenge_claims (
  circuit_id text not null,
  week_number integer not null,
  fighter_id text not null,
  claimed_at text not null default '',
  primary key (circuit_id, week_number, fighter_id)
);

create table if not exists house_calls (
  circuit_id text not null references circuits(id) on delete cascade,
  week_number integer not null,
  face_id text,
  heel_id text,
  primary key (circuit_id, week_number)
);
