# Homework: Creating a Custom Operator with Operator SDK

## **Objective**
In this assignment, you will:
1. Install and configure **Operator SDK**.
2. Create a custom operator for a simple application.
3. Implement a controller that manages the lifecycle of custom resources.
4. Test the operator's functionality in a local Kubernetes cluster.

---

## **Part 1: Installation & Configuration**

### **Step 1: Install Required Tools**
Ensure you have the following installed:
- **Docker**
- **kubectl**
- **Operator SDK**
- **go (v1.19+)**

#### **1. Install Operator SDK**
```sh
# Download the release binary
export ARCH=$(case $(uname -m) in x86_64) echo -n amd64 ;; aarch64) echo -n arm64 ;; *) echo -n $(uname -m) ;; esac)
export OS=$(uname | awk '{print tolower($0)}')
export OPERATOR_SDK_DL_URL=https://github.com/operator-framework/operator-sdk/releases/download/v1.28.0
curl -LO ${OPERATOR_SDK_DL_URL}/operator-sdk_${OS}_${ARCH}
chmod +x operator-sdk_${OS}_${ARCH} && sudo mv operator-sdk_${OS}_${ARCH} /usr/local/bin/operator-sdk
```

#### **2. Verify Installation**
```sh
operator-sdk version
```

---

## **Part 2: Create the Operator SDK Project**

### **Step 1: Initialize the Project**
```sh
mkdir operator-demo && cd operator-demo
operator-sdk init --domain my.domain --repo my.domain/demo
```

### **Step 2: Create API and Controller**
```sh
operator-sdk create api --group apps --version v1 --kind Demo
```

---

## **Part 3: Implement the Custom Operator**

### **Step 1: Define the Custom Resource**
Modify `api/v1/demo_types.go`:

```go
package v1

import (
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// DemoSpec defines the desired state of Demo
type DemoSpec struct {
    // Message is a custom message to be displayed
    Message string `json:"message,omitempty"`
    
    // Replicas is the number of desired replicas
    Replicas int32 `json:"replicas,omitempty"`
}

// DemoStatus defines the observed state of Demo
type DemoStatus struct {
    // AvailableReplicas is the number of available replicas
    AvailableReplicas int32 `json:"availableReplicas,omitempty"`
    
    // LastUpdated is the last time the status was updated
    LastUpdated metav1.Time `json:"lastUpdated,omitempty"`
}

//+kubebuilder:object:root=true
//+kubebuilder:subresource:status

// Demo is the Schema for the demos API
type Demo struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`

    Spec   DemoSpec   `json:"spec,omitempty"`
    Status DemoStatus `json:"status,omitempty"`
}

//+kubebuilder:object:root=true

// DemoList contains a list of Demo
type DemoList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata,omitempty"`
    Items           []Demo `json:"items"`
}

func init() {
    SchemeBuilder.Register(&Demo{}, &DemoList{})
}
```

### **Step 2: Implement the Controller**
Modify `controllers/demo_controller.go`:

```go
package controllers

import (
    "context"
    "time"

    "k8s.io/apimachinery/pkg/runtime"
    ctrl "sigs.k8s.io/controller-runtime"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/log"

    appsv1 "my.domain/demo/api/v1"
)

// DemoReconciler reconciles a Demo object
type DemoReconciler struct {
    client.Client
    Scheme *runtime.Scheme
}

//+kubebuilder:rbac:groups=apps.my.domain,resources=demos,verbs=get;list;watch;create;update;patch;delete
//+kubebuilder:rbac:groups=apps.my.domain,resources=demos/status,verbs=get;update;patch
//+kubebuilder:rbac:groups=apps.my.domain,resources=demos/finalizers,verbs=update

func (r *DemoReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
    log := log.FromContext(ctx)
    
    // Fetch the Demo instance
    demo := &appsv1.Demo{}
    if err := r.Get(ctx, req.NamespacedName, demo); err != nil {
        return ctrl.Result{}, client.IgnoreNotFound(err)
    }

    // Update status
    demo.Status.AvailableReplicas = demo.Spec.Replicas
    demo.Status.LastUpdated = metav1.Now()
    
    if err := r.Status().Update(ctx, demo); err != nil {
        log.Error(err, "Failed to update Demo status")
        return ctrl.Result{}, err
    }

    return ctrl.Result{RequeueAfter: time.Minute}, nil
}

func (r *DemoReconciler) SetupWithManager(mgr ctrl.Manager) error {
    return ctrl.NewControllerManagedBy(mgr).
        For(&appsv1.Demo{}).
        Complete(r)
}
```

---

## **Part 4: Deploy and Test**

### **Step 1: Generate CRD Manifests**
```sh
make manifests
```

### **Step 2: Install CRDs**
```sh
make install
```

### **Step 3: Run the Controller**
```sh
make run
```

### **Step 4: Create a Demo Resource**
Create `config/samples/apps_v1_demo.yaml`:

```yaml
apiVersion: apps.my.domain/v1
kind: Demo
metadata:
  name: demo-sample
spec:
  message: "Hello from Operator SDK!"
  replicas: 3
```

Apply the sample:
```sh
kubectl apply -f config/samples/apps_v1_demo.yaml
```

### **Step 5: Verify the Resource**
```sh
kubectl get demos
kubectl describe demo demo-sample
```

---

## **Part 5: Build and Deploy the Operator**

### **Step 1: Build the Operator Image**
```sh
make docker-build IMG=my.domain/demo:latest
```

### **Step 2: Deploy the Operator**
```sh
make deploy IMG=my.domain/demo:latest
```

### **Step 3: Verify Operator Deployment**
```sh
kubectl get pods -n demo-system
```

---

## **Part 6: Clean Up**

### **Step 1: Delete the Demo Resource**
```sh
kubectl delete -f config/samples/apps_v1_demo.yaml
```

### **Step 2: Uninstall the Operator**
```sh
make undeploy
```

### **Step 3: Uninstall CRDs**
```sh
make uninstall
```

**Good luck! 🚀** 