import subprocess, json, sys, hashlib
PSQL=["/usr/lib/postgresql/16/bin/psql","-h","/tmp/pgrun","-p","5433","-U","postgres","-d","scratch","-X","-q","-A","-t"]
def run(sql, role=None, commit=False):
    pre = f"SET ROLE {role};\n" if role else ""
    body = ("BEGIN;\n" + pre + sql + ("\nCOMMIT;\n" if commit else "\nROLLBACK;\n"))
    p = subprocess.run(PSQL+["-c", body], capture_output=True, text=True)
    return p.returncode, (p.stdout or "").strip(), (p.stderr or "").strip()

BASE = {
 "full_name":"Real Applicant","email":"real@ufl.edu","year":"junior","major":"Microbiology",
 "expected_graduation":"Spring 2028","coursework":["bsc2010","statistics"],"r_experience":"coursework",
 "hours_available":10,"longest_block_hours":4,"availability":{"mon":[[9,13]]},
 "semesters_available":3,"credit_type":"course_credit","animal_samples_ok":True,"field_local_ok":True,
 "field_intl_interest":False,"has_transportation":True,"statement":"I would like to learn extraction.",
 "policy_answers":{"min_hours":6,"min_semesters":2,"trial_weeks":4,"ehs_required":True},
 "elapsed_ms":95000,"website":"",
 "choices":[{"position_id":"aaaa1111-0000-0000-0000-00000000000a","rank":1}],
}
def fresh_pow():
    """Issue a challenge and solve it, exactly as the browser does.

    Added 2026-08-22 with the proof-of-work gate. Without this every case that expects a
    successful submission fails with 'The check that you are a real browser did not
    complete' - which is the gate working, not the probe finding a bug."""
    # NOT run(): that wraps every statement in BEGIN/ROLLBACK, so the issued challenge
    # would be rolled back before the submission in the next transaction could spend it.
    p = subprocess.run(
        PSQL + ["-c", "SET ROLE anon; SELECT public.recruiting_issue_pow_challenge();"],
        capture_output=True, text=True)
    rc, out, err = p.returncode, (p.stdout or "").strip(), (p.stderr or "").strip()
    ch = json.loads(out.splitlines()[-1])
    if not ch.get("ok"):
        return {"pow_challenge_id": None, "pow_nonce": None}
    cid, bits = ch["challenge_id"], ch["difficulty_bits"]
    if bits == 0:
        return {"pow_challenge_id": cid, "pow_nonce": "0"}
    n = 0
    while True:
        h = hashlib.sha256(f"{cid}:{n}".encode()).digest()
        if int.from_bytes(h[:4], "big") >> (32 - bits) == 0:
            return {"pow_challenge_id": cid, "pow_nonce": str(n)}
        n += 1

def call(**over):
    p = dict(BASE); p.update(fresh_pow()); p.update(over)
    lit = json.dumps(p).replace("'", "''")
    return f"SELECT public.recruiting_submit_application_public('{lit}'::jsonb);"

results=[]
def check(name, sql, role, want_key, want_val=None, commit=False):
    rc,out,err = run(sql, role, commit)
    if rc!=0:
        results.append((False,name,(err.splitlines() or ["?"])[0])); return None
    try: obj=json.loads(out.splitlines()[-1])
    except Exception: results.append((False,name,f"unparseable: {out[:90]}")); return None
    got = obj.get(want_key)
    ok = (got==want_val) if want_val is not None else (got is not None)
    results.append((ok,name,f"{want_key}={got!r} error={str(obj.get('error'))[:70]!r} fields={list((obj.get('fields') or {}).keys())}"))
    return obj

check("anon: a well-formed application is accepted", call(), "anon", "ok", True)
check("anon: honeypot filled -> looks accepted but inserts nothing", call(website="http://spam"), "anon", "ok", True)
check("anon: submitted in 3 seconds is refused", call(elapsed_ms=3000), "anon", "ok", False)
check("anon: elapsed_ms missing is refused", call(elapsed_ms=None), "anon", "ok", False)
check("anon: gmail address is refused with a field error", call(email="x@gmail.com"), "anon", "ok", False)
check("anon: 1501-char statement refused", call(statement="x"*1501), "anon", "ok", False)
check("anon: four choices refused", call(choices=[{"position_id":"aaaa1111-0000-0000-0000-00000000000a","rank":1},{"position_id":"bbbb1111-0000-0000-0000-00000000000b","rank":2},{"position_id":"aaaa2222-0000-0000-0000-00000000000c","rank":3},{"position_id":"aaaa1111-0000-0000-0000-00000000000a","rank":4}]), "anon","ok",False)
check("anon: ranks 1 and 3 refused", call(choices=[{"position_id":"aaaa1111-0000-0000-0000-00000000000a","rank":1},{"position_id":"bbbb1111-0000-0000-0000-00000000000b","rank":3}]), "anon","ok",False)
check("anon: a draft position refused", call(choices=[{"position_id":"aaaa2222-0000-0000-0000-00000000000c","rank":1}]), "anon","ok",False)
check("anon: malformed availability refused", call(availability={"mon":[[18,9]]}), "anon","ok",False)

