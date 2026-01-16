import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { SimpleSpanProcessor } from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { env } from "./env";

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "next-app",
  }),
  spanProcessor: new SimpleSpanProcessor(
    new OTLPTraceExporter({
      url: `https://api.axiom.co/v1/traces`,
      headers: {
        Authorization: `Bearer ${env.AXIOM_API_TOKEN}`,
        "X-Axiom-Dataset": `${env.AXIOM_DATASET_NAME}`,
      },
    }),
  ),
});
sdk.start();
