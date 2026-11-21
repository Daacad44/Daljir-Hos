-- Optional demo data
insert into public.departments (name, description, location) values
  ('General Medicine', 'Outpatient general consultations', 'Block A'),
  ('Pediatrics', 'Child health', 'Block B'),
  ('Maternity', 'Antenatal and delivery care', 'Block C'),
  ('Laboratory', 'Diagnostics and tests', 'Ground floor')
on conflict (name) do nothing;
