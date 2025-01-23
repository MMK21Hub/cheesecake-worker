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
const validUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      // @ts-ignore
      const url = `https://api.airtable.com/v0/${env.AIRTABLE_BASE_ID}/${env.AIRTABLE_TABLE_NAME}`
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
        const score = jsonData.score
        const userId = jsonData.user_id.toLowerCase()

        // Append the data to our Airtable base
        console.log(`Sending POST to ${url}`)
        const airtableResponse = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: auth,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              Username: username,
              Score: score,
              "User ID": userId,
            },
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
    } else {
      return new Response("Woah there, method not allowed!", { status: 405 })
    }
  },
} satisfies ExportedHandler<Env>
