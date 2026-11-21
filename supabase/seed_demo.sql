-- Demo data for Daljir Hospital (fictional names and numbers).
-- Safe to run once on an empty database; it adds, never deletes.
select setseed(0.42);

insert into public.departments (name, description, location) values
  ('General Medicine', 'Outpatient general consultations', 'Block A'),
  ('Pediatrics', 'Child health and vaccinations', 'Block B'),
  ('Maternity', 'Antenatal care and delivery', 'Block C'),
  ('Laboratory', 'Diagnostics and tests', 'Ground floor'),
  ('Surgery', 'General and minor surgery', 'Block D'),
  ('Dental', 'Dental care', 'Block A, room 12'),
  ('Cardiology', 'Heart and blood pressure clinic', 'Block D, 1st floor'),
  ('Emergency', '24-hour emergency care', 'Main entrance')
on conflict (name) do nothing;

insert into public.doctors (full_name, specialization, department_id, phone, email, consultation_fee, years_experience, working_days, working_hours, bio)
select d.full_name, d.spec, (select id from public.departments where name = d.dept), d.phone, d.email, d.fee, d.yrs, d.days, d.hours, d.bio
from (values
  ('Axmed Cabdi Nuur', 'General Practitioner', 'General Medicine', '615 201 101', 'axmed.nuur@daljir.so', 10, 12, 'Sat – Thu', '8:00 AM – 2:00 PM', 'Family medicine doctor with 12 years of outpatient experience.'),
  ('Faadumo Xasan Cali', 'Pediatrician', 'Pediatrics', '615 201 102', 'faadumo.cali@daljir.so', 15, 9, 'Sat – Wed', '9:00 AM – 3:00 PM', 'Child health specialist, vaccinations and nutrition.'),
  ('Hodan Maxamed Yuusuf', 'Gynecologist / Obstetrician', 'Maternity', '615 201 103', 'hodan.yuusuf@daljir.so', 20, 14, 'Sat – Thu', '8:00 AM – 4:00 PM', 'Antenatal care, safe delivery and women''s health.'),
  ('Cabdiraxmaan Ciise Faarax', 'General Surgeon', 'Surgery', '615 201 104', 'cabdiraxmaan.faarax@daljir.so', 25, 16, 'Sun – Thu', '10:00 AM – 4:00 PM', 'General and laparoscopic surgery.'),
  ('Sahra Cumar Jaamac', 'Dentist', 'Dental', '615 201 105', 'sahra.jaamac@daljir.so', 12, 7, 'Sat – Thu', '9:00 AM – 5:00 PM', 'Fillings, extractions and dental hygiene.'),
  ('Maxamuud Aadan Warsame', 'Cardiologist', 'Cardiology', '615 201 106', 'maxamuud.warsame@daljir.so', 30, 18, 'Mon, Wed, Sat', '9:00 AM – 1:00 PM', 'Hypertension, heart failure and ECG reading.'),
  ('Ifrax Saciid Muuse', 'Emergency Physician', 'Emergency', '615 201 107', 'ifrax.muuse@daljir.so', 15, 8, 'Rotating shifts', '24 hours', 'Emergency and trauma care.'),
  ('Yaasiin Cali Xirsi', 'Laboratory Physician', 'Laboratory', '615 201 108', 'yaasiin.xirsi@daljir.so', 8, 10, 'Sat – Thu', '7:30 AM – 3:30 PM', 'Clinical laboratory and diagnostics.')
) as d(full_name, spec, dept, phone, email, fee, yrs, days, hours, bio)
where not exists (select 1 from public.doctors x where x.full_name = d.full_name);

insert into public.patients (full_name, gender, date_of_birth, phone, address, blood_group, emergency_contact, medical_notes)
select p.full_name, p.gender::public.gender, p.dob::date, p.phone, p.address,
  (array['A+','A-','B+','B-','AB+','O+','O+','O-'])[1 + floor(random() * 8)::int],
  p.emergency, p.notes
