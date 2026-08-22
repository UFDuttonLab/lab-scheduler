-- Test fixtures. Distinct from the real section-6 seed.
INSERT INTO public.profiles (id,email,full_name,active) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001','mentora@ufl.edu','Mentor A',true),
 ('bbbbbbbb-0000-0000-0000-000000000002','mentorb@ufl.edu','Mentor B',true),
 ('cccccccc-0000-0000-0000-000000000003','pi@ufl.edu','The PI',true),
 ('dddddddd-0000-0000-0000-000000000004','ug@ufl.edu','An Undergrad',true),
 ('eeeeeeee-0000-0000-0000-000000000005','gone@ufl.edu','Deactivated Mentor',false);
INSERT INTO public.user_roles (user_id,role) VALUES
 ('aaaaaaaa-0000-0000-0000-000000000001','grad_student'),
 ('bbbbbbbb-0000-0000-0000-000000000002','grad_student'),
 ('cccccccc-0000-0000-0000-000000000003','pi'),
 ('dddddddd-0000-0000-0000-000000000004','undergrad_student'),
 ('eeeeeeee-0000-0000-0000-000000000005','grad_student');

INSERT INTO public.recruiting_cycles (cycle,label,opens_at,closes_at,active,pi_contact_email) VALUES
 ('fall-2026','Fall 2026', now()-interval '2 days', now()+interval '20 days', true, 'duttonc@ufl.edu'),
 ('spring-2026','Spring 2026', now()-interval '300 days', now()-interval '200 days', false, 'duttonc@ufl.edu');

INSERT INTO public.recruiting_projects (id,name,blurb) VALUES
 ('11111111-2222-3333-4444-555555555555','Proj A','A blurb about project A that is long enough.'),
 ('11111111-2222-3333-4444-555555555556','Proj B','A blurb about project B that is long enough.');

INSERT INTO public.recruiting_positions (id,project_id,mentor_id,title,description,tasks,requirements,hours_per_week,outcome,cycle,status) VALUES
 ('aaaa1111-0000-0000-0000-00000000000a','11111111-2222-3333-4444-555555555555','aaaaaaaa-0000-0000-0000-000000000001','A open role','Description for A that is over twenty chars.',ARRAY['t1','t2','t3'],ARRAY['r1'],8,'A good outcome here.','fall-2026','open'),
 ('bbbb1111-0000-0000-0000-00000000000b','11111111-2222-3333-4444-555555555556','bbbbbbbb-0000-0000-0000-000000000002','B open role','Description for B that is over twenty chars.',ARRAY['t1','t2','t3'],ARRAY['r1'],8,'A good outcome here.','fall-2026','open'),
 ('aaaa2222-0000-0000-0000-00000000000c','11111111-2222-3333-4444-555555555555','aaaaaaaa-0000-0000-0000-000000000001','A draft role','Description for A draft over twenty chars.',ARRAY['t1','t2','t3'],ARRAY['r1'],8,'A good outcome here.','fall-2026','draft');

-- Two applications with FIXED ids: one ranking ONLY mentor B's position, one ranking B
-- first and A second. Inserted directly rather than through the RPC so that a probe can
-- name the id mentor A must not be able to reach - selecting it through RLS returns no
-- rows, which makes a hostile INSERT ... SELECT succeed by inserting nothing and look
-- like a pass.
INSERT INTO public.recruiting_applications
 (id,cycle,full_name,email,year,major,expected_graduation,coursework,r_experience,hours_available,
  longest_block_hours,availability,semesters_available,credit_type,animal_samples_ok,field_local_ok,
  field_intl_interest,has_transportation,statement,policy_check_score)
VALUES
 ('99999999-0000-0000-0000-0000000000b1','fall-2026','Only B Applicant','onlyb@ufl.edu','junior','Microbiology','Spring 2028',
  ARRAY['bsc2010'],'none',10,4,jsonb_build_object('mon',jsonb_build_array(jsonb_build_array(9,12))),2,'any',true,true,false,true,'I want to work here.',4),
 ('99999999-0000-0000-0000-0000000000ab','fall-2026','Both Applicant','both@ufl.edu','senior','Biology','Fall 2027',
  ARRAY['bsc2010','genetics'],'coursework',12,4,jsonb_build_object('tue',jsonb_build_array(jsonb_build_array(13,17))),3,'course_credit',true,false,true,false,'Both please.',3);

INSERT INTO public.recruiting_application_positions (application_id,position_id,rank) VALUES
 ('99999999-0000-0000-0000-0000000000b1','bbbb1111-0000-0000-0000-00000000000b',1),
 ('99999999-0000-0000-0000-0000000000ab','bbbb1111-0000-0000-0000-00000000000b',1),
 ('99999999-0000-0000-0000-0000000000ab','aaaa1111-0000-0000-0000-00000000000a',2);

-- An old application in the closed cycle, inserted directly (the RPC only files into the
-- open cycle, which is exactly the behaviour being relied on elsewhere).
INSERT INTO public.recruiting_applications
 (cycle,full_name,email,year,major,expected_graduation,coursework,r_experience,hours_available,
  longest_block_hours,availability,semesters_available,credit_type,animal_samples_ok,field_local_ok,
  field_intl_interest,has_transportation,statement,policy_check_score)
VALUES ('spring-2026','Old Applicant','old@ufl.edu','sophomore','Chemistry','Spring 2027',
  ARRAY['bsc2010'],'none',8,3,'{}'::jsonb,2,'volunteer',true,true,false,true,'Old statement.',2);
