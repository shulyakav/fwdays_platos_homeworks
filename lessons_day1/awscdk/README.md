# Homework: Deploying S3 Buckets with AWS CDK and LocalStack

## **Objective**
In this assignment, you will:
1. Install and configure **LocalStack**, **AWS CDK**, and **cdklocal**.
2. Set up the required environment variables.
3. Create two AWS CDK stacks where each stack has:
   - An **S3 bucket** with a unique name.
   - An **IAM role** with an **IAM policy** that grants permissions to the bucket.
4. Deploy the stacks using **LocalStack**.

---

## **Part 1: Installation & Configuration**

### **Step 1: Install Required Tools**
Ensure you have the following installed on your system:
- **Docker** (Required for LocalStack)
- **Node.js (v18+)**
- **AWS CDK**
- **LocalStack**
- **cdklocal**

#### **1. Install LocalStack**
```sh
pip install localstack
```

#### **2. Install AWS CDK**
```sh
npm install -g aws-cdk
```

#### **3. Install cdklocal (wrapper for AWS CDK in LocalStack)**
```sh
npm install -g aws-cdk-local
```

#### **4. Start LocalStack**
```sh
localstack start
```

#### **5. Verify LocalStack is Running**
```sh
curl http://localhost:4566/_localstack/health | jq .
```
You should see an output indicating that LocalStack services are running.

---

## **Part 2: Set Environment Variables**
Export the necessary AWS credentials and region settings:
```sh
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_REGION=us-west-2
export CDK_DEFAULT_ACCOUNT=000000000000
export CDK_DEFAULT_REGION=us-west-2
export AWS_ENDPOINT_URL=http://localhost:4566
```

---

## **Part 3: Create the AWS CDK Project**

### **Step 1: Initialize the CDK Project**
```sh
mkdir cdk-localstack-demo && cd cdk-localstack-demo
cdk init app --language=typescript
```

### **Step 2: Install Required CDK Packages**
```sh
npm install @aws-cdk/aws-s3 @aws-cdk/aws-iam
```

---

## **Part 4: Implement the CDK Stacks**

### **Modify `lib/cdk-localstack-demo-stack.ts`**
Replace the contents with:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class CdkLocalStackDemoStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Create S3 Bucket
        const bucket = new s3.Bucket(this, 'MyBucket', {
            bucketName: `my-unique-bucket-${id.toLowerCase()}`,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // Create IAM Role
        const role = new iam.Role(this, 'MyRole', {
            assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        });

        // Attach Policy to Role
        role.addToPolicy(new iam.PolicyStatement({
            actions: ['s3:*'],
            resources: [bucket.bucketArn],
        }));
    }
}
```

### **Step 3: Define Two Stacks in `bin/cdk-localstack-demo.ts`**
Modify the `bin/cdk-localstack-demo.ts` file:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CdkLocalStackDemoStack } from '../lib/cdk-localstack-demo-stack';

const app = new cdk.App();
new CdkLocalStackDemoStack(app, 'StackOne', { env: { region: 'us-west-2' } });
new CdkLocalStackDemoStack(app, 'StackTwo', { env: { region: 'us-west-2' } });
```

---

## **Part 5: Deploy to LocalStack**

### **Step 1: List Available Stacks**
```sh
cdklocal list
```

### **Step 2: Bootstrap the CDK App**
```sh
cdk bootstrap
```

### **Step 3: Check Differences Before Deployment**
```sh
cdklocal diff --all
```

### **Step 4: Deploy All Stacks**
```sh
cdklocal deploy --all
```

---

## **Part 6: Verification**
After deployment, verify the resources:

### **1. List Buckets**
```sh
aws --endpoint-url=$AWS_ENDPOINT_URL s3 ls
```

### **2. Check IAM Roles**
```sh
aws --endpoint-url=$AWS_ENDPOINT_URL iam list-roles
```

If everything is set up correctly, you should see the created S3 buckets and IAM roles in LocalStack.

---

## **Submission**
- Take screenshots of your successful deployment commands and verification outputs.
- Include your modified **CDK TypeScript files**.
- Submit a short write-up on any challenges faced and how you resolved them.

**Good luck! 🚀**


