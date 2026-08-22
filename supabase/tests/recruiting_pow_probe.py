import subprocess, json, hashlib, sys
PSQL=["/usr/lib/postgresql/16/bin/psql","-h","/tmp/pgrun","-p","5433","-U","postgres","-d","scratch","-X","-q","-A","-t"]
def q(sql, role=None):
    pre=f"SET ROLE {role};\n" if role else ""
    p=subprocess.run(PSQL+["-c",pre+sql],capture_output=True,text=True)
    return p.returncode,(p.stdout or "").strip(),(p.stderr or "").strip()

def solve(cid, bits):
    n=0
    while True:
        h=hashlib.sha256(f"{cid}:{n}".encode()).digest()
        v=int.from_bytes(h[:4],'big')
        if v >> (32-bits) == 0: return str(n), n
        n+=1

BASE={"full_name":"PoW Applicant","email":"pow@ufl.edu","year":"junior","major":"Micro",
 "expected_graduation":"Spring 2028","coursework":["bsc2010"],"r_experience":"none",
 "hours_available":10,"longest_block_hours":4,"availability":{"mon":[[9,13]]},
 "semesters_available":3,"credit_type":"any","animal_samples_ok":True,"field_local_ok":True,
 "field_intl_interest":False,"has_transportation":True,"statement":"Hello.",
 "policy_answers":{"min_hours":6,"min_semesters":2,"trial_weeks":4,"ehs_required":True},
 "elapsed_ms":95000,"website":"",
 "choices":[{"position_id":"aaaa1111-0000-0000-0000-00000000000a","rank":1}]}
def submit(role="anon", **over):
    p=dict(BASE); p.update(over)
    lit=json.dumps(p).replace("'","''")
    rc,out,err=q(f"SELECT public.recruiting_submit_application_public('{lit}'::jsonb);", role)
    if rc!=0: return {"_err":err.splitlines()[0]}
    return json.loads(out.splitlines()[-1])

R=[]
def ck(name, cond, detail=""): R.append((bool(cond),name,detail))

# --- issue + solve + submit -------------------------------------------------------------
rc,out,_=q("SELECT public.recruiting_issue_pow_challenge();","anon")
ch=json.loads(out.splitlines()[-1])
ck("anon can request a challenge", ch.get("ok") and ch.get("difficulty_bits")==18, f"bits={ch.get('difficulty_bits')}")
cid=ch["challenge_id"]
import time; t0=time.time(); nonce,tries=solve(cid,18); solve_s=time.time()-t0
ck("a valid nonce is found", True, f"{tries} hashes in {solve_s:.2f}s (python; browsers are slower)")

r=submit(pow_challenge_id=cid, pow_nonce=nonce)
ck("a solved challenge is accepted", r.get("ok") is True, str(r.get("error"))[:70])

# --- replay -------------------------------------------------------------------------------
r=submit(email="pow2@ufl.edu", pow_challenge_id=cid, pow_nonce=nonce)
ck("the same challenge cannot be reused", r.get("ok") is False and r.get("retry_pow"), str(r.get("error"))[:60])

# --- wrong nonce --------------------------------------------------------------------------
rc,out,_=q("SELECT public.recruiting_issue_pow_challenge();","anon"); cid2=json.loads(out.splitlines()[-1])["challenge_id"]
r=submit(email="pow3@ufl.edu", pow_challenge_id=cid2, pow_nonce="0")
ck("a wrong nonce is rejected", r.get("ok") is False and r.get("retry_pow"), str(r.get("error"))[:60])

# --- no challenge at all -------------------------------------------------------------------
r=submit(email="pow4@ufl.edu")
ck("a submission with no proof at all is rejected", r.get("ok") is False and r.get("retry_pow"), str(r.get("error"))[:60])

# --- a nonce solved for a DIFFERENT challenge -----------------------------------------------
rc,out,_=q("SELECT public.recruiting_issue_pow_challenge();","anon"); cidA=json.loads(out.splitlines()[-1])["challenge_id"]
rc,out,_=q("SELECT public.recruiting_issue_pow_challenge();","anon"); cidB=json.loads(out.splitlines()[-1])["challenge_id"]
nA,_=solve(cidA,18)
r=submit(email="pow5@ufl.edu", pow_challenge_id=cidB, pow_nonce=nA)
ck("work done for another challenge does not transfer", r.get("ok") is False, str(r.get("error"))[:60])

