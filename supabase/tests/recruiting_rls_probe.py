import subprocess, sys, textwrap

PSQL = ["/usr/lib/postgresql/16/bin/psql","-h","/tmp/pgrun","-p","5433","-U","postgres","-d","scratch","-X","-q","-A","-t","-v","ON_ERROR_STOP=1"]

A  = 'aaaaaaaa-0000-0000-0000-000000000001'  # Mentor A, grad_student
B  = 'bbbbbbbb-0000-0000-0000-000000000002'  # Mentor B, grad_student
PI = 'cccccccc-0000-0000-0000-000000000003'
UG = 'dddddddd-0000-0000-0000-000000000004'  # undergrad_student
DEAD='eeeeeeee-0000-0000-0000-000000000005'  # deactivated grad_student

def run(sql, role=None, uid=None):
    pre = ""
    if uid is not None:
        pre += f"SET LOCAL request.jwt.claim.sub = '{uid}';\n"
    if role:
        pre += f"SET ROLE {role};\n"
    full = "BEGIN;\n" + pre + sql + "\nROLLBACK;\n"
    p = subprocess.run(PSQL + ["-c", full], capture_output=True, text=True)
    return p.returncode, (p.stdout or "").strip(), (p.stderr or "").strip()

results = []
def check(name, sql, role, uid, expect, want=None):
    """expect: 'deny' (must error), 'allow' (must not error), 'rows' (compare stdout to want)"""
    rc, out, err = run(sql, role, uid)
    if expect == 'deny':
        ok = rc != 0
        detail = (err.splitlines()[0] if err else "no error raised")
    elif expect == 'allow':
        ok = rc == 0
        detail = "ok" if ok else (err.splitlines()[0] if err else "?")
    else:
        lines = [l for l in out.splitlines() if l.strip()]
        got = "|".join(lines)
        ok = rc == 0 and got == want
        detail = f"got {got!r}" + ("" if ok else f", want {want!r}")
        if rc != 0: detail = err.splitlines()[0] if err else "?"
    results.append((ok, name, detail))

# ---- anon: reads -------------------------------------------------------------------
check("anon SELECT applications is denied",
      "SELECT count(*) FROM public.recruiting_applications;", "anon", None, 'deny')
check("anon SELECT application_positions is denied",
      "SELECT count(*) FROM public.recruiting_application_positions;", "anon", None, 'deny')
check("anon SELECT reviews is denied",
      "SELECT count(*) FROM public.recruiting_reviews;", "anon", None, 'deny')
check("anon sees exactly the 2 open positions in the open cycle",
      "SELECT count(*) FROM public.recruiting_positions;", "anon", None, 'rows', "2")
check("anon cannot see the draft position",
      "SELECT count(*) FROM public.recruiting_positions WHERE status='draft';", "anon", None, 'rows', "0")
check("anon sees only the active cycle",
      "SELECT string_agg(cycle,',') FROM public.recruiting_cycles;", "anon", None, 'rows', "fall-2026")

# ---- anon: writes ------------------------------------------------------------------
check("anon INSERT application is denied",
      """INSERT INTO public.recruiting_applications
         (cycle,full_name,email,year,major,expected_graduation,coursework,r_experience,hours_available,
          longest_block_hours,availability,semesters_available,credit_type,animal_samples_ok,field_local_ok,
          field_intl_interest,has_transportation,statement,policy_check_score)
         VALUES ('fall-2026','Hacker','h@ufl.edu','junior','X','Fall 2027',ARRAY['bsc2010'],'none',8,3,
                 '{}'::jsonb,2,'any',true,true,false,true,'hi',0);""", "anon", None, 'deny')
check("anon INSERT position is denied",
      """INSERT INTO public.recruiting_positions (project_id,mentor_id,title,description,tasks,requirements,hours_per_week,outcome,cycle)
         SELECT id,'aaaaaaaa-0000-0000-0000-000000000001','Fake role','Description over twenty characters ok.',
                ARRAY['a','b','c'],ARRAY['r'],8,'An outcome long enough.','fall-2026' FROM public.recruiting_projects LIMIT 1;""",
      "anon", None, 'deny')
check("anon UPDATE position status is denied",
      "UPDATE public.recruiting_positions SET status='closed' WHERE status='open';", "anon", None, 'deny')