# honeypot really inserted nothing
rc,out,err = run("SET ROLE anon;\n"+call(website="http://spam", email="hp@ufl.edu")+"\nRESET ROLE;\nSELECT count(*) FROM public.recruiting_applications WHERE email='hp@ufl.edu';", None, False)
results.append((out.strip().splitlines()[-1]=="0", "honeypot inserted no row", f"count={out.strip().splitlines()[-1]}"))

# duplicate -> duplicate flag
dup = ("SET ROLE anon;\n" + call(email="dup@ufl.edu") + "\n" + call(email="dup@ufl.edu"))
rc,out,err = run(dup, None, False)
last = json.loads(out.strip().splitlines()[-1])
results.append((last.get("duplicate") is True and last.get("ok") is False, "second submission from the same address reports duplicate", str(last.get("error"))[:70]))

# policy score graded server-side, and a lie is not believed
rc,out,err = run("SET ROLE anon;\n" + call(email="score@ufl.edu", policy_check_score=4,
    policy_answers={"min_hours":99,"min_semesters":99,"trial_weeks":99,"ehs_required":False})
    + "\nRESET ROLE;\nSELECT policy_check_score FROM public.recruiting_applications WHERE email='score@ufl.edu';", None, False)
score = out.strip().splitlines()[-1]
results.append((score=="0","a forged policy_check_score is ignored and regraded",f"stored score={score}"))

# require_turnstile closes the door
rc,out,err = run("UPDATE public.recruiting_cycles SET require_turnstile=true WHERE cycle='fall-2026';\nSET ROLE anon;\n"+call(email="closed@ufl.edu"), None, False)
obj=json.loads(out.strip().splitlines()[-1])
results.append((obj.get("ok") is False,"require_turnstile=true refuses the direct door",str(obj.get("error"))[:60]))

# rate cap
rate = "UPDATE public.recruiting_cycles SET max_submissions_per_hour=2 WHERE cycle='fall-2026';\nSET ROLE anon;\n"
rate += "\n".join(call(email=f"r{i}@ufl.edu") for i in range(4))
rc,out,err = run(rate, None, False)
objs=[json.loads(l) for l in out.strip().splitlines() if l.startswith("{")]
blocked = sum(1 for o in objs if o.get("ok") is False)
results.append((blocked>=1,"hourly cap starts refusing once it is reached",f"{blocked} of {len(objs)} refused at cap=2"))

# anon still cannot touch the tables directly
for name,sql in [("anon still cannot SELECT applications","SELECT count(*) FROM public.recruiting_applications;"),
                 ("anon still cannot INSERT applications directly","INSERT INTO public.recruiting_applications (cycle,full_name,email,year,major,expected_graduation,coursework,r_experience,hours_available,longest_block_hours,availability,semesters_available,credit_type,animal_samples_ok,field_local_ok,field_intl_interest,has_transportation,statement,policy_check_score) VALUES ('fall-2026','H','h@ufl.edu','junior','X','Fall 2027',ARRAY['bsc2010'],'none',8,3,'{}'::jsonb,2,'any',true,true,false,true,'hi',0);"),
                 ("anon still cannot call the service-role RPC","SELECT public.recruiting_submit_application('{}'::jsonb);")]:
    rc,out,err = run(sql,"anon")
    results.append((rc!=0,name,(err.splitlines() or ["NO ERROR RAISED"])[0][:80]))

fails=[r for r in results if not r[0]]
for ok,name,detail in results:
    print(("PASS  " if ok else "FAIL  ")+name+"   "+detail)
print(f"\n{len(results)-len(fails)}/{len(results)} passed")
sys.exit(1 if fails else 0)
