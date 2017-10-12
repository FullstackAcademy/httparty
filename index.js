const http = require("http");
const qs = require("qs");
const { PORT = 3000 } = process.env
const server = http.createServer().listen(PORT);

const match = (route, req, res) => {
  switch (route) {
    case "GET /":
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(html("Httplay", "<h1>Welcome to HTTPlay</h1>"));
    
    case "GET /help":
      res.writeHead(200, { "Content-Type": "text/html" });
      return res.end(html("Httplay", "<h1>Endpoints:</h1>",`<ul>
      <li><pre>GET /</pre> Simple 200 response</li>
      <li><pre>GET /help</pre> This page</li>
      <li><pre>POST /data</pre> Accepts data, simple 201 response</li>
      <li><pre>GET /boom</pre> Returns 500 error</li>
      <li><pre>GET /admin</pre> Returns 401 unless Auth Header is present with user:123</li>
      <li><pre>GET /slow</pre> Delayed 200 response</li>
      <li><pre>GET /chunks</pre> Chunked Transfer Encoding</li>
      <li>Anything else - Returns 404</li>
      </ul>`));

    case "GET /slow":
      res.writeHead(200, { "Content-Type": "text/html" });
      return setTimeout(
        () => res.end(html("Httplay", "<h1>Oh, were you waiting for me?</h1>")),
        2000
      );

    case "GET /chunks":
      res.writeHead(200, {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked"
      });
      res.write("Helo?\n")
      setTimeout(() => res.write("helo?\n") , 500);
      setTimeout(() => res.write("helo?\n") , 1000);
      setTimeout(() => res.write("Okay...\n") , 1800);
      setTimeout(() => res.write("I do believe it's working, good\n") , 3800);
      setTimeout(() => res.write("Come on, it's time to go\n") , 5800);
      return setTimeout(() => res.end("\n") , 7800);

    case "POST /data":
      res.writeHead(201, { "Content-Type": "text/html" });
      return res.end(
        html(
          "Httplay",
          "<h1>Got your data:</h1>",
          `<pre>\n${JSON.stringify(req.body, null, 2)}\n</pre>`
        )
      );

    case "GET /boom":
      res.writeHead(500, { "Content-Type": "text/html" });
      return res.end(
        html(
          "Internal Server Error",
          "<h1>Internal Server Error</h1>",
          "<p>My bad, I don't know what exactly went wrong but things are on fire here.</p>"
        )
      );

    case "GET /admin":
      const authHeader = req.headers["authorization"];
      var authBuf = new Buffer(authHeader.split(" ")[1], "base64");
      if (authBuf.toString() === "user:123") {
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end(html("Admin Area", "<h1>Welcome to the safe room</h1>"));
      } else {
        res.writeHead(401, { "Content-Type": "text/html" });
        return res.end(
          html("Unauthorized", "<h1>Authorization Required</h1>", "<p>Psst... Try user:123</p>")
        );
      }

    default:
      res.writeHead(404, { "Content-Type": "text/html" });
      return res.end(html("Not found", "<h1>Page was not found</h1>"));
  }
};

const html = (title, ...body) => `<html>
<head>
 <title>${title}</title>
</head>
<body>${body.map(b => `\n ${b}`).join("")}
</body>
</html>`;

server.on("request", (req, res) => {
  const route = `${req.method} ${req.url}`;
  // Stupid Logging
  console.log(route);

  // Stupid body parsing
  let body;
  if (req.method == "POST" || req.method == "PUT") {
    body = "";
  }
  req.on("data", function(data) {
    body += data;
  });

  // Stupid routing
  req.on("end", () => {
    if (body) req.body = qs.parse(body);
    match(route, req, res);
  });
});

console.log(`Listening on port ${PORT}`);