check("anon EXECUTE submit RPC is denied",
      "SELECT public.recruiting_submit_application('{}'::jsonb);", "anon", None, 'deny')
check("anon INSERT review is denied",
      "INSERT INTO public.recruiting_reviews (application_id,reviewer_id) SELECT id,'aaaaaaaa-0000-0000-0000-000000000001' FROM public.recruiting_applications LIMIT 1;",
      "anon", None, 'deny')

# ---- mentor isolation (acceptance criterion 5) --------------------------------------
check("Mentor A sees only the application that ranked A's position",
      "SELECT string_agg(full_name,',' ORDER BY full_name) FROM public.recruiting_applications;",
      "authenticated", A, 'rows', "Both Applicant")
check("Mentor B sees both applications that ranked B",
      "SELECT string_agg(full_name,',' ORDER BY full_name) FROM public.recruiting_applications;",
      "authenticated", B, 'rows', "Both Applicant,Only B Applicant")
check("PI sees all three applications",
      "SELECT count(*) FROM public.recruiting_applications;", "authenticated", PI, 'rows', "3")
check("Mentor A sees both ranked-choice rows of the shared application (incl. B's)",
      "SELECT count(*) FROM public.recruiting_application_positions;", "authenticated", A, 'rows', "2")
check("A deactivated mentor sees no applications",
      "SELECT count(*) FROM public.recruiting_applications;", "authenticated", DEAD, 'rows', "0")
check("An undergrad sees no applications",
      "SELECT count(*) FROM public.recruiting_applications;", "authenticated", UG, 'rows', "0")

# ---- column-level status grant ------------------------------------------------------
check("Mentor A may set status on an application they review",
      "UPDATE public.recruiting_applications SET status='in_review' WHERE full_name='Both Applicant';",
      "authenticated", A, 'allow')
check("Mentor A may NOT rewrite the statement",
      "UPDATE public.recruiting_applications SET statement='tampered' WHERE full_name='Both Applicant';",
      "authenticated", A, 'deny')
check("Mentor A may NOT rewrite the email",
      "UPDATE public.recruiting_applications SET email='attacker@ufl.edu' WHERE full_name='Both Applicant';",
      "authenticated", A, 'deny')
check("Mentor A may not set status on an application they cannot review",
      "WITH u AS (UPDATE public.recruiting_applications SET status='accepted' WHERE full_name='Only B Applicant' RETURNING 1) SELECT count(*) FROM u;",
      "authenticated", A, 'rows', "0")

# ---- positions ----------------------------------------------------------------------
check("Mentor A cannot hand their position to Mentor B",
      "WITH u AS (UPDATE public.recruiting_positions SET mentor_id='bbbbbbbb-0000-0000-0000-000000000002' WHERE mentor_id='aaaaaaaa-0000-0000-0000-000000000001' RETURNING 1) SELECT count(*) FROM u;",
      "authenticated", A, 'deny')
check("Mentor A cannot edit Mentor B's position",
      "WITH u AS (UPDATE public.recruiting_positions SET status='closed' WHERE mentor_id='bbbbbbbb-0000-0000-0000-000000000002' RETURNING 1) SELECT count(*) FROM u;",
      "authenticated", A, 'rows', "0")
check("Mentor A can open and close their own position",
      "UPDATE public.recruiting_positions SET status='filled' WHERE id='aaaa1111-0000-0000-0000-00000000000a';",
      "authenticated", A, 'allow')
check("An undergrad cannot create a position",
      """INSERT INTO public.recruiting_positions (project_id,mentor_id,title,description,tasks,requirements,hours_per_week,outcome,cycle)
         SELECT id,'dddddddd-0000-0000-0000-000000000004','UG role','Description over twenty characters ok.',
                ARRAY['a','b','c'],ARRAY['r'],8,'An outcome long enough.','fall-2026' FROM public.recruiting_projects LIMIT 1;""",
      "authenticated", UG, 'deny')
check("A grad student can create a position for themselves",
      """INSERT INTO public.recruiting_positions (project_id,mentor_id,title,description,tasks,requirements,hours_per_week,outcome,cycle)
         SELECT id,'aaaaaaaa-0000-0000-0000-000000000001','New A role','Description over twenty characters ok.',
                ARRAY['a','b','c'],ARRAY['r'],8,'An outcome long enough.','fall-2026' FROM public.recruiting_projects LIMIT 1;""",
      "authenticated", A, 'allow')
