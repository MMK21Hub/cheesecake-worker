# `cheesecake-worker`

Ahoy! This is the current backend for [Cheesecake Clicker](https://github.com/MMK21Hub/cheesecake-clicker), my clicker game. Check out the main repo for more info!

## Important deployment documentation

### Cloudflare Workers secrets

```bash
wrangler secret put AIRTABLE_API_KEY
wrangler secret put AIRTABLE_BASE_ID
wrangler secret put AIRTABLE_TABLE_ID
```
