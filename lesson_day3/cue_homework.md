# Homework: Working with CUE Lang and Kubernetes Schemas

## **Objective**
In this assignment, you will:
1. Install and configure **CUE**.
2. Learn to define schemas in CUE.
3. Create validation rules for Kubernetes resources.
4. Convert between YAML, JSON, and CUE formats.
5. Use CUE to generate and validate Kubernetes manifests.

---

## **Part 1: Installation & Configuration**

### **Step 1: Install CUE**
```sh
go install cuelang.org/go/cmd/cue@latest
```

### **Step 2: Verify Installation**
```sh
cue version
```

---

## **Part 2: Basic CUE Schema Definition**

### **Step 1: Create a Basic Schema**
Create a file named `person.cue`:

```cue
#Person: {
    name:     string
    age:      int & >=0 & <=120
    email:    string & =~"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    hobbies?: [...string]
}

// Example instance
person: #Person & {
    name:    "John Doe"
    age:     30
    email:   "john@example.com"
    hobbies: ["reading", "coding"]
}
```

---

## **Part 3: Kubernetes Resource Validation**

### **Step 1: Create a Deployment Schema**
Create `deployment.cue`:

```cue
#KubernetesDeployment: {
    apiVersion: "apps/v1"
    kind:       "Deployment"
    metadata: {
        name:      string
        namespace: string | *"default"
    }
    spec: {
        replicas: int & >=1 & <=10
        selector: matchLabels: {
            app: string
        }
        template: {
            metadata: labels: {
                app: string
            }
            spec: containers: [...{
                name:  string
                image: string
                ports?: [...{
                    containerPort: int & >=1 & <=65535
                }]
            }]
        }
    }
}
```

### **Step 2: Create a Valid Deployment**
Create `my-deployment.cue`:

```cue
deployment: #KubernetesDeployment & {
    metadata: {
        name: "nginx-deployment"
    }
    spec: {
        replicas: 3
        selector: matchLabels: {
            app: "nginx"
        }
        template: {
            metadata: labels: {
                app: "nginx"
            }
            spec: containers: [{
                name:  "nginx"
                image: "nginx:1.14.2"
                ports: [{
                    containerPort: 80
                }]
            }]
        }
    }
}
```

---

## **Part 4: Format Conversion**

### **Step 1: Convert Between Formats**
Practice converting between formats using these commands:

```sh
# Export to JSON
cue export deployment.cue --out json

# Export to YAML
cue export deployment.cue --out yaml

# Validate against schema
cue vet deployment.cue
```

---

## **Part 5: Advanced Tasks**

### **Create a Multi-Resource Configuration**
Combine multiple Kubernetes resources (Deployment, Service, ConfigMap) in a single CUE configuration with proper validation.

### **Define Custom Validation Rules**
Create custom validation rules for your Kubernetes resources, such as:
- Enforcing resource naming conventions
- Validating image tags
- Checking for required labels
- Setting resource limits and requests

---

## **Submission Requirements**
1. Submit screenshots

**Bonus Tasks:**
- Create a CUE module that can be imported and reused
- Implement template functions for generating multiple similar resources
- Add comprehensive error messages for validation failures

---

**Good luck! 🎯**


