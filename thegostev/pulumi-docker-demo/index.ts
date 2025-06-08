import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

// Configuration
const config = new pulumi.Config();
const stackName = pulumi.getStack();

class WebAppStack extends pulumi.ComponentResource {
    public nginxContainer: docker.Container;
    public redisContainer: docker.Container;
    
    constructor(name: string, port: number, opts?: pulumi.ComponentResourceOptions) {
        super("custom:resource:WebAppStack", name, {}, opts);

        // Create a Docker network for this stack
        const network = new docker.Network(`${name}-network`, {
            name: `webapp-network-${name}`,
            driver: "bridge",
        }, { parent: this });

        // Pull Redis image
        const redisImage = new docker.RemoteImage(`${name}-redis-image`, {
            name: "redis:7-alpine",
            keepLocally: true,
        }, { parent: this });

        // Create Redis container
        this.redisContainer = new docker.Container(`${name}-redis`, {
            name: `redis-${name}`,
            image: redisImage.imageId,
            networksAdvanced: [{ 
                name: network.name,
                aliases: ["redis"]
            }],
            ports: [{ 
                internal: 6379, 
                external: port + 1000 
            }],
            restart: "unless-stopped",
        }, { parent: this });

        // Pull Nginx image
        const nginxImage = new docker.RemoteImage(`${name}-nginx-image`, {
            name: "nginx:alpine",
            keepLocally: true,
        }, { parent: this });

        // Create custom Nginx configuration
        const nginxConfig = `
events {
    worker_connections 1024;
}

http {
    upstream redis_backend {
        server redis:6379;
    }
    
    server {
        listen 80;
        location / {
            root /usr/share/nginx/html;
            index index.html;
        }
        
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
    }
}`;

        // Create Nginx container with custom config
        this.nginxContainer = new docker.Container(`${name}-nginx`, {
            name: `nginx-${name}`,
            image: nginxImage.imageId,
            networksAdvanced: [{ 
                name: network.name 
            }],
            ports: [{ 
                internal: 80, 
                external: port 
            }],
            envs: [
                `REDIS_HOST=redis`,
                `STACK_NAME=${name}`,
                `PORT=${port}`
            ],
            uploads: [{
                content: nginxConfig,
                file: "/etc/nginx/nginx.conf"
            }, {
                content: `
<!DOCTYPE html>
<html>
<head>
    <title>Pulumi Docker Demo - ${name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
        .info { margin: 20px 0; padding: 15px; background: #eff6ff; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">🚀 Pulumi Docker Demo</h1>
        <div class="info">
            <h2>Stack: ${name}</h2>
            <p><strong>Port:</strong> ${port}</p>
            <p><strong>Redis Port:</strong> ${port + 1000}</p>
            <p><strong>Status:</strong> ✅ Running</p>
        </div>
        <p>This Nginx server is running in a Docker container managed by Pulumi!</p>
        <p>Redis is available at: redis:6379 (internal network)</p>
        <p><a href="/health">Health Check</a></p>
    </div>
</body>
</html>`,
                file: "/usr/share/nginx/html/index.html"
            }],
            restart: "unless-stopped",
        }, { parent: this });

        // Register outputs
        this.registerOutputs({
            nginxContainerId: this.nginxContainer.id,
            redisContainerId: this.redisContainer.id,
            networkId: network.id,
        });
    }
}

// Create the web application stack based on Pulumi stack name
const webApp = new WebAppStack(stackName, stackName === "prod" ? 8080 : 8081);

// Export useful information
export const nginxUrl = pulumi.interpolate`http://localhost:${stackName === "prod" ? 8080 : 8081}`;
export const redisPort = stackName === "prod" ? 7080 : 7081;
export const stackInfo = {
    name: stackName,
    nginxContainer: webApp.nginxContainer.name,
    redisContainer: webApp.redisContainer.name,
};
