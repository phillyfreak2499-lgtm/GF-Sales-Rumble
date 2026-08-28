-- Commissioner-set video link per bout. Empty string means no video.
alter table matchups add column if not exists video_url text not null default '';
