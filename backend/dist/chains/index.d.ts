import { ChainClient } from "./types";
declare class ChainRegistry {
    private clients;
    constructor();
    getClient(slug: string): ChainClient;
}
export declare const chainRegistry: ChainRegistry;
export {};
//# sourceMappingURL=index.d.ts.map