from (values
  ('Cali Maxamed Xuseen', 'male', '1985-03-12', '615 330 001', 'Hodan, Muqdisho', 'Xaawo (xaas) 615 330 101', 'Hypertension, on amlodipine'),
  ('Aamina Cabdullaahi Faarax', 'female', '1992-07-25', '615 330 002', 'Wadajir, Muqdisho', 'Cabdi (walaal) 615 330 102', 'Pregnant, 28 weeks'),
  ('Maxamed Cismaan Diiriye', 'male', '1978-11-02', '615 330 003', 'Hawlwadaag, Muqdisho', null, 'Type 2 diabetes'),
  ('Ladan Axmed Shire', 'female', '2018-05-14', '615 330 004', 'Dharkenley, Muqdisho', 'Axmed (aabe) 615 330 104', 'Asthma, uses inhaler'),
  ('Cabdiqaadir Yuusuf Muxumed', 'male', '1965-01-30', '615 330 005', 'Waaberi, Muqdisho', 'Faadumo (xaas) 615 330 105', 'Heart failure follow-up'),
  ('Nimco Xasan Guuleed', 'female', '1999-09-09', '615 330 006', 'Yaaqshiid, Muqdisho', null, null),
  ('Bashiir Cali Warsame', 'male', '2015-12-20', '615 330 007', 'Kaaraan, Muqdisho', 'Cali (aabe) 615 330 107', 'Vaccination schedule'),
  ('Hibo Maxamuud Cilmi', 'female', '1988-04-18', '615 330 008', 'Shibis, Muqdisho', null, 'Penicillin allergy'),
  ('Saciid Cumar Faarax', 'male', '1972-08-08', '615 330 009', 'Boondheere, Muqdisho', 'Cumar (wiil) 615 330 109', null),
  ('Ubax Cabdiraxmaan Nuur', 'female', '2001-02-27', '615 330 010', 'Hodan, Muqdisho', null, 'Anaemia'),
  ('Xasan Aadan Cali', 'male', '1995-06-16', '615 330 011', 'Wadajir, Muqdisho', null, null),
  ('Sucaad Ismaaciil Jaamac', 'female', '1983-10-05', '615 330 012', 'Hawlwadaag, Muqdisho', 'Ismaaciil (aabe) 615 330 112', 'Thyroid'),
  ('Mustafe Xuseen Ciise', 'male', '2010-03-03', '615 330 013', 'Dayniile, Muqdisho', 'Xuseen (aabe) 615 330 113', null),
  ('Deeqa Axmed Maxamed', 'female', '1990-12-12', '615 330 014', 'Howlwadaag, Muqdisho', null, 'Postnatal check'),
  ('Abuukar Cabdi Shuuriye', 'male', '1958-07-19', '615 330 015', 'Hamar Weyne, Muqdisho', 'Cabdi (wiil) 615 330 115', 'Chronic kidney disease'),
  ('Nasra Yuusuf Cali', 'female', '2020-01-08', '615 330 016', 'Kaaraan, Muqdisho', 'Yuusuf (aabe) 615 330 116', null),
  ('Cabdiwali Maxamed Xirsi', 'male', '1980-05-22', '615 330 017', 'Hodan, Muqdisho', null, 'Back pain'),
  ('Fartuun Cali Cumar', 'female', '1975-09-30', '615 330 018', 'Wardhiigley, Muqdisho', null, 'Hypertension'),
  ('Khadar Saciid Nuur', 'male', '2003-11-11', '615 330 019', 'Yaaqshiid, Muqdisho', null, null),
  ('Ayaan Xasan Maxamuud', 'female', '1997-02-02', '615 330 020', 'Shingaani, Muqdisho', null, 'Dental pain')
) as p(full_name, gender, dob, phone, address, emergency, notes)
where not exists (select 1 from public.patients x where x.full_name = p.full_name);

