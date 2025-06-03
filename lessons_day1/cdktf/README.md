# Homework: Deploying WordPress with CDKTF and Docker

## **Objective**
In this assignment, you will:
1. Install and configure **CDKTF (Cloud Development Kit for Terraform)**.
2. Set up **Docker** as the provider.
3. Create two CDKTF stacks where each stack:
   - Deploys a **WordPress container**.
   - Uses a **MySQL database container** as the backend.
   - Has a unique configuration (e.g., different port mappings).
4. Deploy the stacks on your local machine using **Docker**.

---

## **Part 1: Installation & Configuration**

### **Step 1: Install Required Tools**
Ensure you have the following installed:
- **Docker** (for running containers locally)
- **Node.js (v18+)**
- **CDKTF** (Cloud Development Kit for Terraform)

#### **1. Install Terraform**
```sh
curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
sudo apt-get update && sudo apt-get install terraform
```

#### **2. Install CDKTF**
```sh
npm install -g cdktf-cli
```

#### **3. Verify Installation**
```sh
terraform --version
cdktf --version
```

---

## **Part 2: Set Up the CDKTF Project**

### **Step 1: Initialize the Project**
```sh
mkdir cdktf-docker-wordpress && cd cdktf-docker-wordpress
cdktf init --template=typescript --local
```

### **Step 2: Install Required CDKTF Packages**
```sh
npm install @cdktf/provider-docker
```

---

## **Part 3: Implement the WordPress Stack**

### **Modify `main.ts`**
Replace the contents with:

```typescript
import { App, TerraformStack } from "cdktf";
import { DockerProvider, Container, Image, Network } from "@cdktf/provider-docker";
import { Construct } from "constructs";

class WordPressStack extends TerraformStack {
  constructor(scope: Construct, id: string, port: number) {
    super(scope, id);

    new DockerProvider(this, "docker", {});

    const network = new Network(this, "network", {
      name: `wordpress-network-${id}`,
    });

    const mysqlImage = new Image(this, "mysql-image", {
      name: "mysql:5.7",
      keepLocally: false,
    });

    const wordpressImage = new Image(this, "wordpress-image", {
      name: "wordpress:latest",
      keepLocally: false,
    });

    const mysqlContainer = new Container(this, "mysql-container", {
      name: `mysql-${id}`,
      image: mysqlImage.latest,
      networksAdvanced: [{ name: network.name }],
      env: [
        "MYSQL_ROOT_PASSWORD=rootpass",
        "MYSQL_DATABASE=wordpress",
        "MYSQL_USER=wpuser",
        "MYSQL_PASSWORD=wppass",
      ],
      ports: [{ internal: 3306, external: port + 1000 }],
    });

    new Container(this, "wordpress-container", {
      name: `wordpress-${id}`,
      image: wordpressImage.latest,
      networksAdvanced: [{ name: network.name }],
      env: [
        "WORDPRESS_DB_HOST=mysql",
        "WORDPRESS_DB_USER=wpuser",
        "WORDPRESS_DB_PASSWORD=wppass",
        "WORDPRESS_DB_NAME=wordpress",
      ],
      ports: [{ internal: 80, external: port }],
      dependsOn: [mysqlContainer],
    });
  }
}

const app = new App();
new WordPressStack(app, "StackOne", 8081);
new WordPressStack(app, "StackTwo", 8082);
app.synth();
```

---

## **Part 4: Deploy the WordPress Stacks**

### **Step 1: Install CDKTF Dependencies**
```sh
npm install
```

### **Step 2: Generate Terraform Configuration**
```sh
cdktf synth
```

### **Step 3: Deploy Both Stacks**
```sh
cdktf deploy --auto-approve
```

---

## **Part 5: Verification**

### **1. Check Running Containers**
```sh
docker ps
```
You should see two WordPress containers and two MySQL containers running.

### **2. Access WordPress**
Open your browser and navigate to:
- **StackOne:** [http://localhost:8081](http://localhost:8081)
- **StackTwo:** [http://localhost:8082](http://localhost:8082)

### **3. Destroy the Deployment**
Once you're done, clean up the environment:
```sh
cdktf destroy --auto-approve
```

---

## **Submission**
- Take screenshots of the running WordPress instances.
- Include your **CDKTF TypeScript files**.
- Write a short reflection on any challenges faced and how you resolved them.

**Happy Deploying! 🚀**
