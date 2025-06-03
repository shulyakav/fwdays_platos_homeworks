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
curl -fsSL https://get.pulumi.com | sh
```

#### **2. Verify Installation**
```sh
pulumi version
```

---

## **Part 2: Set Up the Pulumi Project**

### **Step 1: Initialize the Project**
```sh
mkdir pulumi-docker-demo && cd pulumi-docker-demo
pulumi new docker-typescript
```

### **Step 2: Install Required Pulumi Packages**
```sh
npm install @pulumi/docker
```

---

## **Part 3: Implement the Web Application Stack**

### **Modify `index.ts`**
Replace the contents with:

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as docker from "@pulumi/docker";

class WebAppStack extends pulumi.ComponentResource {
    constructor(name: string, port: number, opts?: pulumi.ComponentResourceOptions) {
        super("custom:resource:WebAppStack", name, {}, opts);

        // Create a Docker network
        const network = new docker.Network(`${name}-network`, {
            name: `webapp-network-${name}`,
        }, { parent: this });

        // Create Redis container
        const redisImage = new docker.RemoteImage(`${name}-redis-image`, {
            name: "redis:latest",
        }, { parent: this });

        const redisContainer = new docker.Container(`${name}-redis`, {
            image: redisImage.imageId,
            networksAdvanced: [{ name: network.name }],
            ports: [{ internal: 6379, external: port + 1000 }],
        }, { parent: this });

        // Create Nginx container
        const nginxImage = new docker.RemoteImage(`${name}-nginx-image`, {
            name: "nginx:latest",
        }, { parent: this });

        new docker.Container(`${name}-nginx`, {
            image: nginxImage.imageId,
            networksAdvanced: [{ name: network.name }],
            ports: [{ internal: 80, external: port }],
            envs: [`REDIS_HOST=${redisContainer.name}`],
        }, { parent: this });
    }
}

// Create two stacks
const stack1 = new WebAppStack("stack1", 8081);
const stack2 = new WebAppStack("stack2", 8082);
```

---

## **Part 4: Deploy the Web Application Stacks**

### **Step 1: Install Dependencies**
```sh
npm install
```

### **Step 2: Deploy Both Stacks**
```sh
pulumi up --yes
```

---

## **Part 5: Verification**

### **1. Check Running Containers**
```sh
docker ps
```
You should see two Nginx containers and two Redis containers running.

### **2. Access Web Application**
Open your browser and navigate to:
- **StackOne:** [http://localhost:8081](http://localhost:8081)
- **StackTwo:** [http://localhost:8082](http://localhost:8082)

### **3. Destroy the Deployment**
Once you're done, clean up the environment:
```sh
pulumi destroy --yes
```

---

## **Submission**
- Take screenshots of the running web applications.
- Include your **Pulumi TypeScript files**.
- Write a short reflection on any challenges faced and how you resolved them.

**Happy Deploying! 🚀**