check("A grad student cannot create a position owned by someone else",
      """INSERT INTO public.recruiting_positions (project_id,mentor_id,title,description,tasks,requirements,hours_per_week,outcome,cycle)
         SELECT id,'bbbbbbbb-0000-0000-0000-000000000002','Impostor role','Description over twenty characters ok.',
                ARRAY['a','b','c'],ARRAY['r'],8,'An outcome long enough.','fall-2026' FROM public.recruiting_projects LIMIT 1;""",
      "authenticated", A, 'deny')

# ---- reviews -------------------------------------------------------------------------
check("Mentor A can review an application ranked to A",
      "INSERT INTO public.recruiting_reviews (application_id,reviewer_id,score,decision) SELECT id,'aaaaaaaa-0000-0000-0000-000000000001',4,'advance' FROM public.recruiting_applications WHERE full_name='Both Applicant';",
      "authenticated", A, 'allow')
check("Mentor A cannot review an application not ranked to A",
      "INSERT INTO public.recruiting_reviews (application_id,reviewer_id,score) VALUES ('99999999-0000-0000-0000-0000000000b1','aaaaaaaa-0000-0000-0000-000000000001',5);",
      "authenticated", A, 'deny')
check("Mentor B CAN review that same application",
      "INSERT INTO public.recruiting_reviews (application_id,reviewer_id,score) VALUES ('99999999-0000-0000-0000-0000000000b1','bbbbbbbb-0000-0000-0000-000000000002',5);",
      "authenticated", B, 'allow')
check("Mentor A cannot file a review in Mentor B's name",
      "INSERT INTO public.recruiting_reviews (application_id,reviewer_id,score) SELECT id,'bbbbbbbb-0000-0000-0000-000000000002',1 FROM public.recruiting_applications WHERE full_name='Both Applicant';",
      "authenticated", A, 'deny')
check("Mentor A can revise their own review (the spec's missing UPDATE)",
      """INSERT INTO public.recruiting_reviews (application_id,reviewer_id,score,decision)
           SELECT id,'aaaaaaaa-0000-0000-0000-000000000001',4,'advance' FROM public.recruiting_applications WHERE full_name='Both Applicant';
         UPDATE public.recruiting_reviews SET decision='decline' WHERE reviewer_id='aaaaaaaa-0000-0000-0000-000000000001';""",
      "authenticated", A, 'allow')

# ---- archive / retention -------------------------------------------------------------
check("A mentor cannot delete applications",
      "WITH d AS (DELETE FROM public.recruiting_applications WHERE cycle='spring-2026' RETURNING 1) SELECT count(*) FROM d;",
      "authenticated", A, 'rows', "0")
check("The PI cannot delete applications in the OPEN cycle",
      "WITH d AS (DELETE FROM public.recruiting_applications WHERE cycle='fall-2026' RETURNING 1) SELECT count(*) FROM d;",
      "authenticated", PI, 'rows', "0")
check("The PI can delete applications in a closed cycle",
      "WITH d AS (DELETE FROM public.recruiting_applications WHERE cycle='spring-2026' RETURNING 1) SELECT count(*) FROM d;",
      "authenticated", PI, 'rows', "1")

# ---- submit RPC validation -----------------------------------------------------------
def submit(email, choices, extra=""):
    return f"""SELECT public.recruiting_submit_application(jsonb_build_object(
      'full_name','X Y','email','{email}','year','junior','major','Bio','expected_graduation','Fall 2027',
      'coursework',jsonb_build_array('bsc2010'),'r_experience','none','hours_available',8,
      'longest_block_hours',3,'availability','{{}}'::jsonb,'semesters_available',2,'credit_type','any',
      'animal_samples_ok',true,'field_local_ok',true,'field_intl_interest',false,'has_transportation',true,
      'statement','hello','policy_check_score',4,'choices',{choices}));"""

OPEN_A="'aaaa1111-0000-0000-0000-00000000000a'"; OPEN_B="'bbbb1111-0000-0000-0000-00000000000b'"; DRAFT="'aaaa2222-0000-0000-0000-00000000000c'"
one   = f"jsonb_build_array(jsonb_build_object('position_id',{OPEN_A},'rank',1))"
four  = ("jsonb_build_array("
         f"jsonb_build_object('position_id',{OPEN_A},'rank',1),"
         f"jsonb_build_object('position_id',{OPEN_B},'rank',2),"
         f"jsonb_build_object('position_id',{DRAFT},'rank',3),"
         f"jsonb_build_object('position_id',{OPEN_A},'rank',3))")
