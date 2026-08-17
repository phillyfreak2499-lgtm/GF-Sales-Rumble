create table if not exists floor_catalog (
  id text primary key,
  circuit_id text not null references circuits(id) on delete cascade,
  title text not null,
  blurb text not null default '',
  stars integer not null default 1,
  pack text not null default 'ops',
  live boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists floor_catalog_circuit_idx on floor_catalog (circuit_id);
