const https = require('https');

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const token = process.env.CLOUDFLARE_API_TOKEN;
const projectName = process.env.CLOUDFLARE_PAGES_PROJECT || 'akgsempire';
const zoneName = process.env.CLOUDFLARE_ZONE_NAME || 'ghostempire.org';
const apexDomain = zoneName;
const wwwDomain = `www.${zoneName}`;

if (!accountId || !token) {
  console.error('Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in environment.');
  process.exit(1);
}

const cfRequest = ({ method, path, body }) =>
  new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.cloudflare.com',
        path,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let json;
          try {
            json = JSON.parse(data);
          } catch {
            json = { success: false, errors: [{ message: 'Non-JSON response', raw: data }], result: null };
          }
          resolve({ status: res.statusCode, json });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });

const ensureOk = (label, res) => {
  if (res.json && res.json.success) return res;
  const err = new Error(`${label} failed`);
  err.details = res.json;
  throw err;
};

const getZoneId = async () => {
  const res = await cfRequest({
    method: 'GET',
    path: `/client/v4/zones?name=${encodeURIComponent(zoneName)}`
  });
  if (!res.json?.success) return null;
  const zone = Array.isArray(res.json.result) ? res.json.result[0] : null;
  return zone?.id || null;
};

const addPagesDomain = async (domain) => {
  const res = await cfRequest({
    method: 'POST',
    path: `/client/v4/accounts/${accountId}/pages/projects/${projectName}/domains`,
    body: { name: domain }
  });
  if (res.json?.success) return true;
  const already =
    Array.isArray(res.json?.errors) &&
    res.json.errors.some((e) => String(e.message || '').toLowerCase().includes('already exists'));
  if (already) return true;
  throw Object.assign(new Error(`Add Pages domain failed: ${domain}`), { details: res.json });
};

const upsertWwwCname = async (zoneId) => {
  const list = await cfRequest({
    method: 'GET',
    path: `/client/v4/zones/${zoneId}/dns_records?type=CNAME&name=${encodeURIComponent(wwwDomain)}`
  });
  if (!list.json?.success) throw Object.assign(new Error('List DNS records failed'), { details: list.json });

  const existing = Array.isArray(list.json.result) ? list.json.result[0] : null;
  const body = {
    type: 'CNAME',
    name: wwwDomain,
    content: apexDomain,
    proxied: true,
    ttl: 1
  };

  if (existing?.id) {
    const update = await cfRequest({
      method: 'PUT',
      path: `/client/v4/zones/${zoneId}/dns_records/${existing.id}`,
      body
    });
    ensureOk('Update DNS CNAME', update);
    return;
  }

  const create = await cfRequest({
    method: 'POST',
    path: `/client/v4/zones/${zoneId}/dns_records`,
    body
  });
  ensureOk('Create DNS CNAME', create);
};

(async () => {
  try {
    console.log(`Pages project: ${projectName}`);
    console.log(`Zone: ${zoneName}`);

    await addPagesDomain(apexDomain);
    await addPagesDomain(wwwDomain);
    console.log(`✅ Pages domains added: ${apexDomain}, ${wwwDomain}`);

    const zoneId = await getZoneId();
    if (!zoneId) {
      console.log('⚠️ Zone ID not found via API. DNS record not created.');
      console.log('Action: In Cloudflare DNS, create CNAME: www -> ghostempire.org (Proxied).');
      process.exit(0);
    }

    await upsertWwwCname(zoneId);
    console.log(`✅ DNS updated: CNAME ${wwwDomain} -> ${apexDomain} (proxied)`);
  } catch (e) {
    console.error('❌ Setup failed:', e.message);
    if (e.details) console.error(JSON.stringify(e.details, null, 2));
    process.exit(1);
  }
})();

