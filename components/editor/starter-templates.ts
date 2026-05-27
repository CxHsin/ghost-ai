"use client";

import {
  CANVAS_EDGE_TYPE,
  CANVAS_NODE_TYPE,
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeColor,
  type CanvasNodeShape,
} from "@/types/canvas";

export interface CanvasTemplate {
  description: string;
  edges: CanvasEdge[];
  id: string;
  name: string;
  nodes: CanvasNode[];
}

function getCanvasColor(index: number): CanvasNodeColor {
  return NODE_COLORS[index] ?? NODE_COLORS[0];
}

function createTemplateNode(config: {
  color?: CanvasNodeColor;
  height: number;
  id: string;
  label: string;
  position: { x: number; y: number };
  shape?: CanvasNodeShape;
  width: number;
}): CanvasNode {
  return {
    id: config.id,
    type: CANVAS_NODE_TYPE,
    position: config.position,
    width: config.width,
    height: config.height,
    data: {
      label: config.label,
      color: config.color ?? getCanvasColor(0),
      shape: config.shape ?? "rectangle",
    },
  };
}

function createTemplateEdge(config: {
  id: string;
  label?: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
}): CanvasEdge {
  return {
    id: config.id,
    type: CANVAS_EDGE_TYPE,
    source: config.source,
    target: config.target,
    sourceHandle: config.sourceHandle,
    targetHandle: config.targetHandle,
    data: {
      label: config.label ?? "",
    },
    markerEnd: {
      type: "arrowclosed",
      color: "rgba(240, 240, 244, 0.92)",
      width: 16,
      height: 16,
    },
    style: {
      stroke: "rgba(240, 240, 244, 0.56)",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: 1.5,
    },
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices-platform",
    name: "Microservices Platform",
    description:
      "API gateway, service boundaries, and async infrastructure for a modular product backend.",
    nodes: [
      createTemplateNode({
        id: "micro-client",
        label: "Web Client",
        position: { x: 80, y: 180 },
        width: 190,
        height: 96,
        shape: "pill",
        color: getCanvasColor(1),
      }),
      createTemplateNode({
        id: "micro-gateway",
        label: "API Gateway",
        position: { x: 340, y: 180 },
        width: 220,
        height: 108,
        color: getCanvasColor(7),
      }),
      createTemplateNode({
        id: "micro-auth",
        label: "Auth Service",
        position: { x: 650, y: 60 },
        width: 200,
        height: 96,
        shape: "pill",
        color: getCanvasColor(2),
      }),
      createTemplateNode({
        id: "micro-orders",
        label: "Orders Service",
        position: { x: 650, y: 180 },
        width: 220,
        height: 108,
        color: getCanvasColor(3),
      }),
      createTemplateNode({
        id: "micro-billing",
        label: "Billing Service",
        position: { x: 650, y: 320 },
        width: 220,
        height: 108,
        color: getCanvasColor(4),
      }),
      createTemplateNode({
        id: "micro-broker",
        label: "Event Bus",
        position: { x: 980, y: 180 },
        width: 180,
        height: 180,
        shape: "circle",
        color: getCanvasColor(6),
      }),
      createTemplateNode({
        id: "micro-user-db",
        label: "Users DB",
        position: { x: 1280, y: 40 },
        width: 220,
        height: 132,
        shape: "cylinder",
      }),
      createTemplateNode({
        id: "micro-orders-db",
        label: "Orders DB",
        position: { x: 1280, y: 190 },
        width: 220,
        height: 132,
        shape: "cylinder",
      }),
      createTemplateNode({
        id: "micro-billing-db",
        label: "Billing DB",
        position: { x: 1280, y: 340 },
        width: 220,
        height: 132,
        shape: "cylinder",
      }),
    ],
    edges: [
      createTemplateEdge({
        id: "micro-edge-client-gateway",
        source: "micro-client",
        target: "micro-gateway",
      }),
      createTemplateEdge({
        id: "micro-edge-gateway-auth",
        source: "micro-gateway",
        target: "micro-auth",
      }),
      createTemplateEdge({
        id: "micro-edge-gateway-orders",
        source: "micro-gateway",
        target: "micro-orders",
      }),
      createTemplateEdge({
        id: "micro-edge-gateway-billing",
        source: "micro-gateway",
        target: "micro-billing",
      }),
      createTemplateEdge({
        id: "micro-edge-auth-broker",
        source: "micro-auth",
        target: "micro-broker",
        label: "user events",
      }),
      createTemplateEdge({
        id: "micro-edge-orders-broker",
        source: "micro-orders",
        target: "micro-broker",
        label: "order events",
      }),
      createTemplateEdge({
        id: "micro-edge-billing-broker",
        source: "micro-billing",
        target: "micro-broker",
        label: "payment events",
      }),
      createTemplateEdge({
        id: "micro-edge-auth-db",
        source: "micro-auth",
        target: "micro-user-db",
      }),
      createTemplateEdge({
        id: "micro-edge-orders-db",
        source: "micro-orders",
        target: "micro-orders-db",
      }),
      createTemplateEdge({
        id: "micro-edge-billing-db",
        source: "micro-billing",
        target: "micro-billing-db",
      }),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Source control through automated verification, artifact publishing, and staged deployment.",
    nodes: [
      createTemplateNode({
        id: "cicd-dev",
        label: "Developer",
        position: { x: 80, y: 170 },
        width: 180,
        height: 96,
        shape: "pill",
        color: getCanvasColor(1),
      }),
      createTemplateNode({
        id: "cicd-repo",
        label: "Git Repository",
        position: { x: 330, y: 170 },
        width: 220,
        height: 108,
        color: getCanvasColor(7),
      }),
      createTemplateNode({
        id: "cicd-build",
        label: "Build + Test",
        position: { x: 640, y: 50 },
        width: 220,
        height: 108,
        color: getCanvasColor(3),
      }),
      createTemplateNode({
        id: "cicd-security",
        label: "Security Scan",
        position: { x: 640, y: 190 },
        width: 220,
        height: 108,
        color: getCanvasColor(4),
      }),
      createTemplateNode({
        id: "cicd-approval",
        label: "Release Approval",
        position: { x: 670, y: 350 },
        width: 160,
        height: 160,
        shape: "diamond",
        color: getCanvasColor(5),
      }),
      createTemplateNode({
        id: "cicd-artifacts",
        label: "Artifact Registry",
        position: { x: 980, y: 80 },
        width: 220,
        height: 132,
        shape: "cylinder",
      }),
      createTemplateNode({
        id: "cicd-staging",
        label: "Staging",
        position: { x: 980, y: 260 },
        width: 200,
        height: 96,
        shape: "hexagon",
        color: getCanvasColor(6),
      }),
      createTemplateNode({
        id: "cicd-prod",
        label: "Production",
        position: { x: 1280, y: 260 },
        width: 220,
        height: 108,
        shape: "hexagon",
        color: getCanvasColor(2),
      }),
    ],
    edges: [
      createTemplateEdge({
        id: "cicd-edge-dev-repo",
        source: "cicd-dev",
        target: "cicd-repo",
        label: "push",
      }),
      createTemplateEdge({
        id: "cicd-edge-repo-build",
        source: "cicd-repo",
        target: "cicd-build",
        label: "trigger",
      }),
      createTemplateEdge({
        id: "cicd-edge-build-security",
        source: "cicd-build",
        target: "cicd-security",
      }),
      createTemplateEdge({
        id: "cicd-edge-security-approval",
        source: "cicd-security",
        target: "cicd-approval",
      }),
      createTemplateEdge({
        id: "cicd-edge-approval-artifacts",
        source: "cicd-approval",
        target: "cicd-artifacts",
        label: "approved",
      }),
      createTemplateEdge({
        id: "cicd-edge-artifacts-staging",
        source: "cicd-artifacts",
        target: "cicd-staging",
      }),
      createTemplateEdge({
        id: "cicd-edge-staging-prod",
        source: "cicd-staging",
        target: "cicd-prod",
        label: "promote",
      }),
    ],
  },
  {
    id: "event-driven-system",
    name: "Event-Driven System",
    description:
      "A decoupled ingest and processing flow with streaming, fan-out consumers, and analytics storage.",
    nodes: [
      createTemplateNode({
        id: "event-clients",
        label: "Clients",
        position: { x: 80, y: 200 },
        width: 180,
        height: 140,
        shape: "circle",
        color: getCanvasColor(1),
      }),
      createTemplateNode({
        id: "event-ingest",
        label: "Ingest API",
        position: { x: 360, y: 210 },
        width: 220,
        height: 108,
        color: getCanvasColor(7),
      }),
      createTemplateNode({
        id: "event-stream",
        label: "Streaming Topic",
        position: { x: 690, y: 180 },
        width: 200,
        height: 180,
        shape: "circle",
        color: getCanvasColor(6),
      }),
      createTemplateNode({
        id: "event-processor",
        label: "Processing Worker",
        position: { x: 1010, y: 60 },
        width: 230,
        height: 108,
        shape: "pill",
        color: getCanvasColor(3),
      }),
      createTemplateNode({
        id: "event-notify",
        label: "Notification Worker",
        position: { x: 1010, y: 200 },
        width: 230,
        height: 108,
        shape: "pill",
        color: getCanvasColor(5),
      }),
      createTemplateNode({
        id: "event-analytics",
        label: "Analytics Worker",
        position: { x: 1010, y: 340 },
        width: 230,
        height: 108,
        shape: "pill",
        color: getCanvasColor(2),
      }),
      createTemplateNode({
        id: "event-ops-db",
        label: "Operational Store",
        position: { x: 1360, y: 50 },
        width: 240,
        height: 132,
        shape: "cylinder",
      }),
      createTemplateNode({
        id: "event-email",
        label: "Email Provider",
        position: { x: 1360, y: 210 },
        width: 220,
        height: 190,
        shape: "hexagon",
        color: getCanvasColor(4),
      }),
      createTemplateNode({
        id: "event-warehouse",
        label: "Data Warehouse",
        position: { x: 1360, y: 370 },
        width: 240,
        height: 132,
        shape: "cylinder",
        color: getCanvasColor(0),
      }),
    ],
    edges: [
      createTemplateEdge({
        id: "event-edge-clients-ingest",
        source: "event-clients",
        target: "event-ingest",
      }),
      createTemplateEdge({
        id: "event-edge-ingest-stream",
        source: "event-ingest",
        target: "event-stream",
      }),
      createTemplateEdge({
        id: "event-edge-stream-processor",
        source: "event-stream",
        target: "event-processor",
      }),
      createTemplateEdge({
        id: "event-edge-stream-notify",
        source: "event-stream",
        target: "event-notify",
      }),
      createTemplateEdge({
        id: "event-edge-stream-analytics",
        source: "event-stream",
        target: "event-analytics",
      }),
      createTemplateEdge({
        id: "event-edge-processor-db",
        source: "event-processor",
        target: "event-ops-db",
      }),
      createTemplateEdge({
        id: "event-edge-notify-email",
        source: "event-notify",
        target: "event-email",
      }),
      createTemplateEdge({
        id: "event-edge-analytics-warehouse",
        source: "event-analytics",
        target: "event-warehouse",
      }),
    ],
  },
];
