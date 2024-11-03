import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { APIGatewayEvent } from "aws-lambda";

const bedRockClient = new BedrockRuntimeClient({ region: "us-east-1" });
const s3Client = new S3Client({ region: "us-east-1" });
const modelId = "stability.stable-diffusion-xl-v1";
const bucketName = process.env.S3_BUCKET_NAME;

export const handler = async (event: APIGatewayEvent) => {
  console.info("event: \n" + JSON.stringify(event, null, 2));
  const prompt = event.queryStringParameters?.prompt;
  if (!prompt) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "prompt is required",
      }),
    };
  }
  const body = JSON.stringify({
    text_prompts: [
      {
        text: prompt,
      },
    ],
    cfg_scale: 10,
    seed: 0,
    steps: 50,
    width: 1024,
    height: 1024,
  });

  const command = new InvokeModelCommand({
    modelId,
    body,
    accept: "application/json",
    contentType: "application/json",
  });

  console.info("command: \n" + JSON.stringify(command, null, 2));
  const response = await bedRockClient.send(command);
  const response_body = JSON.parse(new TextDecoder().decode(response.body));
  const base64 = response_body.artifacts[0].base64;

  const image = Buffer.from(base64, "base64");
  const key = `images/${Date.now()}.png`;
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: image,
  };
  await s3Client.send(new PutObjectCommand(params));

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    }),
    {
      expiresIn: 900,
    }
  );
  return {
    statusCode: 200,
    body: JSON.stringify({
      url: url,
    }),
  };
};
