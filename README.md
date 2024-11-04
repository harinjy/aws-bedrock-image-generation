# AWS Bedrock Image Generation

This project uses AWS CDK to set up an infrastructure for image generation using AWS Bedrock.

## Project Overview

This CDK application deploys the necessary resources to leverage AWS Bedrock for image generation tasks. AWS Bedrock is a fully managed service that makes it easy to use foundation models from leading AI companies through an API.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (version 18.x or later)
- AWS CDK CLI
- AWS CLI configured with appropriate credentials
- Model requested and available in your AWS account

## Installation

1. Clone this repository
2. Navigate to the project directory
3. Install dependencies
4. Synthesize the CloudFormation template
5. Deploy the stack

```sh
npm install
npm build
cdk synth
cdk deploy
```

## Cleaning Up

To avoid incurring future charges, remember to destroy the resources when you're done:

```sh
cdk destroy
```
