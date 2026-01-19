import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  SimpleSpanProcessor,
  NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { DiagConsoleLogger, DiagLogLevel, diag } from "@opentelemetry/api";
import { env } from "./env";

// Enable debug logging to see what's happening
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

console.log("Axiom Dataset:", env.AXIOM_DATASET_NAME);
console.log("Axiom Token (first 10 chars):", env.AXIOM_API_TOKEN?.substring(0, 10));

const exporter = new OTLPTraceExporter({
  url: "https://api.axiom.co/v1/traces",
  headers: {
    Authorization: `Bearer ${env.AXIOM_API_TOKEN}`,
    "X-Axiom-Dataset": env.AXIOM_DATASET_NAME,
  },
});

const provider = new NodeTracerProvider({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: "next-app",
  }),
  spanProcessors: [new SimpleSpanProcessor(exporter)],
});

// Register the provider globally so trace.getTracer() works
provider.register();

console.log("OpenTelemetry instrumentation initialized");