insert into public.medicines (name, category, unit, unit_price, stock_quantity, reorder_level, expiry_date) select * from (values
  ('Paracetamol 500mg', 'Painkiller', 'tablet', 0.05, 2400, 300, date '2028-06-30'),
  ('Ibuprofen 400mg', 'Painkiller', 'tablet', 0.08, 900, 200, date '2028-01-31'),
  ('Amoxicillin 500mg', 'Antibiotic', 'capsule', 0.15, 650, 200, date '2027-09-30'),
  ('Azithromycin 250mg', 'Antibiotic', 'tablet', 0.60, 120, 100, date '2027-12-31'),
  ('Ciprofloxacin 500mg', 'Antibiotic', 'tablet', 0.25, 40, 100, date '2027-05-31'),
  ('Metronidazole 400mg', 'Antibiotic', 'tablet', 0.10, 500, 150, date '2028-03-31'),
  ('ORS sachet', 'Rehydration', 'sachet', 0.20, 800, 200, date '2028-10-31'),
  ('Metformin 500mg', 'Diabetes', 'tablet', 0.07, 1500, 300, date '2028-02-28'),
  ('Insulin (Mixtard) 10ml', 'Diabetes', 'injection', 9.50, 18, 20, date '2027-04-30'),
  ('Amlodipine 5mg', 'Blood pressure', 'tablet', 0.06, 1100, 250, date '2028-08-31'),
  ('Losartan 50mg', 'Blood pressure', 'tablet', 0.12, 0, 150, date '2027-11-30'),
  ('Salbutamol inhaler', 'Respiratory', 'bottle', 3.50, 35, 20, date '2027-07-31'),
  ('Ferrous sulfate + folic acid', 'Supplement', 'tablet', 0.03, 2000, 400, date '2028-12-31'),
  ('Artemether/Lumefantrine', 'Antimalarial', 'tablet', 0.45, 260, 100, date '2027-10-31'),
  ('Omeprazole 20mg', 'Gastro', 'capsule', 0.09, 700, 150, date '2028-04-30'),
  ('Ceftriaxone 1g', 'Antibiotic', 'injection', 1.80, 75, 50, date '2027-08-31'),
  ('Normal saline 500ml', 'IV fluids', 'bottle', 1.20, 140, 60, date '2028-05-31'),
  ('Hydrocortisone cream 1%', 'Dermatology', 'tube', 1.50, 9, 15, date '2027-03-31'),
  ('Vitamin C 500mg', 'Supplement', 'tablet', 0.02, 1800, 300, date '2028-09-30'),
  ('Lidocaine 2% 20ml', 'Anaesthetic', 'injection', 2.20, 30, 20, date '2027-06-30')
) as m(name, category, unit, unit_price, stock_quantity, reorder_level, expiry_date)
where not exists (select 1 from public.medicines x where x.name = m.name);

-- Appointments: past 10 days and next 10 days, 8 AM – 3 PM East Africa Time
insert into public.appointments (patient_id, doctor_id, scheduled_at, reason, status, notes)
select
  p.id,
  d.id,
  (date_trunc('day', now() at time zone 'Africa/Mogadishu')
     + make_interval(days => g.day_offset, hours => 8 + floor(random() * 7)::int, mins => (floor(random() * 4) * 15)::int))
     at time zone 'Africa/Mogadishu',
  (array['Check-up','Follow-up visit','Fever and headache','Blood pressure review','Antenatal visit','Tooth pain','Lab results review','Vaccination','Cough and cold','Diabetes review'])[1 + floor(random() * 10)::int],
  case
    when g.day_offset < 0 then (array['completed','completed','completed','completed','no_show','cancelled'])[1 + floor(random() * 6)::int]::public.appointment_status
    else 'scheduled'::public.appointment_status
  end,
  case when g.day_offset < 0 then 'Patient seen, advised and given prescription.' end
from (select generate_series(1, 45) as n, (floor(random() * 21) - 10)::int as day_offset) g
cross join lateral (select id from public.patients order by random() + g.n * 0 limit 1) p
cross join lateral (select id from public.doctors order by random() + g.n * 0 limit 1) d
where (select count(*) from public.appointments) < 10;

-- A few appointments today so the dashboard is lively
insert into public.appointments (patient_id, doctor_id, scheduled_at, reason, status)
select p.id, d.id,
  (date_trunc('day', now() at time zone 'Africa/Mogadishu') + make_interval(hours => 9 + g.n)) at time zone 'Africa/Mogadishu',
  'Same-day consultation', 'scheduled'
from generate_series(1, 5) g(n)
cross join lateral (select id from public.patients order by random() + g.n * 0 limit 1) p
cross join lateral (select id from public.doctors order by random() + g.n * 0 limit 1) d
where (select count(*) from public.appointments where reason = 'Same-day consultation') = 0;

-- Invoices for completed appointments
insert into public.invoices (patient_id, appointment_id, description, amount, amount_paid, status, payment_method, issued_on)
select a.patient_id, a.id,
  'Consultation – Dr. ' || d.full_name || case when random() < 0.4 then ', lab tests' else '' end,
  t.total,
  case s.st when 'paid' then t.total when 'partial' then round(t.total / 2, 2) else 0 end,
  s.st::public.invoice_status,
  case when s.st <> 'unpaid' then (array['evc_plus','evc_plus','zaad','sahal','edahab','cash'])[1 + floor(random() * 6)::int] end,
  (a.scheduled_at at time zone 'Africa/Mogadishu')::date
from public.appointments a
join public.doctors d on d.id = a.doctor_id
cross join lateral (select d.consultation_fee + (floor(random() * 4) * 5)::numeric as total) t
cross join lateral (select (array['paid','paid','paid','partial','unpaid'])[1 + floor(random() * 5)::int] as st) s
where a.status = 'completed'
  and not exists (select 1 from public.invoices i where i.appointment_id = a.id);