duprank = ("jsonb_build_array("
           f"jsonb_build_object('position_id',{OPEN_A},'rank',1),"
           f"jsonb_build_object('position_id',{OPEN_B},'rank',1))")
draft1 = f"jsonb_build_array(jsonb_build_object('position_id',{DRAFT},'rank',1))"

check("RPC accepts a valid single-choice submission", submit('new1@ufl.edu', one), None, None, 'allow')
check("RPC rejects 4 ranked positions", submit('new2@ufl.edu', four), None, None, 'deny')
check("RPC rejects two positions at the same rank", submit('new3@ufl.edu', duprank), None, None, 'deny')
check("RPC rejects a draft (not open) position", submit('new4@ufl.edu', draft1), None, None, 'deny')
check("RPC rejects a non-ufl.edu address", submit('nope@gmail.com', one), None, None, 'deny')
check("RPC rejects a second submission from the same email in the cycle",
      submit('dupe@ufl.edu', one) + "\n" + submit('dupe@ufl.edu', one), None, None, 'deny')
check("RPC reports the duplicate distinguishably",
      "DO $$ BEGIN " + submit('dupe2@ufl.edu', one).replace('SELECT','PERFORM') +
      submit('dupe2@ufl.edu', one).replace('SELECT','PERFORM') +
      " EXCEPTION WHEN unique_violation THEN RAISE NOTICE '%', sqlerrm; END $$; SELECT 'checked';",
      None, None, 'rows', "checked")
check("RPC rejects a 1501-character statement",
      submit('long@ufl.edu', one).replace("'statement','hello'", "'statement',repeat('x',1501)"), None, None, 'deny')
check("RPC rejects malformed availability",
      submit('bad@ufl.edu', one).replace("'availability','{}'::jsonb", "'availability',jsonb_build_object('mon',jsonb_build_array(jsonb_build_array(18,9)))"), None, None, 'deny')
check("RPC accepts well-formed availability",
      submit('good@ufl.edu', one).replace("'availability','{}'::jsonb", "'availability',jsonb_build_object('mon',jsonb_build_array(jsonb_build_array(9,12),jsonb_build_array(14,17)))"), None, None, 'allow')
check("RPC rejects an unknown coursework value",
      submit('cw@ufl.edu', one).replace("jsonb_build_array('bsc2010')", "jsonb_build_array('bsc2010','underwater_basketweaving')"), None, None, 'deny')

# ---- positions table constraints -----------------------------------------------------
check("A position with 2 tasks is rejected",
      """INSERT INTO public.recruiting_positions (project_id,mentor_id,title,description,tasks,requirements,hours_per_week,outcome,cycle)
         SELECT id,'aaaaaaaa-0000-0000-0000-000000000001','Two task role','Description over twenty characters ok.',
                ARRAY['a','b'],ARRAY['r'],8,'An outcome long enough.','fall-2026' FROM public.recruiting_projects LIMIT 1;""",
      None, None, 'deny')
check("A position with an empty task string is rejected",
      """INSERT INTO public.recruiting_positions (project_id,mentor_id,title,description,tasks,requirements,hours_per_week,outcome,cycle)
         SELECT id,'aaaaaaaa-0000-0000-0000-000000000001','Blank task role','Description over twenty characters ok.',
                ARRAY['a','  ','c'],ARRAY['r'],8,'An outcome long enough.','fall-2026' FROM public.recruiting_projects LIMIT 1;""",
      None, None, 'deny')
check("A second active cycle is rejected",
      "INSERT INTO public.recruiting_cycles (cycle,label,opens_at,closes_at,active,pi_contact_email) VALUES ('x','X',now(),now()+interval '1 day',true,'a@ufl.edu');",
      None, None, 'deny')

fails = [r for r in results if not r[0]]
for ok, name, detail in results:
    print(("PASS  " if ok else "FAIL  ") + name + ("" if ok else "   <-- " + detail))
print()
print(f"{len(results)-len(fails)}/{len(results)} passed")
sys.exit(1 if fails else 0)
