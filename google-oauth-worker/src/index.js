// src/index.js
export default {
	async fetch(request, env, ctx) {
	  const url = new URL(request.url);

	  // Add /exchange endpoint
	  if (request.method === "POST" && url.pathname === "/exchange") {
		const { code, redirect_uri } = await request.json();
		const client_id = env.GOOGLE_CLIENT_ID;
		const client_secret = env.GOOGLE_CLIENT_SECRET;
		const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		  method: "POST",
		  headers: { "Content-Type": "application/x-www-form-urlencoded" },
		  body: new URLSearchParams({
			code,
			client_id,
			client_secret,
			redirect_uri,
			grant_type: "authorization_code"
		  })
		});
		const tokenData = await tokenRes.json();
		return new Response(JSON.stringify(tokenData), {
		  headers: { "Content-Type": "application/json" }
		});
	  }

	  // Add /refresh endpoint
	  if (request.method === "POST" && url.pathname === "/refresh") {
		const { refresh_token } = await request.json();
		const client_id = env.GOOGLE_CLIENT_ID;
		const client_secret = env.GOOGLE_CLIENT_SECRET;
		const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
		  method: "POST",
		  headers: { "Content-Type": "application/x-www-form-urlencoded" },
		  body: new URLSearchParams({
			refresh_token,
			client_id,
			client_secret,
			grant_type: "refresh_token"
		  })
		});
		const tokenData = await tokenRes.json();
		return new Response(JSON.stringify(tokenData), {
		  headers: { "Content-Type": "application/json" }
		});
	  }

	  return new Response("Not found", { status: 404 });
	}
  };