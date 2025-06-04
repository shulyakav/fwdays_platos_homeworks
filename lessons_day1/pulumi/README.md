# Homework: Deploying a Web Application with Pulumi and Docker

## **Objective**
In this assignment, you will:
1. Install and configure **Pulumi**.
2. Set up **Docker** as the provider.
3. Create two Pulumi stacks where each stack:
   - Deploys a **Nginx web server container**.
   - Uses a **Redis container** for caching.
   - Has a unique configuration (e.g., different port mappings).
4. Deploy the stacks on your local machine using **Docker**.

---

## **Part 1: Installation & Configuration**

### **Step 1: Install Required Tools**
Ensure you have the following installed:
- **Docker** (for running containers locally)
- **Node.js (v18+)**
- **Pulumi**

#### **1. Install Pulumi**
```sh
# On macOS
brew install pulumi

# On Linux/Windows
curl -fsSL https://get.pulumi.com | sh
```

#### **2. Verify Installation**
```sh
pulumi version
docker --version
node --version
```

#### **3. Login to Pulumi (Local Backend)**
```sh
pulumi login --local
```

---

## **Part 2: Set Up the Pulumi Project**

### **Step 1: Initialize the Project**
```sh
mkdir pulumi-docker-demo && cd pulumi-docker-demo

# Use typescript template (docker-typescript doesn't exist)
pulumi new typescript --name pulumi-docker-demo
```

### **Step 2: Install Required Pulumi Packages**
```sh
npm install @pulumi/docker @pulumi/pulumi
```

### **Step 3: Update package.json**
Ensure your `package.json` includes:
```json
{
    "name": "pulumi-docker-demo",
    "main": "index.js",
    "devDependencies": {
        "@types/node": "^16"
    },
    "dependencies": {
        "@pulumi/pulumi": "^3.0.0",
        "@pulumi/docker": "^4.0.0"
    }
}
```

---

## **Part 3: Implement the Web Application Stack**

### **Replace `index.ts` contents:**

```typescript
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
```

---

## **Part 4: Create and Deploy Multiple Stacks**

### **Step 1: Create Development Stack**
```sh
# Create and deploy dev stack
pulumi stack init dev #if dev already exists - just run next command
pulumi up --yes
```

### **Step 2: Create Production Stack**
```sh
# Create and deploy prod stack
pulumi stack init prod
pulumi up --yes
```

### **Step 3: Check Stack Status**
```sh
# List all stacks
pulumi stack ls

# Get outputs from current stack
pulumi stack output

# Switch between stacks
pulumi stack select dev
pulumi stack select prod
```

---

## **Part 5: Verification**

### **Step 1: Check Running Containers**
```sh
docker ps
```
You should see containers running for both stacks.

### **Step 2: Access Web Applications**
Open your browser and navigate to:
- **Development Stack:** [http://localhost:8081](http://localhost:8081)
- **Production Stack:** [http://localhost:8080](http://localhost:8080)

### **Step 3: Test Health Endpoints**
```sh
# Test dev stack
curl http://localhost:8081/health

# Test prod stack  
curl http://localhost:8080/health
```

### **Step 4: Check Redis Connectivity**
```sh
# Connect to Redis in dev stack
docker exec -it redis-dev redis-cli ping

# Connect to Redis in prod stack
docker exec -it redis-prod redis-cli ping
```

---

## **Part 6: Stack Management**

### **Step 1: View Stack Differences**
```sh
# Compare stacks
pulumi stack select dev
pulumi stack output

pulumi stack select prod  
pulumi stack output
```

### **Step 2: Update Configuration**
```sh
# Add configuration to a stack
pulumi config set description "Development environment"
pulumi up --yes
```

### **Step 3: Clean Up**
```sh
# Destroy dev stack
pulumi stack select dev
pulumi destroy --yes

# Destroy prod stack
pulumi stack select prod
pulumi destroy --yes

# Remove stacks (optional)
pulumi stack rm dev --yes
pulumi stack rm prod --yes
```

---

## **Part 7: Troubleshooting**

### **Common Issues and Solutions:**

1. **"docker-typescript template not found"**
   - Use `pulumi new typescript` instead
   - Manually install `@pulumi/docker` package

2. **Containers not starting**
   - Check Docker daemon is running: `docker info`
   - View container logs: `docker logs <container-name>`

3. **Port conflicts**
   - Ensure ports 8080, 8081, 7080, 7081 are available
   - Use `netstat -an | grep LISTEN` to check

4. **Permission errors**
   - Ensure Docker is running and accessible
   - On Linux, add user to docker group: `sudo usermod -aG docker $USER`