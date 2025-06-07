# Homework: Creating and Deploying Applications with Timoni

## **Objective**
In this assignment, you will:
1. Install and configure **Timoni** and its prerequisites
2. Create a basic web application module
3. Define module values and bundles
4. Deploy the application to a Kubernetes cluster
5. Implement module versioning and updates

---

## **Part 1: Installation & Configuration**

### **Step 1: Install Required Tools**
Ensure you have the following installed on your system:
- **Go (1.21 or newer)**
- **Kubernetes cluster** (local like minikube/kind or remote)
- **kubectl**
- **Timoni CLI**

#### **1. Install Timoni**
```sh
go install github.com/stefanprodan/timoni@latest
```

#### **2. Verify Installation**
```sh
timoni version
```

---

## **Part 2: Create a Basic Web Application Module**

### **Step 1: Initialize a New Module**
```sh
mkdir my-web-app && cd my-web-app
timoni mod init
```

---

## **Part 3: Implement Module Components**

### **Step 1: Define the Main Module File**
Modify the generated `timoni.cue` with your module metadata and schema:

```cue
module: {
    name: "my-web-app"
    version: "1.0.0"
}

values: {
    // Define your values schema here
    appName: string
    image: string
    port: int | *80
    replicas: int | *1
    env: [...{
        name: string
        value: string
    }]
}
```

### **Step 2: Create Kubernetes Resources**
Implement the following templates in your generated templates directory:

1. Deployment template (`templates/deployment.cue`)
2. Service template (`templates/service.cue`)
3. ConfigMap template (`templates/configmap.cue`)

---

## **Part 4: Module Values and Bundles**

### **Step 1: Create Values File**
Create a `values.yaml` file:

```yaml
appName: "web-demo"
image: "nginx:latest"
port: 80
replicas: 2
env:
  - name: "ENV"
    value: "production"
```

### **Step 2: Create a Bundle**
Create a `bundle.yaml` file for managing multiple instances:

```yaml
name: web-bundle
modules:
  - name: web-prod
    module: ./my-web-app
    values:
      appName: "web-prod"
      replicas: 3
  - name: web-staging
    module: ./my-web-app
    values:
      appName: "web-staging"
      replicas: 1
```

---

## **Part 5: Building and Previewing**

### **Step 1: Build and Preview the Module**
To see the generated Kubernetes YAML without deploying:
```sh
timoni build web-prod ./my-web-app \
  --namespace default \
  --values values.yaml
```

### **Step 2: Build Bundle**
To preview all resources that would be created by the bundle:
```sh
timoni bundle build -f bundle.yaml
```

These commands will output the complete Kubernetes YAML that would be applied to the cluster, allowing students to:
- Review the resource definitions
- Validate the configuration
- Understand how their CUE templates are transformed into Kubernetes manifests
- Debug any issues before actual deployment

The `build` command is perfect for local development and learning as it:
- Is completely safe (read-only operation)
- Shows exactly what would be deployed
- Helps understand the relationship between CUE templates and resulting Kubernetes resources
- Makes it easier to spot configuration errors

---

## **Part 6: Module Updates and Testing**

### **Step 1: Update Module**
Make changes to your module templates or values

### **Step 2: Test and Deploy Updates**
```sh
# Test the changes
timoni lint web-prod ./my-web-app --values values.yaml

# Apply the updates
timoni apply web-prod ./my-web-app --values values.yaml
```

---

## **Submission Requirements**
1. Submit your complete module code including:
   - All CUE templates
   - Values files
   - Bundle definitions
2. Provide screenshots of:
   - Successful deployments
   - Module status outputs
   - Running applications
3. Write a brief report describing:
   - Your module's architecture
   - Any challenges faced and solutions
   - Lessons learned about Timoni's module system

**Bonus Tasks:**
- Implement health checks
- Add resource limits
- Create multiple environment configurations
- Implement a custom validation schema

**Good luck! 🚀**