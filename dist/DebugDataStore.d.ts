export default class DebugDataStore {
    private top;
    private msgmap;
    private msgmapchildren;
    private msgmapdata;
    get(): {
        msgmap: Record<string, any>;
        top: {
            items: never[];
        };
        msgmapchildren: Record<string, any>;
        msgmapdata: Record<string, any>;
    };
    handle(data: any): void;
}
