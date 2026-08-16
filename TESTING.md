# Testing guide — Assessment 3

Run these once the app is up (`docker-compose up -d --build`, frontend on
:3000, api on :4000), from the project root, and capture screenshots /
short clips of the output for the video.

## 1. Playwright (server + client use cases)

```bash
npm install
npx playwright install --with-deps
FRONTEND_BASE_URL=http://localhost:3000 API_BASE_URL=http://localhost:4000 npm run test:e2e
```

- `tests/server.spec.ts` — server use case: full CRUD lifecycle on
  `/api/feedsources`, plus health and stats checks.
- `tests/client.spec.ts` — client use case: the RSS Client page fetching
  and rendering a live feed, and the dashboard loading metrics.

View the HTML report with `npm run test:e2e:report`. Show the terminal
output (all green) and/or the HTML report in the video.

## 2. JMeter (staged load testing)

Requires JMeter installed (`sudo apt install jmeter` or download from
jmeter.apache.org). Run the same plan five times at increasing load:

```bash
cd jmeter
jmeter -n -t load-test-plan.jmx -Jhost=localhost -Jport=4000 -Jusers=1     -Jloops=5 -l results-x1.jtl
jmeter -n -t load-test-plan.jmx -Jhost=localhost -Jport=4000 -Jusers=10    -Jloops=5 -l results-x10.jtl
jmeter -n -t load-test-plan.jmx -Jhost=localhost -Jport=4000 -Jusers=100   -Jloops=5 -l results-x100.jtl
jmeter -n -t load-test-plan.jmx -Jhost=localhost -Jport=4000 -Jusers=1000  -Jloops=2 -l results-x1000.jtl
jmeter -n -t load-test-plan.jmx -Jhost=localhost -Jport=4000 -Jusers=10000 -Jloops=1 -l results-x10000.jtl
```

Each run hits `/api/health`, `/api/rss`, `/api/rss/Campus Announcements`
and `/api/stats`, tagging requests with a `x-client-id` header so they
show up distinctly in the dashboard's "requests per client" table.

Summarise each `.jtl` file (or open it in JMeter's GUI: File → Open,
then add a Summary Report listener):

```bash
for f in results-*.jtl; do
  echo "== $f =="; awk -F',' 'NR>1{c++; s+=$2; if($2>max)max=$2} END{print "requests:",c," avg latency(ms):",s/c," max(ms):",max}' "$f"
done
```

In the video, show the numbers going up (avg latency, throughput) as load
increases from x1 to x10000, and explain in one or two sentences what
that says about the system's capacity.

## 3. Lighthouse (accessibility)

1. Open `http://localhost:3000` in Chrome.
2. DevTools (F12) → **Lighthouse** tab → check only "Accessibility" →
   **Analyze page load**.
3. Repeat for `/rss-client` and `/dashboard`.
4. Screenshot the score, and note 1–2 specific flagged issues (e.g.
   colour contrast, missing alt text, unlabelled buttons).
5. Fix any quick wins in the code, re-run Lighthouse, and show the
   before/after score in the video.

## 4. Generating demo data

Before recording, hit the dashboard's "Generate simulated traffic" button
(or `curl -X POST http://localhost:4000/api/simulate -H "Content-Type: application/json" -d '{"posts":20,"requestLogs":80}'`)
so the dashboard, requests-per-feed/per-client tables and feed status
list (ok / empty / error) all have realistic data to show on camera.
