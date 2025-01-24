/*
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.json`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
type RequestHandler = (request: Request<unknown, IncomingRequestCfProperties<unknown>>, env: Env) => Promise<Response>

const validUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const handlePost: RequestHandler = async (request, env) => {
  // @ts-ignore
  const url = new URL(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_NAME}`)
  // @ts-ignore
  const auth = `Bearer ${env.AIRTABLE_API_KEY}`

  try {
    const jsonData = await request.json()
    if (typeof jsonData !== "object" || jsonData === null) throw new Error("JSON data is not an object")
    // Validate that all fields are present
    if (!("user_id" in jsonData)) throw new Error("Missing 'user_id' field")
    if (!("score" in jsonData)) throw new Error("Missing 'score' field")
    if (!("username" in jsonData)) throw new Error("Missing 'username' field")
    // Validate data types and formats
    if (typeof jsonData.user_id !== "string") throw new Error("User ID is not a string")
    if (!validUUID.test(jsonData.user_id)) throw new Error("User ID is not a valid UUID")
    if (typeof jsonData.score !== "number") throw new Error("Score is not a number")
    if (jsonData.score < 0) throw new Error("Score is negative")
    if (typeof jsonData.username !== "string") throw new Error("Username is not a string")
    if (jsonData.username.length === 0) throw new Error("Username is empty")
    // Ensure consistency in the database by normalising the values
    const username = jsonData.username.trim().slice(0, 255)
    const score = Math.floor(jsonData.score) // Ensure score is an integer
    const userId = jsonData.user_id.toLowerCase()

    // Append the data to our Airtable base
    console.log(`Sending PATCH to ${url}`)
    const airtableResponse = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        performUpsert: {
          fieldsToMergeOn: ["User ID"],
        },
        records: [
          {
            fields: {
              Username: username,
              Score: score,
              "User ID": userId,
            },
          },
        ],
      }),
    })

    if (!airtableResponse.ok) {
      console.error(await airtableResponse.json())
      throw new Error("Failed to save to Airtable")
    }

    const airtableData = await airtableResponse.json()
    return new Response(JSON.stringify(airtableData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

const handleGet: RequestHandler = async (_, env): Promise<Response> => {
  // @ts-ignore
  const url = new URL(`https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_NAME}`)
  // @ts-ignore
  const auth = `Bearer ${env.AIRTABLE_API_KEY}`
  url.searchParams.append("fields[]", "Username")
  url.searchParams.append("fields[]", "Score")
  // @ts-ignore
  url.searchParams.append("view", env.AIRTABLE_VIEW_ID)

  const airtableResponse = await fetch(url, {
    headers: {
      Authorization: auth,
    },
  })
  if (!airtableResponse.ok) {
    console.error(await airtableResponse.json())
    throw new Error("Failed to fetch from Airtable")
  }
  const airtableData = await airtableResponse.json()
  return new Response(JSON.stringify(airtableData), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}

function getHandler(request: Request<unknown, IncomingRequestCfProperties<unknown>>): RequestHandler | null {
  if (request.method === "POST") return handlePost
  if (request.method === "GET") return handleGet
  return null
}

export default {
  async fetch(request, env, ctx) {
    const handler = getHandler(request)
    if (!handler) return new Response("Woah there, method not allowed!", { status: 405 })
    return handler(request, env).catch((error) => {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    })
  },
} satisfies ExportedHandler<Env>
