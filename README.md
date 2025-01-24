# `cheesecake-worker`

Ahoy! This is the current backend for [Cheesecake Clicker](https://github.com/MMK21Hub/cheesecake-clicker), my clicker game. Check out the main repo for more info!

## Important deployment documentation

### Cloudflare Workers secrets

```bash
wrangler secret put AIRTABLE_API_KEY
wrangler secret put AIRTABLE_BASE_ID
wrangler secret put AIRTABLE_TABLE_ID
```

## Development documentation

Create a `.dev.vars` file in the root of the project, and specify env vars like this:

```env
AIRTABLE_BASE_ID=appABCD
AIRTABLE_TABLE_NAME=tblABCD
AIRTABLE_VIEW_ID=viwABCD
AIRTABLE_API_KEY=patABCDEFGHIJKLMNOP
```

Then run the standard `yarn` + `yarn dev` incarnation, and the worker should run locally using Wrangler :)
