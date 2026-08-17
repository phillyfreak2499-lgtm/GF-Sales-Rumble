create table if not exists store_rooms (
  circuit_id text not null references circuits(id) on delete cascade,
  store_slug text not null,
  paint text not null default 'house',
  accent text not null default 'amber',
  motto text not null default '',
  mark text not null default '',
  primary key (circuit_id, store_slug)
);
