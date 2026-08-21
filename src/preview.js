import http from "node:http";
import fs from "node:fs";

http
	.createServer((req, res) => {
		if (req.url === "/view") {
			res.writeHead(200, { "Content-Type": "text/html" });
			res.end(`
      <html><body style="margin:0;background:#fff;display:flex;justify-content:center;align-items:center">
        <img id="frame" src="/frame.png" style="image-rendering:pixelated;">
        <script>
          // The board only redraws when the number changes, so a slow poll is plenty.
          setInterval(() => {
            document.getElementById('frame').src = '/frame.png?t=' + Date.now();
          }, 1000);
        </script>
      </body></html>
    `);
		} else if (req.url.startsWith("/frame.png")) {
			try {
				const frame = fs.readFileSync("./output/frame.png");
				res.writeHead(200, { "Content-Type": "image/png" });
				res.end(frame);
			} catch {
				// No frame rendered yet - don't take the process down over it.
				res.writeHead(404).end();
			}
		} else {
			res.writeHead(404).end();
		}
	})
	.listen(3000);
