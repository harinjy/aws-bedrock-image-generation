#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsBedrockImageGenerationStack } from '../lib/aws-bedrock-image-generation-stack';

const app = new cdk.App();
new AwsBedrockImageGenerationStack(app, 'AwsBedrockImageGenerationStack', {

});