import * as Y from 'yjs';

interface YjsInitMessage {
    type: 'yjs_init';
    state: string;
}

interface YjsUpdateMessage {
    type: 'yjs_update';
    update: string;
}

export type YjsMessage = YjsInitMessage | YjsUpdateMessage;
// We'll create a simple provider that attaches to our custom WebSocket client
export class CustomYjsProvider {
    public doc: Y.Doc;
    private wsSend: (msg: Record<string, unknown>) => void;
    private isSynced = false;

    constructor(doc: Y.Doc, wsSend: (msg: Record<string, unknown>) => void) {
        this.doc = doc;
        this.wsSend = wsSend;

        // Listen to local changes and send them to the server
        this.doc.on('update', (update: Uint8Array) => {
            // Y.encodeStateAsUpdate returns Uint8Array, we base64 encode it for our JSON WS
            const updateBase64 = btoa(String.fromCharCode(...new Uint8Array(update)));
            this.wsSend({
                type: 'yjs_update',
                update: updateBase64,
            });
        });
    }

    // Handle incoming 'yjs_init' or 'yjs_update' messages from the server
    public handleMessage(msg: YjsMessage) {
        if (msg.type === 'yjs_init') {
            const stateBuffer = Uint8Array.from(atob(msg.state), c => c.charCodeAt(0));
            Y.applyUpdate(this.doc, stateBuffer);
            this.isSynced = true;
        } else if (msg.type === 'yjs_update') {
            const updateBuffer = Uint8Array.from(atob(msg.update), c => c.charCodeAt(0));
            Y.applyUpdate(this.doc, updateBuffer);
        }
    }
}
