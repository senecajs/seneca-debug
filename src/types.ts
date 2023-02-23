import { IncomingMessage, Server, ServerResponse } from "http";
import { WebSocketServer } from "ws";
import DebugDataStore from "./DebugDataStore";

export interface DebugDataStoreItem {
  id: string;
  debugDataStore: DebugDataStore;
  active: boolean;
}

export interface SenecaSharedInstance {
  expressIsReady?: boolean;
  active?: boolean;
  expressApp?: Server<typeof IncomingMessage, typeof ServerResponse>;
  wsServer?: any; // ws.Server<ws.WebSocket>
  debugDataStores: DebugDataStoreItem[];
} 