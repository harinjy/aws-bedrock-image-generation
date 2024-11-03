import { Stack, StackProps, RemovalPolicy, Duration } from "aws-cdk-lib";
import { Bucket, BlockPublicAccess } from "aws-cdk-lib/aws-s3";
import { Function, Runtime, Code } from "aws-cdk-lib/aws-lambda";
import {
  EndpointType,
  RestApi,
  LambdaIntegration,
  Cors,
  ApiKeySourceType,
  ApiKey,
} from "aws-cdk-lib/aws-apigateway";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import path = require("path");

export class AwsBedrockImageGenerationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3Store = new Bucket(this, "S3Store", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const lambda = new Function(this, "Lambda", {
      runtime: Runtime.NODEJS_18_X,
      handler: "index.handler",
      timeout: Duration.minutes(5),
      code: Code.fromAsset(path.join(__dirname, "lambda")),
      environment: {
        S3_BUCKET_NAME: s3Store.bucketName,
      },
    });
    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["bedrock:*"],
        resources: ["*"],
      })
    );
    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["s3:PutObject", "s3:GetObject"],
        resources: [s3Store.bucketArn + "/*"],
      })
    );

    const api = new RestApi(this, "Api", {
      restApiName: "BedrockAPI",
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
      apiKeySourceType: ApiKeySourceType.HEADER,
      endpointConfiguration: {
        types: [EndpointType.REGIONAL],
      },
      deployOptions: {
        tracingEnabled: true,
      },
    });
    const endpoint = api.root.addResource("images");
    endpoint.addMethod("GET", new LambdaIntegration(lambda), {
      apiKeyRequired: true,
    });

    const apiKey = new ApiKey(this, "BedrockAPIKey");

    const usagePlan = api.addUsagePlan("UsagePlan", {
      name: "UsagePlan",
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
      apiStages: [
        {
          api: api,
          stage: api.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey);
  }
}
