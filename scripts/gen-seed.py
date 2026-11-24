"""Generate supabase seed SQL from src/lib/drones.ts. Run: python3 scripts/gen-seed.py"""
import json, re
src = open("src/lib/drones.ts").read()
body = src[src.index("= [") + 2 : src.index("export const CATEGORY_LABEL")]
body = body[: body.rindex("]") + 1]
j = re.sub(r"(\n\s+)(\w+):", r'\1"\2":', body)
j = re.sub(r",(\s*[}\]])", r"\1", j)
drones = json.loads(j)
q = lambda s: "'" + s.replace("'", "''") + "'"
rows = []
for d in drones:
    arr = "array[" + ",".join(q(x) for x in d["best_for"]) + "]::text[]"
    vals = [q(d[k]) for k in ["id","slug","name","tagline","description","status","category","image","weight","flight_time","camera","video","range","sensing"]]
    rows.append("  (" + ", ".join(vals + [arr, str(d["sort_order"])]) + ")")
sql = """-- Seed the drone catalogue. Safe to run again: updates existing rows.
-- Generated from src/lib/drones.ts by scripts/gen-seed.py
insert into public.astrofly_drones
  (id, slug, name, tagline, description, status, category, image, weight, flight_time, camera, video, range, sensing, best_for, sort_order)
values
""" + ",\n".join(rows) + """
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, tagline = excluded.tagline, description = excluded.description,
  status = excluded.status, category = excluded.category, image = excluded.image, weight = excluded.weight,
  flight_time = excluded.flight_time, camera = excluded.camera, video = excluded.video, range = excluded.range,
  sensing = excluded.sensing, best_for = excluded.best_for, sort_order = excluded.sort_order;
"""
open("supabase/migrations/20261124000002_astrofly_seed_drones.sql", "w").write(sql)
print(len(drones), "drones")
