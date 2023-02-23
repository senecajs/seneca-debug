/// <reference types="node" />
import { IncomingMessage, Server, ServerResponse } from "http";
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
    wsServer?: any;
    debugDataStores: DebugDataStoreItem[];
}