# --- expired -------------------------------------------------------------------------------
rc,out,_=q("SELECT public.recruiting_issue_pow_challenge();","anon"); cidE=json.loads(out.splitlines()[-1])["challenge_id"]
nE,_=solve(cidE,18)
q(f"UPDATE public.recruiting_pow_challenges SET issued_at = now() - interval '2 hours' WHERE id='{cidE}';")
r=submit(email="pow6@ufl.edu", pow_challenge_id=cidE, pow_nonce=nE)
ck("an hour-old challenge is rejected", r.get("ok") is False, str(r.get("error"))[:60])

# --- difficulty 0 disables the gate ----------------------------------------------------------
q("UPDATE public.recruiting_cycles SET pow_difficulty_bits=0 WHERE cycle='fall-2026';")
r=submit(email="pow7@ufl.edu")
ck("difficulty 0 skips the gate entirely", r.get("ok") is True, str(r.get("error"))[:60])
q("UPDATE public.recruiting_cycles SET pow_difficulty_bits=18 WHERE cycle='fall-2026';")

# --- verifier is not callable by anon ---------------------------------------------------------
rc,out,err=q("SELECT public.recruiting_verify_pow(gen_random_uuid(),'0');","anon")
ck("anon cannot call the verifier directly", rc!=0, (err.splitlines() or [""])[0][:60])
rc,out,err=q("SELECT count(*) FROM public.recruiting_pow_challenges;","anon")
ck("anon cannot read the challenge table", rc!=0, (err.splitlines() or [""])[0][:60])

# --- the public view --------------------------------------------------------------------------
rc,out,_=q("SELECT count(*), string_agg(DISTINCT project_name, ',') FROM public.recruiting_open_positions;","anon")
ck("anon reads open positions through the view", rc==0, out)
rc,out,err=q("SELECT count(*) FROM public.projects;","anon")
ck("anon still cannot read public.projects directly", rc!=0 or out.strip()=="0", (err.splitlines() or [out])[0][:60])
rc,out,_=q("SELECT count(*) FROM public.recruiting_open_positions WHERE title LIKE '%draft%';","anon")
ck("the view hides draft positions", out.strip()=="0", f"count={out.strip()}")

# --- profile link ------------------------------------------------------------------------------
q("INSERT INTO public.profiles (id,email,full_name) VALUES ('ffffffff-0000-0000-0000-00000000000f','new.undergrad@ufl.edu','New Undergrad') ON CONFLICT DO NOTHING;")
rc,out,_=q("SELECT id FROM public.recruiting_applications WHERE email='pow@ufl.edu';")
appid=out.strip().splitlines()[-1]
rc,out,err=q(f"SET LOCAL request.jwt.claim.sub='aaaaaaaa-0000-0000-0000-000000000001';SET ROLE authenticated;UPDATE public.recruiting_applications SET profile_id='ffffffff-0000-0000-0000-00000000000f' WHERE id='{appid}';")
ck("a mentor cannot link an application to an account", rc!=0, (err.splitlines() or ["NO ERROR"])[0][:70])
rc,out,err=q(f"SET LOCAL request.jwt.claim.sub='cccccccc-0000-0000-0000-000000000003';SET ROLE authenticated;UPDATE public.recruiting_applications SET profile_id='ffffffff-0000-0000-0000-00000000000f' WHERE id='{appid}';")
ck("the PI can", rc==0, (err.splitlines() or ["ok"])[0][:70])
rc,out,_=q(f"SET LOCAL request.jwt.claim.sub='aaaaaaaa-0000-0000-0000-000000000001';SET ROLE authenticated;UPDATE public.recruiting_applications SET status='interview' WHERE id='{appid}' RETURNING 1;")
ck("a mentor can still set status", "1" in out, out.strip()[:20])

f=[r for r in R if not r[0]]
for ok,n,d in R: print(("PASS  " if ok else "FAIL  ")+n+("   "+d if d else ""))
print(f"\n{len(R)-len(f)}/{len(R)} passed")
sys.exit(1 if f else 0)
