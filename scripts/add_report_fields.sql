alter table audit_checklists 
add column if not exists summary text,
add column if not exists risks text,
add column if not exists recommendations text,
add column if not exists auditorName text;
