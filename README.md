# Prerequirements

Install peer js server 

```bash 
npm install peer -g
```

Start it, for example 

```bash
peerjs --port 9000 --key peerjs --path /myapp
```

Then add this config to the utis/defaultPeerOptions.ts

# Run

Just build and run current application 

```bash
npm install
npm run build

# For local preview 
npm run preview
```

Then connect to the `http://localhost:3000`
